import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { settingsService } from '@/services/settings.service';
import { verifyAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store'
};

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const settings = await settingsService.getAllSettings();
    return NextResponse.json(
      { success: true, data: settings },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updated = await settingsService.updateSettings(body, auth.adminId);

    try {
      revalidatePath('/register');
      revalidatePath('/api/public/settings');
      revalidatePath('/admin/settings');
    } catch {
      // Ignore revalidation errors outside Next.js request lifecycle
    }

    return NextResponse.json(
      { success: true, data: updated, message: 'Settings saved successfully' },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 400 });
  }
}
