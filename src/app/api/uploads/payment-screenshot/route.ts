import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const registrationId = (formData.get('registrationId') as string) || 'temp';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Server-side cap protects storage even if a client skips compression.
    const MAX_SIZE = 1536 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image exceeds the 1.5 MB limit. Please choose a smaller image.' }, { status: 400 });
    }

    // 2. MIME type check
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'png';
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const storagePath = `payments/${registrationId}/${uniqueFilename}`;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        const buffer = Buffer.from(await file.arrayBuffer());

        const { data, error } = await supabase.storage
          .from('payment-screenshots')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (!error && data) {
          return NextResponse.json({
            success: true,
            filePath: data.path,
            fileName: file.name
          });
        }
        console.error('Supabase payment screenshot upload failed:', error?.message || 'No storage response');
        return NextResponse.json({ error: 'Screenshot storage is temporarily unavailable. Please retry.' }, { status: 503 });
      } catch (storageErr) {
        console.error('Supabase storage upload error:', storageErr);
        return NextResponse.json({ error: 'Screenshot storage is temporarily unavailable. Please retry.' }, { status: 503 });
      }
    }
    return NextResponse.json({ error: 'Screenshot storage is not configured. Please contact the tournament organizer.' }, { status: 503 });
  } catch (err: any) {
    console.error('Upload API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload screenshot' }, { status: 500 });
  }
}

