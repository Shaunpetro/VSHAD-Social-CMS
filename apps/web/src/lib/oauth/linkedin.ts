const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/userinfo';

export const LINKEDIN_SCOPES = 'openid profile email w_member_social';

export function getLinkedInRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log('[LinkedIn OAuth] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('[LinkedIn OAuth] Using redirect URI:', `${appUrl}/api/auth/linkedin/callback`);
  return `${appUrl}/api/auth/linkedin/callback`;
}

export function encodeOAuthState(data: Record<string, string>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

export function decodeOAuthState(state: string): Record<string, string> {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch {
    throw new Error('Invalid OAuth state');
  }
}

export function getLinkedInAuthUrl(companyId: string): string {
  const state = encodeOAuthState({
    companyId,
    platform: 'linkedin',
    ts: Date.now().toString(),
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID || '',
    redirect_uri: getLinkedInRedirectUri(),
    state,
    scope: LINKEDIN_SCOPES,
  });

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string): Promise<{
  access_token: string;
  expires_in: number;
  scope: string;
}> {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID || '',
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirect_uri: getLinkedInRedirectUri(),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error_description?: string }).error_description
      || `LinkedIn token exchange failed (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

export interface LinkedInProfile {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const res = await fetch(LINKEDIN_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch LinkedIn profile (${res.status})`);
  }

  return res.json();
}