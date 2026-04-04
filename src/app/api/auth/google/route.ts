import { getAuthUrl } from '@/lib/google-auth';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const STATE_COOKIE = 'vb_oauth_state';

export async function GET() {
  const state = randomBytes(16).toString('hex');
  const url = await getAuthUrl(state);

  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });
  return res;
}
