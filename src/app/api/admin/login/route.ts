import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@cricketauctionleague.com').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let authenticated = false;

    // 1. If Supabase is configured, attempt Supabase Auth sign-in
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: String(password)
        });

        if (!error && data?.user) {
          authenticated = true;
        }
      } catch (authErr) {
        // Fall back to secure server credentials
      }
    }

    // 2. Validate against configured admin credentials
    if (!authenticated) {
      if (trimmedEmail === adminEmail && String(password) === adminPassword) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin email or password' },
        { status: 401 }
      );
    }

    // Set secure admin session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful'
    });

    response.cookies.set('cal_admin_session', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      httpOnly: false
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication error' },
      { status: 500 }
    );
  }
}

