const FB_API_VERSION = 'v21.0';
const FB_AUTH_URL = `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`;
const FB_TOKEN_URL = `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token`;
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

export const FACEBOOK_SCOPES = 'pages_manage_posts,pages_read_engagement,pages_show_list';

export function getFacebookRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
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

export function getFacebookAuthUrl(companyId: string): string {
  const state = encodeOAuthState({
    companyId,
    platform: 'facebook',
    ts: Date.now().toString(),
  });

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || '',
    redirect_uri: getFacebookRedirectUri(),
    state,
    scope: FACEBOOK_SCOPES,
    response_type: 'code',
  });

  return `${FB_AUTH_URL}?${params.toString()}`;
}

export async function exchangeFacebookCode(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || '',
    client_secret: process.env.FACEBOOK_APP_SECRET || '',
    redirect_uri: getFacebookRedirectUri(),
    code,
  });

  const res = await fetch(`${FB_TOKEN_URL}?${params.toString()}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error?: { message?: string } }).error?.message
      || `Facebook token exchange failed (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

export async function getLongLivedToken(shortToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.FACEBOOK_APP_ID || '',
    client_secret: process.env.FACEBOOK_APP_SECRET || '',
    fb_exchange_token: shortToken,
  });

  const res = await fetch(`${FB_TOKEN_URL}?${params.toString()}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error?: { message?: string } }).error?.message
      || `Failed to get long-lived token (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks?: string[];
}

export async function getFacebookPages(userToken: string): Promise<FacebookPage[]> {
  const params = new URLSearchParams({
    access_token: userToken,
    fields: 'id,name,access_token,category,tasks',
  });

  const res = await fetch(`${FB_GRAPH_URL}/me/accounts?${params.toString()}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error?: { message?: string } }).error?.message
      || `Failed to fetch Facebook pages (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  return (data as { data: FacebookPage[] }).data || [];
}