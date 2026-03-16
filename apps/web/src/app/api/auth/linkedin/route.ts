import { NextRequest, NextResponse } from 'next/server';
import { getLinkedInAuthUrl } from '@/lib/oauth/linkedin';

export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.redirect(
        new URL('/platforms?error=missing_company', request.url)
      );
    }

    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL('/platforms?error=linkedin_not_configured', request.url)
      );
    }

    const authUrl = getLinkedInAuthUrl(companyId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('LinkedIn OAuth init failed:', error);
    return NextResponse.redirect(
      new URL('/platforms?error=linkedin_init_failed', request.url)
    );
  }
}