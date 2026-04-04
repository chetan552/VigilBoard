import { setTokens } from '@/lib/google-auth';
import { NextRequest, NextResponse } from 'next/server';

const STATE_COOKIE = 'vb_oauth_state';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'Auth code missing' }, { status: 400 });
  }

  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!expectedState || state !== expectedState) {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 403 });
  }

  try {
    await setTokens(code);
    const res = NextResponse.redirect(new URL('/admin/settings', request.url));
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
