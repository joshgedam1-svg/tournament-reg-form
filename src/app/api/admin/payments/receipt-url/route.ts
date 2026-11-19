import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/adminAuth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getAdminClient } from '@/lib/supabase/admin';

function getStoragePath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  const input = value.trim();
  const marker = '/storage/v1/object/';
  const markerIndex = input.indexOf(marker);
  let path = input;

  if (markerIndex !== -1) {
    const objectPath = input.slice(markerIndex + marker.length);
    const bucketPrefix = objectPath.match(/^(?:public|sign)\/payment-screenshots\/(.+)$/);
    if (!bucketPrefix) return null;
    path = bucketPrefix[1].split('?')[0];
  }

  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }

  if (!path.startsWith('payments/') || path.includes('..') || path.startsWith('/')) return null;
  return path;
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Receipt storage is not configured.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const path = getStoragePath(body?.screenshotPath);
    if (!path) {
      return NextResponse.json({ error: 'Invalid payment receipt path.' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase.storage
      .from('payment-screenshots')
      .createSignedUrl(path, 10 * 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Could not access this receipt. The file may be missing.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, url: data.signedUrl });
  } catch (error) {
    console.error('Receipt URL generation failed:', error);
    return NextResponse.json({ error: 'Could not prepare the payment receipt.' }, { status: 500 });
  }
}
