import { supabaseAdmin } from "@/lib/supabase";

export async function getPlatformSetting(key: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) return null;
  return (data?.value ?? null) as string | null;
}

export async function isMaintenanceMode(): Promise<boolean> {
  const v = await getPlatformSetting("maintenance_mode");
  return String(v ?? "false").toLowerCase() === "true";
}

