// apps/web/src/lib/publisher/linkedin.ts

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

export interface LinkedInPostOptions {
  accessToken: string;
  authorId: string;
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

interface LinkedInAsset {
  asset: string;
  uploadUrl: string;
}

// ============================================
// MAIN POST FUNCTION
// ============================================

/**
 * Create a post on LinkedIn (with optional images)
 */
export async function createLinkedInPost(options: LinkedInPostOptions): Promise<LinkedInPostResult> {
  const { accessToken, authorId, content, mediaUrls } = options;

  // LinkedIn requires URN format for author
  const authorUrn = authorId.startsWith('urn:li:person:')
    ? authorId
    : `urn:li:person:${authorId}`;

  console.log('[LinkedIn Publisher] Creating post:', {
    authorUrn,
    contentLength: content.length,
    mediaCount: mediaUrls?.length || 0,
  });

  // Check if we have media to upload
  const validMediaUrls = mediaUrls?.filter(url => url && url.trim().length > 0) || [];

  if (validMediaUrls.length > 0) {
    console.log('[LinkedIn Publisher] Uploading', validMediaUrls.length, 'image(s)');
    return createLinkedInPostWithImages(accessToken, authorUrn, content, validMediaUrls);
  }

  // Text-only post
  return createLinkedInTextPost(accessToken, authorUrn, content);
}

// ============================================
// TEXT-ONLY POST
// ============================================

async function createLinkedInTextPost(
  accessToken: string,
  authorUrn: string,
  content: string
): Promise<LinkedInPostResult> {
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

    return handleLinkedInPostResponse(response);
  } catch (error) {
    console.error('[LinkedIn Publisher] Text post creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create LinkedIn post',
    };
  }
}

// ============================================
// POST WITH IMAGES
// ============================================

async function createLinkedInPostWithImages(
  accessToken: string,
  authorUrn: string,
  content: string,
  mediaUrls: string[]
): Promise<LinkedInPostResult> {
  try {
    // Step 1: Upload all images and get asset URNs
    const uploadedAssets: string[] = [];

    for (const mediaUrl of mediaUrls) {
      console.log('[LinkedIn Publisher] Processing image:', mediaUrl);
      
      const uploadResult = await uploadImageToLinkedIn(accessToken, authorUrn, mediaUrl);
      
      if (uploadResult.success && uploadResult.assetUrn) {
        uploadedAssets.push(uploadResult.assetUrn);
        console.log('[LinkedIn Publisher] Image uploaded, asset:', uploadResult.assetUrn);
      } else {
        console.warn('[LinkedIn Publisher] Failed to upload image:', uploadResult.error);
        // Continue with other images
      }
    }

    // If no images uploaded successfully, fall back to text-only
    if (uploadedAssets.length === 0) {
      console.warn('[LinkedIn Publisher] All image uploads failed, creating text-only post');
      return createLinkedInTextPost(accessToken, authorUrn, content);
    }

    // Step 2: Create post with media
    const mediaElements = uploadedAssets.map(assetUrn => ({
      status: 'READY',
      media: assetUrn,
    }));

    const postPayload = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: 'IMAGE',
          media: mediaElements,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    console.log('[LinkedIn Publisher] Creating post with', uploadedAssets.length, 'image(s)');

    const response = await fetch(`${LINKEDIN_API_URL}/ugcPosts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postPayload),
    });

    return handleLinkedInPostResponse(response);
  } catch (error) {
    console.error('[LinkedIn Publisher] Image post creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create LinkedIn post with images',
    };
  }
}

// ============================================
// IMAGE UPLOAD HELPERS
// ============================================

/**
 * Upload an image to LinkedIn
 * 3-step process: register → download → upload
 */
async function uploadImageToLinkedIn(
  accessToken: string,
  authorUrn: string,
  imageUrl: string
): Promise<{ success: boolean; assetUrn?: string; error?: string }> {
  try {
    // Step 1: Register the upload
    const registerResult = await registerLinkedInUpload(accessToken, authorUrn);
    
    if (!registerResult.success || !registerResult.asset) {
      return {
        success: false,
        error: registerResult.error || 'Failed to register upload',
      };
    }

    const { asset, uploadUrl } = registerResult.asset;

    // Step 2: Download the image from URL
    console.log('[LinkedIn Publisher] Downloading image from:', imageUrl);
    
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return {
        success: false,
        error: `Failed to download image: ${imageResponse.status}`,
      };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log('[LinkedIn Publisher] Image downloaded, size:', imageBuffer.byteLength, 'type:', contentType);

    // Step 3: Upload to LinkedIn
    console.log('[LinkedIn Publisher] Uploading to LinkedIn...');
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': contentType,
      },
      body: imageBuffer,
    });

    // LinkedIn returns 201 Created on success (sometimes 200)
    if (!uploadResponse.ok && uploadResponse.status !== 201) {
      const errorText = await uploadResponse.text().catch(() => '');
      console.error('[LinkedIn Publisher] Upload failed:', uploadResponse.status, errorText);
      return {
        success: false,
        error: `Failed to upload image to LinkedIn: ${uploadResponse.status}`,
      };
    }

    console.log('[LinkedIn Publisher] Upload successful, asset:', asset);

    return {
      success: true,
      assetUrn: asset,
    };
  } catch (error) {
    console.error('[LinkedIn Publisher] Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image upload failed',
    };
  }
}

/**
 * Register an image upload with LinkedIn
 */
async function registerLinkedInUpload(
  accessToken: string,
  authorUrn: string
): Promise<{ success: boolean; asset?: LinkedInAsset; error?: string }> {
  const registerPayload = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: authorUrn,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
    },
  };

  try {
    const response = await fetch(`${LINKEDIN_API_URL}/assets?action=registerUpload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(registerPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[LinkedIn Publisher] Register upload failed:', errorData);
      return {
        success: false,
        error: (errorData as { message?: string }).message || `Register failed: ${response.status}`,
      };
    }

    const data = await response.json() as {
      value?: {
        asset?: string;
        uploadMechanism?: {
          'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'?: {
            uploadUrl?: string;
          };
        };
      };
    };

    const asset = data.value?.asset;
    const uploadUrl = data.value?.uploadMechanism?.[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ]?.uploadUrl;

    if (!asset || !uploadUrl) {
      console.error('[LinkedIn Publisher] Missing asset or uploadUrl in response:', data);
      return {
        success: false,
        error: 'LinkedIn did not return upload URL',
      };
    }

    return {
      success: true,
      asset: { asset, uploadUrl },
    };
  } catch (error) {
    console.error('[LinkedIn Publisher] Register upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register upload',
    };
  }
}

// ============================================
// RESPONSE HANDLER
// ============================================

async function handleLinkedInPostResponse(response: Response): Promise<LinkedInPostResult> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = (errorData as { message?: string }).message
      || `LinkedIn API error (${response.status})`;

    console.error('[LinkedIn Publisher] Post failed:', errorData);

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
        error: 'Insufficient permissions. Please reconnect with required scopes.',
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
  const postUrl = `https://www.linkedin.com/feed/update/${finalPostId}`;

  console.log('[LinkedIn Publisher] Post created successfully:', finalPostId);

  return {
    success: true,
    postId: finalPostId,
    postUrl,
  };
}

// ============================================
// TOKEN VERIFICATION
// ============================================

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