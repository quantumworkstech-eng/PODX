import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createAuditLog, requestContextFrom } from '@/lib/audit';

/** Same storage path as partner uploads; admin-only auth. */
export async function POST(request: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are allowed' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 });
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const filename = `admin-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `studios/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from('studio-images')
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error('Admin upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from('studio-images').getPublicUrl(path);
  await createAuditLog({
    action: 'FILE_UPLOADED',
    module: 'Files',
    description: `Uploaded image ${filename}`,
    recordType: 'file',
    recordId: path,
    recordName: filename,
    metadata: { content_type: file.type, size_bytes: file.size, bucket: 'studio-images' },
    request: requestContextFrom(request),
  });

  return NextResponse.json({ url: publicUrl });
}
