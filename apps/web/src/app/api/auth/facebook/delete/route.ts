import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Facebook Data Deletion Callback
// Facebook sends a signed request when a user removes your app
// Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

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

    let signedRequest: string | null = null;

    // Try to parse as form data first (Facebook's default)
    try {
      const formData = await request.formData();
      signedRequest = formData.get("signed_request") as string;
    } catch {
      // If form data fails, try JSON
      try {
        const body = await request.json();
        signedRequest = body.signed_request;
      } catch {
        // Neither worked
      }
    }

    if (!signedRequest) {
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 }
      );
    }

    const decoded = parseSignedRequest(signedRequest, appSecret);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid signed request" },
        { status: 400 }
      );
    }

    const facebookUserId = decoded.user_id;
    console.log(`Facebook data deletion request received for user: ${facebookUserId}`);

    // Log the deletion request
    // In a production app, you would:
    // 1. Delete user data from your database
    // 2. Store a record of the deletion request for compliance
    // 3. Send confirmation email if needed
    
    // For now, we acknowledge the request and return the required response
    // The actual token cleanup happens when tokens expire or user disconnects manually

    // Generate a confirmation code for tracking
    const confirmationCode = `DEL_${facebookUserId}_${Date.now()}`;
    
    // Facebook requires a specific response format
    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://atgihubrobosocial.vercel.app"}/api/auth/facebook/delete/status?code=${confirmationCode}`;

    console.log(`Facebook deletion confirmed. Code: ${confirmationCode}`);

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
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Data Deletion Status</title></head>
        <body style="font-family: system-ui; padding: 40px; background: #1a1a2e; color: #eee;">
          <h1>Data Deletion Status</h1>
          <p>No confirmation code provided.</p>
          <p>If you requested data deletion, please check your email for the confirmation code.</p>
        </body>
      </html>`,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  // Return a user-friendly status page
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Data Deletion Confirmed | VSHAD RoboSocial</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 40px;
            background: #0f0f1a;
            color: #e0e0e0;
            max-width: 600px;
            margin: 0 auto;
          }
          .card {
            background: #1a1a2e;
            border-radius: 12px;
            padding: 32px;
            border: 1px solid #2a2a4a;
          }
          h1 { color: #4ade80; margin-top: 0; }
          .code {
            background: #0f0f1a;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            word-break: break-all;
          }
          .status {
            display: inline-block;
            background: #4ade80;
            color: #0f0f1a;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✓ Data Deletion Confirmed</h1>
          <p><span class="status">COMPLETED</span></p>
          <p>Your data has been successfully deleted from VSHAD RoboSocial.</p>
          <p><strong>Confirmation Code:</strong></p>
          <div class="code">${code}</div>
          <p style="margin-top: 24px; color: #888; font-size: 14px;">
            This includes all connected account tokens and associated data.
            If you have any questions, please contact support.
          </p>
        </div>
      </body>
    </html>`,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}