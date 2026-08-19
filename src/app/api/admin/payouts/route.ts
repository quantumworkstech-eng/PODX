import { NextRequest, NextResponse } from "next/server";
import { getAdminEmail, logAdminAction } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import { emitNotification } from "@/lib/notifications";
import { createAuditLog, requestContextFrom } from "@/lib/audit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  const status = searchParams.get("status");
  const partnerId = searchParams.get("partner_id");

  let query = supabase
    .from("partner_payout_history")
    .select(`
      *,
      users!partner_payout_history_partner_id_fkey(email),
      profiles(full_name, business_name)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (partnerId) query = query.eq("partner_id", partnerId);

  const { data: payouts, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Totals
  const { data: totals } = await supabase
    .from("partner_payout_history")
    .select("status, payout_amount");

  const summary = {
    total_pending: (totals || []).filter((t) => t.status === "pending").reduce((s, t) => s + t.payout_amount, 0),
    total_processing: (totals || []).filter((t) => t.status === "processing").reduce((s, t) => s + t.payout_amount, 0),
    total_paid: (totals || []).filter((t) => t.status === "paid").reduce((s, t) => s + t.payout_amount, 0),
  };

  return NextResponse.json({ payouts: payouts || [], total: count || 0, page, limit, summary });
}

export async function PATCH(req: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { payout_id, status, reference_number, failure_reason, notes } = await req.json();

  if (!payout_id || !status) {
    return NextResponse.json({ error: "payout_id and status required" }, { status: 400 });
  }

  const validStatuses = ["pending", "processing", "paid", "failed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    status,
    initiated_by: adminEmail,
    updated_at: new Date().toISOString(),
  };
  if (status === "paid") update.processed_at = new Date().toISOString();
  if (reference_number) update.reference_number = reference_number;
  if (failure_reason) update.failure_reason = failure_reason;
  if (notes) update.notes = notes;

  const { data: payout, error } = await supabase
    .from("partner_payout_history")
    .update(update)
    .eq("id", payout_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If paid, mark earnings as paid
  if (status === "paid") {
    await supabase
      .from("partner_earnings")
      .update({ payout_status: "paid", payout_date: new Date().toISOString() })
      .eq("partner_id", payout.partner_id)
      .eq("payout_status", "processing");
  }

  // If failed/cancelled, revert earnings to pending
  if (status === "failed" || status === "cancelled") {
    await supabase
      .from("partner_earnings")
      .update({ payout_status: "pending" })
      .eq("partner_id", payout.partner_id)
      .eq("payout_status", "processing");
  }

  await createAuditLog({
    action: status === "failed" ? "PAYOUT_FAILED" : "PAYOUT_PROCESSED",
    module: "Payments",
    description: `Payout ${payout_id} marked ${status}`,
    actor: { email: adminEmail, name: adminEmail.split("@")[0], role: "admin" },
    recordType: "payout",
    recordId: String(payout_id),
    newValues: { status, reference_number: reference_number ?? null },
    status: status === "failed" ? "FAILED" : "SUCCESS",
    errorMessage: status === "failed" ? failure_reason ?? "Payout failed" : null,
    metadata: { amount: payout.payout_amount, partner_id: payout.partner_id },
    request: requestContextFrom(req),
  });

  // ── Transactional email — emitted after the payout state is committed ─────
  if (status === "paid") {
    await emitNotification("PAYOUT_COMPLETED", {
      partnerId: payout.partner_id,
      payoutId: payout.id,
    });
  } else if (status === "failed") {
    const { data: partner } = await supabase
      .from("users")
      .select("email")
      .eq("id", payout.partner_id)
      .maybeSingle();

    await emitNotification("PAYOUT_FAILED", {
      partnerId: payout.partner_id,
      payoutId: payout.id,
    });
    await emitNotification("ADMIN_PAYOUT_FAILED", {
      partnerId: payout.partner_id,
      payoutId: payout.id,
      metadata: { partnerEmail: partner?.email || null },
    });
  }

  await logAdminAction(adminEmail, `payout_${status}`, "payout", payout_id, { status });

  return NextResponse.json({ payout });
}
