// apps/web/src/lib/publisher/linkedin.ts

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

export interface LinkedInPostOptions {
  accessToken: string;
  authorId: string; // LinkedIn user sub (urn:li:person:xxx)
  content: string;
  title?: string;
  mediaUrls?: string[];
}

export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * Create a text post on LinkedIn
 */
export async function createLinkedInPost(options: LinkedInPostOptions): Promise<LinkedInPostResult> {
  const { accessToken, authorId, content, title } = options;

  // LinkedIn requires URN format for author
  const authorUrn = authorId.startsWith('urn:li:person:')
    ? authorId
    : `urn:li:person:${authorId}`;

  // Build the post payload (UGC Post format)
  const postPayload = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  try {
    const response = await fetch(`${LINKEDIN_API_URL}/ugcPosts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as { message?: string }).message
        || `LinkedIn API error (${response.status})`;

      // Handle specific errors
      if (response.status === 401) {
        return {
          success: false,
          error: 'LinkedIn access token expired. Please reconnect your account.',
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'Insufficient permissions. Please reconnect with w_member_social scope.',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: 'LinkedIn rate limit reached. Please try again later.',
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // LinkedIn returns the post ID in the X-RestLi-Id header
    const postId = response.headers.get('X-RestLi-Id') || response.headers.get('x-restli-id');

    // Also try to get it from the response body
    let postIdFromBody: string | undefined;
    try {
      const responseData = await response.json();
      postIdFromBody = (responseData as { id?: string }).id;
    } catch {
      // Response might be empty
    }

    const finalPostId = postId || postIdFromBody;

    if (!finalPostId) {
      return {
        success: true,
        postId: 'unknown',
        postUrl: 'https://www.linkedin.com/feed/',
      };
    }

    // Construct the post URL
    // LinkedIn post IDs are in format: urn:li:share:1234567890 or urn:li:ugcPost:1234567890
    const postUrl = `https://www.linkedin.com/feed/update/${finalPostId}`;

    return {
      success: true,
      postId: finalPostId,
      postUrl,
    };
  } catch (error) {
    console.error('LinkedIn post creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create LinkedIn post',
    };
  }
}

/**
 * Verify LinkedIn access token is still valid
 */
export async function verifyLinkedInToken(accessToken: string): Promise<{
  valid: boolean;
  profile?: { sub: string; name: string };
  error?: string;
}> {
  try {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { valid: false, error: 'Token expired' };
      }
      return { valid: false, error: `Token verification failed (${response.status})` };
    }

    const profile = await response.json() as { sub: string; name: string };

    return {
      valid: true,
      profile: {
        sub: profile.sub,
        name: profile.name,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    };
  }
}

/**
 * Upload an image to LinkedIn and get the asset URN
 * Note: This is a simplified version. Full implementation requires:
 * 1. Register upload
 * 2. Upload binary
 * 3. Reference asset in post
 */
export async function uploadLinkedInImage(
  accessToken: string,
  authorId: string,
  imageUrl: string
): Promise<{ success: boolean; assetUrn?: string; error?: string }> {
  // TODO: Implement image upload when needed
  // For now, return error indicating feature not implemented
  return {
    success: false,
    error: 'LinkedIn image upload not yet implemented. Post will be created without images.',
  };
}