// apps/web/src/lib/publisher/facebook.ts

const FB_API_VERSION = 'v21.0';
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

export interface FacebookPostOptions {
  pageAccessToken: string;
  pageId: string;
  content: string;
  link?: string;
  mediaUrls?: string[];
}

export interface FacebookPostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * Create a post on a Facebook Page (with optional media)
 */
export async function createFacebookPost(options: FacebookPostOptions): Promise<FacebookPostResult> {
  const { pageAccessToken, pageId, content, link, mediaUrls } = options;

  console.log('[Facebook Publisher] Creating post:', {
    pageId,
    contentLength: content.length,
    hasLink: !!link,
    mediaCount: mediaUrls?.length || 0,
  });

  // If we have media, handle it appropriately
  if (mediaUrls && mediaUrls.length > 0) {
    // Filter to only valid URLs
    const validMediaUrls = mediaUrls.filter(url => url && url.trim().length > 0);
    
    if (validMediaUrls.length === 1) {
      // Single image - use photos endpoint
      console.log('[Facebook Publisher] Single image detected, using photos endpoint');
      return createFacebookPhotoPost({
        ...options,
        photoUrl: validMediaUrls[0],
      });
    } else if (validMediaUrls.length > 1) {
      // Multiple images - use multi-photo post
      console.log('[Facebook Publisher] Multiple images detected:', validMediaUrls.length);
      return createFacebookMultiPhotoPost({
        ...options,
        photoUrls: validMediaUrls,
      });
    }
  }

  // Text-only post (or with link)
  console.log('[Facebook Publisher] Creating text-only post');
  
  const postData: Record<string, string> = {
    message: content,
    access_token: pageAccessToken,
  };

  // Add link if provided
  if (link) {
    postData.link = link;
  }

  try {
    const response = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(postData),
    });

    const responseData = await response.json() as {
      id?: string;
      error?: {
        message?: string;
        code?: number;
        error_subcode?: number;
      };
    };

    if (!response.ok) {
      const errorMessage = responseData.error?.message || `Facebook API error (${response.status})`;
      console.error('[Facebook Publisher] Post failed:', responseData.error);

      // Handle specific errors
      if (response.status === 401 || responseData.error?.code === 190) {
        return {
          success: false,
          error: 'Facebook access token expired. Please reconnect your account.',
        };
      }

      if (responseData.error?.code === 200) {
        return {
          success: false,
          error: 'Insufficient permissions to post to this page.',
        };
      }

      if (response.status === 429 || responseData.error?.code === 32) {
        return {
          success: false,
          error: 'Facebook rate limit reached. Please try again later.',
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const postId = responseData.id;

    if (!postId) {
      return {
        success: false,
        error: 'Facebook did not return a post ID',
      };
    }

    // Construct the post URL
    const postUrl = `https://www.facebook.com/${postId.replace('_', '/posts/')}`;

    console.log('[Facebook Publisher] Post created successfully:', postId);

    return {
      success: true,
      postId,
      postUrl,
    };
  } catch (error) {
    console.error('[Facebook Publisher] Post creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Facebook post',
    };
  }
}

/**
 * Create a post with a single photo on a Facebook Page
 */
export async function createFacebookPhotoPost(
  options: FacebookPostOptions & { photoUrl: string }
): Promise<FacebookPostResult> {
  const { pageAccessToken, pageId, content, photoUrl } = options;

  console.log('[Facebook Publisher] Creating photo post:', { pageId, photoUrl });

  try {
    const response = await fetch(`${FB_GRAPH_URL}/${pageId}/photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        url: photoUrl,
        caption: content,
        access_token: pageAccessToken,
      }),
    });

    const responseData = await response.json() as {
      id?: string;
      post_id?: string;
      error?: {
        message?: string;
        code?: number;
      };
    };

    if (!response.ok) {
      console.error('[Facebook Publisher] Photo post failed:', responseData.error);
      return {
        success: false,
        error: responseData.error?.message || `Facebook API error (${response.status})`,
      };
    }

    const postId = responseData.post_id || responseData.id;

    console.log('[Facebook Publisher] Photo post created successfully:', postId);

    return {
      success: true,
      postId,
      postUrl: postId ? `https://www.facebook.com/${postId.replace('_', '/posts/')}` : undefined,
    };
  } catch (error) {
    console.error('[Facebook Publisher] Photo post creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Facebook photo post',
    };
  }
}

/**
 * Create a post with multiple photos on a Facebook Page
 * Uses the unpublished photo + attached_media approach
 */
export async function createFacebookMultiPhotoPost(
  options: FacebookPostOptions & { photoUrls: string[] }
): Promise<FacebookPostResult> {
  const { pageAccessToken, pageId, content, photoUrls } = options;

  console.log('[Facebook Publisher] Creating multi-photo post:', { 
    pageId, 
    photoCount: photoUrls.length 
  });

  try {
    // Step 1: Upload each photo as unpublished
    const uploadedPhotoIds: string[] = [];

    for (const photoUrl of photoUrls) {
      console.log('[Facebook Publisher] Uploading unpublished photo:', photoUrl);
      
      const uploadResponse = await fetch(`${FB_GRAPH_URL}/${pageId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          url: photoUrl,
          published: 'false', // Upload but don't publish yet
          access_token: pageAccessToken,
        }),
      });

      const uploadData = await uploadResponse.json() as {
        id?: string;
        error?: { message?: string };
      };

      if (!uploadResponse.ok || !uploadData.id) {
        console.error('[Facebook Publisher] Failed to upload photo:', uploadData.error);
        // Continue with other photos, don't fail completely
        continue;
      }

      uploadedPhotoIds.push(uploadData.id);
      console.log('[Facebook Publisher] Photo uploaded:', uploadData.id);
    }

    if (uploadedPhotoIds.length === 0) {
      // All uploads failed, fall back to text-only post
      console.warn('[Facebook Publisher] All photo uploads failed, creating text-only post');
      return createFacebookPost({
        pageAccessToken,
        pageId,
        content,
      });
    }

    // Step 2: Create the post with attached_media
    const postData: Record<string, string> = {
      message: content,
      access_token: pageAccessToken,
    };

    // Add each photo as attached_media[i]
    uploadedPhotoIds.forEach((photoId, index) => {
      postData[`attached_media[${index}]`] = JSON.stringify({ media_fbid: photoId });
    });

    console.log('[Facebook Publisher] Creating feed post with', uploadedPhotoIds.length, 'attached photos');

    const response = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(postData),
    });

    const responseData = await response.json() as {
      id?: string;
      error?: {
        message?: string;
        code?: number;
      };
    };

    if (!response.ok) {
      console.error('[Facebook Publisher] Multi-photo post failed:', responseData.error);
      return {
        success: false,
        error: responseData.error?.message || `Facebook API error (${response.status})`,
      };
    }

    const postId = responseData.id;

    console.log('[Facebook Publisher] Multi-photo post created successfully:', postId);

    return {
      success: true,
      postId,
      postUrl: postId ? `https://www.facebook.com/${postId.replace('_', '/posts/')}` : undefined,
    };
  } catch (error) {
    console.error('[Facebook Publisher] Multi-photo post creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Facebook multi-photo post',
    };
  }
}

/**
 * Verify Facebook page access token is still valid
 */
export async function verifyFacebookToken(pageAccessToken: string): Promise<{
  valid: boolean;
  pageInfo?: { id: string; name: string };
  error?: string;
}> {
  try {
    const response = await fetch(
      `${FB_GRAPH_URL}/me?access_token=${pageAccessToken}&fields=id,name`
    );

    const responseData = await response.json() as {
      id?: string;
      name?: string;
      error?: {
        message?: string;
        code?: number;
      };
    };

    if (!response.ok) {
      return {
        valid: false,
        error: responseData.error?.message || 'Token verification failed',
      };
    }

    return {
      valid: true,
      pageInfo: {
        id: responseData.id || '',
        name: responseData.name || '',
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
 * Get page insights/metrics for a post
 */
export async function getFacebookPostInsights(
  pageAccessToken: string,
  postId: string
): Promise<{
  success: boolean;
  metrics?: {
    impressions: number;
    reach: number;
    engagement: number;
    reactions: number;
    comments: number;
    shares: number;
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `${FB_GRAPH_URL}/${postId}/insights?metric=post_impressions,post_engaged_users,post_reactions_by_type_total,post_comments,post_shares&access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json() as { error?: { message?: string } };
      return {
        success: false,
        error: errorData.error?.message || 'Failed to fetch post insights',
      };
    }

    const data = await response.json() as {
      data: Array<{
        name: string;
        values: Array<{ value: number | Record<string, number> }>;
      }>;
    };

    // Parse the insights data
    const metrics = {
      impressions: 0,
      reach: 0,
      engagement: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
    };

    for (const insight of data.data) {
      const value = insight.values[0]?.value;
      switch (insight.name) {
        case 'post_impressions':
          metrics.impressions = typeof value === 'number' ? value : 0;
          break;
        case 'post_engaged_users':
          metrics.engagement = typeof value === 'number' ? value : 0;
          break;
        case 'post_reactions_by_type_total':
          if (typeof value === 'object') {
            metrics.reactions = Object.values(value).reduce((a, b) => a + b, 0);
          }
          break;
        case 'post_comments':
          metrics.comments = typeof value === 'number' ? value : 0;
          break;
        case 'post_shares':
          metrics.shares = typeof value === 'number' ? value : 0;
          break;
      }
    }

    return {
      success: true,
      metrics,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch post insights',
    };
  }
}