import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Facebook Data Deletion Callback
// Facebook sends a signed request when a user removes your app
// Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

interface DeleteRequestBody {
  signed_request: string;
}

interface DecodedRequest {
  user_id: string;
  algorithm: string;
  issued_at: number;
}

function parseSignedRequest(signedRequest: string, appSecret: string): DecodedRequest | null {
  try {
    const [encodedSig, payload] = signedRequest.split(".");
    
    if (!encodedSig || !payload) {
      return null;
    }

    // Decode the payload
    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
    ) as DecodedRequest;

    // Verify the signature
    const expectedSig = crypto
      .createHmac("sha256", appSecret)
      .update(payload)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const sig = encodedSig.replace(/=+$/, "");

    if (sig !== expectedSig) {
      console.error("Facebook delete callback: Invalid signature");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Facebook delete callback: Parse error", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!appSecret) {
      console.error("Facebook delete callback: Missing app secret");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Parse the form data (Facebook sends as form-urlencoded)
    const formData = await request.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      // Try JSON body as fallback
      const body = await request.json().catch(() => ({})) as DeleteRequestBody;
      if (!body.signed_request) {
        return NextResponse.json(
          { error: "Missing signed_request" },
          { status: 400 }
        );
      }
    }

    const decoded = parseSignedRequest(signedRequest, appSecret);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid signed request" },
        { status: 400 }
      );
    }

    const facebookUserId = decoded.user_id;
    console.log(`Facebook delete request for user: ${facebookUserId}`);

    // Find and delete platform connections for this Facebook user
    // The platformUserId stores the Facebook user ID
    const deletedConnections = await prisma.platformConnection.deleteMany({
      where: {
        platform: "FACEBOOK",
        platformUserId: facebookUserId,
      },
    });

    console.log(`Deleted ${deletedConnections.count} Facebook connections for user ${facebookUserId}`);

    // Generate a confirmation code for the user
    const confirmationCode = crypto.randomBytes(16).toString("hex");
    
    // Facebook requires a specific response format
    // The URL should show the status of the deletion request
    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/delete/status?code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("Facebook delete callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for deletion status (required by Facebook)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing confirmation code" },
      { status: 400 }
    );
  }

  // In a production app, you'd look up the deletion request by code
  // For now, we return a simple confirmation
  return NextResponse.json({
    status: "complete",
    message: "Your data has been deleted from VSHAD RoboSocial",
    confirmation_code: code,
  });
}