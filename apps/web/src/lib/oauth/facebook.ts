// apps/web/src/lib/oauth/facebook.ts

const FB_API_VERSION = 'v21.0';
const FB_AUTH_URL = `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`;
const FB_TOKEN_URL = `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token`;
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

// ============================================
// PERMISSIONS CONFIGURATION
// ============================================

// Basic permissions that work in Development Mode (no App Review needed)
export const FACEBOOK_SCOPES_DEVELOPMENT = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
].join(',');

// Minimal permissions that ALWAYS work in Development Mode
export const FACEBOOK_SCOPES_MINIMAL = [
  'pages_show_list',
  'public_profile',
].join(',');

// Full permissions (requires App Review for production)
export const FACEBOOK_SCOPES_PRODUCTION = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'pages_read_user_content',
].join(',');

// ⬇️ CHANGED: false to enable full publishing permissions
const USE_MINIMAL_SCOPES = false;

export const FACEBOOK_SCOPES = USE_MINIMAL_SCOPES
  ? FACEBOOK_SCOPES_MINIMAL
  : FACEBOOK_SCOPES_PRODUCTION;

// ============================================
// URL HELPERS - CRITICAL FOR OAUTH
// ============================================

/**
 * Get the base app URL, normalized (no trailing slash)
 * Hardcoded fallback for production to avoid env var issues
 */
function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Hardcoded production URL as fallback
  const productionUrl = 'https://atgihubrobosocial.vercel.app';

  let baseUrl = envUrl || productionUrl;

  // Remove trailing slash if present
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  return baseUrl;
}

/**
 * Get the exact redirect URI - MUST be identical in auth URL and token exchange
 */
export function getFacebookRedirectUri(): string {
  const redirectUri = `${getAppUrl()}/api/auth/facebook/callback`;
  console.log('[Facebook OAuth] Redirect URI:', redirectUri);
  return redirectUri;
}

// ============================================
// OAUTH STATE
// ============================================

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

// ============================================
// OAUTH FUNCTIONS
// ============================================

export function getFacebookAuthUrl(companyId: string): string {
  const redirectUri = getFacebookRedirectUri();

  const state = encodeOAuthState({
    companyId,
    platform: 'facebook',
    ts: Date.now().toString(),
    // Store the redirect URI in state so callback can verify
    redirectUri,
  });

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || '',
    redirect_uri: redirectUri,
    state,
    scope: FACEBOOK_SCOPES,
    response_type: 'code',
  });

  const authUrl = `${FB_AUTH_URL}?${params.toString()}`;

  console.log('[Facebook OAuth] === AUTH URL DEBUG ===');
  console.log('[Facebook OAuth] App URL:', getAppUrl());
  console.log('[Facebook OAuth] Redirect URI:', redirectUri);
  console.log('[Facebook OAuth] Scopes:', FACEBOOK_SCOPES);
  console.log('[Facebook OAuth] Full Auth URL:', authUrl);

  return authUrl;
}

export async function exchangeFacebookCode(code: string, stateRedirectUri?: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  // Use the redirect URI from state if provided, otherwise generate it
  // This ensures we use the EXACT same URI that was used in the auth request
  const redirectUri = stateRedirectUri || getFacebookRedirectUri();

  console.log('[Facebook OAuth] === TOKEN EXCHANGE DEBUG ===');
  console.log('[Facebook OAuth] Using redirect URI:', redirectUri);
  console.log('[Facebook OAuth] State redirect URI provided:', !!stateRedirectUri);

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || '',
    client_secret: process.env.FACEBOOK_APP_SECRET || '',
    redirect_uri: redirectUri,
    code,
  });

  const tokenUrl = `${FB_TOKEN_URL}?${params.toString()}`;
  console.log('[Facebook OAuth] Token URL (without secrets):',
    tokenUrl.replace(process.env.FACEBOOK_APP_SECRET || '', '[REDACTED]'));

  const res = await fetch(tokenUrl);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[Facebook OAuth] Token exchange error:', err);
    console.error('[Facebook OAuth] Redirect URI used:', redirectUri);
    const message = (err as { error?: { message?: string } }).error?.message
      || `Facebook token exchange failed (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  console.log('[Facebook OAuth] Token exchange successful');
  return data;
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
    console.error('[Facebook OAuth] Long-lived token error:', err);
    const message = (err as { error?: { message?: string } }).error?.message
      || `Failed to get long-lived token (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

// ============================================
// FACEBOOK PAGES
// ============================================

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
    console.error('[Facebook OAuth] Get pages error:', err);
    const message = (err as { error?: { message?: string } }).error?.message
      || `Failed to fetch Facebook pages (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  return (data as { data: FacebookPage[] }).data || [];
}

// ============================================
// USER PROFILE
// ============================================

export interface FacebookUserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export async function getFacebookUserProfile(userToken: string): Promise<FacebookUserProfile> {
  const params = new URLSearchParams({
    access_token: userToken,
    fields: 'id,name,email,picture',
  });

  const res = await fetch(`${FB_GRAPH_URL}/me?${params.toString()}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message || 'Failed to fetch user profile'
    );
  }

  return res.json();
}