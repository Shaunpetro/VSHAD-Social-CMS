// apps/web/src/lib/publisher/linkedin.ts

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

export interface LinkedInPostOptions {
  accessToken: string;
  authorId: string;
  content: string;
  title?: string;
  mediaUrls?: string[];
  // New: organization posting support
  postingMode?: 'personal' | 'organization';
  organizationId?: string | null;
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
 * Supports both personal profile and organization/company page posting
 */
export async function createLinkedInPost(options: LinkedInPostOptions): Promise<LinkedInPostResult> {
  const { accessToken, authorId, content, mediaUrls, postingMode = 'personal', organizationId } = options;

  // Determine the author URN based on posting mode
  let authorUrn: string;

  if (postingMode === 'organization' && organizationId) {
    authorUrn = `urn:li:organization:${organizationId}`;
    console.log('[LinkedIn Publisher] Posting to ORGANIZATION:', authorUrn);
  } else {
    authorUrn = authorId.startsWith('urn:li:person:')
      ? authorId
      : `urn:li:person:${authorId}`;
    console.log('[LinkedIn Publisher] Posting to PERSONAL profile:', authorUrn);
  }

  console.log('[LinkedIn Publisher] Creating post:', {
    authorUrn,
    postingMode,
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

    return handleLinkedInPostResponse(response, authorUrn);
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

    return handleLinkedInPostResponse(response, authorUrn);
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
 * 3-step process: register â†’ download â†’ upload
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

async function handleLinkedInPostResponse(response: Response, authorUrn: string): Promise<LinkedInPostResult> {
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

  // Determine post URL based on whether it's an org or personal post
  let postUrl: string;
  if (authorUrn.includes('organization')) {
    postUrl = finalPostId
      ? `https://www.linkedin.com/feed/update/${finalPostId}`
      : 'https://www.linkedin.com/company/';
  } else {
    postUrl = finalPostId
      ? `https://www.linkedin.com/feed/update/${finalPostId}`
      : 'https://www.linkedin.com/feed/';
  }

  console.log('[LinkedIn Publisher] Post created successfully:', finalPostId);

  return {
    success: true,
    postId: finalPostId || 'unknown',
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

// ============================================
// POST INSIGHTS / ANALYTICS
// ============================================

/**
 * Get insights/metrics for a LinkedIn post
 * 
 * Note: LinkedIn's API for post insights is more limited than Facebook.
 * - For personal posts: Very limited data available via API
 * - For organization posts: More data available with r_organization_social permission
 * 
 * The postId should be the full URN (e.g., "urn:li:share:123456" or "urn:li:ugcPost:123456")
 */
export async function getLinkedInPostInsights(
  accessToken: string,
  postId: string,
  isOrganizationPost: boolean = false
): Promise<{
  success: boolean;
  metrics?: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    engagement: number;
    clicks: number;
  };
  error?: string;
}> {
  console.log('[LinkedIn Insights] Fetching insights for post:', postId);

  try {
    // Ensure postId is in URN format
    let postUrn = postId;
    if (!postId.startsWith('urn:li:')) {
      // Try to construct URN - could be ugcPost or share
      postUrn = `urn:li:ugcPost:${postId}`;
    }

    // URL encode the URN for the API call
    const encodedUrn = encodeURIComponent(postUrn);

    if (isOrganizationPost) {
      // For organization posts, use the organizationalEntityShareStatistics endpoint
      return await getOrganizationPostInsights(accessToken, postUrn);
    }

    // For personal posts, we need to use the socialActions endpoint
    // This gives us likes, comments, and shares counts
    const metrics = {
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagement: 0,
      clicks: 0,
    };

    // Get likes count
    try {
      const likesResponse = await fetch(
        `${LINKEDIN_API_URL}/socialActions/${encodedUrn}/likes?count=0`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (likesResponse.status === 403) {
        console.error('[LinkedIn Insights] 403 ACCESS_DENIED for likes - missing r_member_social scope');
        return {
          success: false,
          error: 'LinkedIn token lacks read permission (r_member_social). Please reconnect LinkedIn from the Platforms page.',
        };
      }
      if (likesResponse.ok) {
        const likesData = await likesResponse.json() as {
          paging?: { total?: number };
        };
        metrics.likes = likesData.paging?.total || 0;
        console.log('[LinkedIn Insights] Likes:', metrics.likes);
      }
    } catch (e) {
      console.warn('[LinkedIn Insights] Failed to fetch likes:', e);
    }

    // Get comments count
    try {
      const commentsResponse = await fetch(
        `${LINKEDIN_API_URL}/socialActions/${encodedUrn}/comments?count=0`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json() as {
          paging?: { total?: number };
        };
        metrics.comments = commentsData.paging?.total || 0;
        console.log('[LinkedIn Insights] Comments:', metrics.comments);
      }
    } catch (e) {
      console.warn('[LinkedIn Insights] Failed to fetch comments:', e);
    }

    // Calculate engagement (likes + comments + shares)
    metrics.engagement = metrics.likes + metrics.comments + metrics.shares;

    console.log('[LinkedIn Insights] Final metrics:', metrics);

    return {
      success: true,
      metrics,
    };
  } catch (error) {
    console.error('[LinkedIn Insights] Failed to fetch insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch LinkedIn post insights',
    };
  }
}

/**
 * Get insights for an organization/company page post
 * Requires r_organization_social permission
 */
async function getOrganizationPostInsights(
  accessToken: string,
  postUrn: string
): Promise<{
  success: boolean;
  metrics?: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    engagement: number;
    clicks: number;
  };
  error?: string;
}> {
  console.log('[LinkedIn Insights] Fetching organization post insights:', postUrn);

  try {
    const encodedUrn = encodeURIComponent(postUrn);

    // Try to get share statistics
    const statsResponse = await fetch(
      `${LINKEDIN_API_URL}/organizationalEntityShareStatistics?q=organizationalEntity&shares=List(${encodedUrn})`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!statsResponse.ok) {
      // Fall back to basic social actions
      console.warn('[LinkedIn Insights] Share statistics not available, using social actions');
      return getLinkedInPostInsights(accessToken, postUrn, false);
    }

    const statsData = await statsResponse.json() as {
      elements?: Array<{
        totalShareStatistics?: {
          impressionCount?: number;
          likeCount?: number;
          commentCount?: number;
          shareCount?: number;
          clickCount?: number;
          engagement?: number;
        };
      }>;
    };

    const stats = statsData.elements?.[0]?.totalShareStatistics;

    if (!stats) {
      console.warn('[LinkedIn Insights] No statistics in response');
      return {
        success: true,
        metrics: {
          impressions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagement: 0,
          clicks: 0,
        },
      };
    }

    const metrics = {
      impressions: stats.impressionCount || 0,
      likes: stats.likeCount || 0,
      comments: stats.commentCount || 0,
      shares: stats.shareCount || 0,
      clicks: stats.clickCount || 0,
      engagement: stats.engagement || (stats.likeCount || 0) + (stats.commentCount || 0) + (stats.shareCount || 0),
    };

    console.log('[LinkedIn Insights] Organization post metrics:', metrics);

    return {
      success: true,
      metrics,
    };
  } catch (error) {
    console.error('[LinkedIn Insights] Failed to fetch organization insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organization post insights',
    };
  }
}

/**
 * Get basic engagement summary for a LinkedIn post
 * This is a simpler version that just gets reaction counts
 */
export async function getLinkedInPostEngagement(
  accessToken: string,
  postId: string
): Promise<{
  success: boolean;
  engagement?: {
    numLikes: number;
    numComments: number;
    numShares: number;
  };
  error?: string;
}> {
  try {
    let postUrn = postId;
    if (!postId.startsWith('urn:li:')) {
      postUrn = `urn:li:ugcPost:${postId}`;
    }

    const encodedUrn = encodeURIComponent(postUrn);

    // Get the post to see its social summary
    const response = await fetch(
      `${LINKEDIN_API_URL}/ugcPosts/${encodedUrn}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: (errorData as { message?: string }).message || `Failed to fetch post: ${response.status}`,
      };
    }

    const postData = await response.json() as {
      socialDetail?: {
        totalSocialActivityCounts?: {
          numLikes?: number;
          numComments?: number;
          numShares?: number;
        };
      };
    };

    const counts = postData.socialDetail?.totalSocialActivityCounts;

    return {
      success: true,
      engagement: {
        numLikes: counts?.numLikes || 0,
        numComments: counts?.numComments || 0,
        numShares: counts?.numShares || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch engagement',
    };
  }
}
