// apps/web/src/app/api/auth/linkedin/complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, selection, organizationId, organizationName } = body;

    if (!companyId || !selection) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the pending LinkedIn platform connection
    const platform = await prisma.platform.findFirst({
      where: {
        type: 'LINKEDIN',
        companyId,
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'LinkedIn connection not found. Please try connecting again.' },
        { status: 404 }
      );
    }

    const existingData = platform.connectionData as Record<string, unknown> | null;

    if (!existingData || !existingData.pendingSelection) {
      return NextResponse.json(
        { error: 'No pending connection found. Please reconnect LinkedIn.' },
        { status: 400 }
      );
    }

    // Build the final connection data
    const isOrganization = selection !== 'personal' && organizationId;

    const connectionData = {
      accessToken: existingData.accessToken,
      expiresAt: existingData.expiresAt,
      scopes: existingData.scopes,
      linkedinSub: existingData.linkedinSub,
      email: existingData.email,
      name: existingData.name,
      picture: existingData.picture,
      connectedAt: existingData.connectedAt,
      // Selection-specific fields
      postingMode: isOrganization ? 'organization' : 'personal',
      organizationId: isOrganization ? organizationId : null,
      organizationName: isOrganization ? organizationName : null,
      // Remove pending flag and available orgs
      pendingSelection: undefined,
      availableOrganizations: undefined,
    };

    // Determine display name
    const displayName = isOrganization
      ? organizationName || 'LinkedIn Page'
      : (existingData.name as string) || 'LinkedIn Profile';

    // Update the platform record
    await prisma.platform.update({
      where: { id: platform.id },
      data: {
        username: displayName,
        isConnected: true,
        connectionData,
        lastSyncAt: new Date(),
      },
    });

    console.log('[LinkedIn Complete] Connection finalized:', {
      mode: isOrganization ? 'organization' : 'personal',
      name: displayName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LinkedIn Complete] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete connection' },
      { status: 500 }
    );
  }
}