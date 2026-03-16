import { NextRequest, NextResponse } from 'next/server';
import { getFacebookAuthUrl } from '@/lib/oauth/facebook';

export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.redirect(
        new URL('/platforms?error=missing_company', request.url)
      );
    }

    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      return NextResponse.redirect(
        new URL('/platforms?error=facebook_not_configured', request.url)
      );
    }

    const authUrl = getFacebookAuthUrl(companyId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Facebook OAuth init failed:', error);
    return NextResponse.redirect(
      new URL('/platforms?error=facebook_init_failed', request.url)
    );
  }
}