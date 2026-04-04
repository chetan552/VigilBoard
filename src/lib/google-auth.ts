import { google } from 'googleapis';
import { prisma } from './prisma';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback` : 'http://localhost:3000/api/auth/google/callback';

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Automatically persist refreshed tokens so we never lose a new refresh_token
oauth2Client.on('tokens', async (tokens) => {
  if (tokens.refresh_token) {
    try {
      await prisma.config.upsert({
        where: { key: 'google_refresh_token' },
        update: { value: tokens.refresh_token },
        create: { key: 'google_refresh_token', value: tokens.refresh_token },
      });
    } catch { /* non-fatal */ }
  }
});

export async function getAuthUrl(state: string) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/tasks.readonly',
    ],
    prompt: 'consent',
    state,
  });
}

export async function setTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  
  // Save tokens to database
  if (tokens.refresh_token) {
    await prisma.config.upsert({
      where: { key: 'google_refresh_token' },
      update: { value: tokens.refresh_token },
      create: { key: 'google_refresh_token', value: tokens.refresh_token },
    });
  }
  
  return tokens;
}

export class GoogleNotConnectedError extends Error {
  constructor() { super('Google account not connected'); }
}

async function getAuthenticatedClient() {
  const row = await prisma.config.findUnique({ where: { key: 'google_refresh_token' } });
  if (!row) throw new GoogleNotConnectedError();
  // Setting both refresh_token and expiry_date=1 forces the library to always
  // use the refresh token to obtain a fresh access token on the next call.
  oauth2Client.setCredentials({ refresh_token: row.value });
  return oauth2Client;
}

export async function getTasksClient() {
  const auth = await getAuthenticatedClient();
  return google.tasks({ version: 'v1', auth });
}

export async function getCalendarClient() {
  const auth = await getAuthenticatedClient();
  return google.calendar({ version: 'v3', auth });
}
