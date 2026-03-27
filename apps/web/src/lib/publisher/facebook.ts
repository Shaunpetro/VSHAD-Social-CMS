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

  if (mediaUrls && mediaUrls.length > 0) {
    const validMediaUrls = mediaUrls.filter(url => url && url.trim().length > 0);

    if (validMediaUrls.length === 1) {
      console.log('[Facebook Publisher] Single image detected, using photos endpoint');
      return createFacebookPhotoPost({ ...options, photoUrl: validMediaUrls[0] });
    } else if (validMediaUrls.length > 1) {
      console.log('[Facebook Publisher] Multiple images detected:', validMediaUrls.length);
      return createFacebookMultiPhotoPost({ ...options, photoUrls: validMediaUrls });
    }
  }

  console.log('[Facebook Publisher] Creating text-only post');

  const postData: Record<string, string> = {
    message: content,
    access_token: pageAccessToken,
  };

  if (link) {
    postData.link = link;
  }

  try {
    const response = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(postData),
    });

    const responseData = await response.json() as {
      id?: string;
      error?: { message?: string; code?: number; error_subcode?: number };
    };

    if (!response.ok) {
      const errorMessage = responseData.error?.message || `Facebook API error (${response.status})`;
      console.error('[Facebook Publisher] Post failed:', responseData.error);

      if (response.status === 401 || responseData.error?.code === 190) {
        return { success: false, error: 'Facebook access token expired. Please reconnect your account.' };
      }
      if (responseData.error?.code === 200) {
        return { success: false, error: 'Insufficient permissions to post to this page.' };
      }
      if (response.status === 429 || responseData.error?.code === 32) {
        return { success: false, error: 'Facebook rate limit reached. Please try again later.' };
      }
      return { success: false, error: errorMessage };
    }

    const postId = responseData.id;
    if (!postId) {
      return { success: false, error: 'Facebook did not return a post ID' };
    }

    const postUrl = `https://www.facebook.com/${postId.replace('_', '/posts/')}`;
    console.log('[Facebook Publisher] Post created successfully:', postId);

    return { success: true, postId, postUrl };
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        url: photoUrl,
        caption: content,
        access_token: pageAccessToken,
      }),
    });

    const responseData = await response.json() as {
      id?: string; post_id?: string;
      error?: { message?: string; code?: number };
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
 */
export async function createFacebookMultiPhotoPost(
  options: FacebookPostOptions & { photoUrls: string[] }
): Promise<FacebookPostResult> {
  const { pageAccessToken, pageId, content, photoUrls } = options;
  console.log('[Facebook Publisher] Creating multi-photo post:', { pageId, photoCount: photoUrls.length });

  try {
    const uploadedPhotoIds: string[] = [];

    for (const photoUrl of photoUrls) {
      console.log('[Facebook Publisher] Uploading unpublished photo:', photoUrl);
      const uploadResponse = await fetch(`${FB_GRAPH_URL}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          url: photoUrl,
          published: 'false',
          access_token: pageAccessToken,
        }),
      });

      const uploadData = await uploadResponse.json() as { id?: string; error?: { message?: string } };
      if (!uploadResponse.ok || !uploadData.id) {
        console.error('[Facebook Publisher] Failed to upload photo:', uploadData.error);
        continue;
      }
      uploadedPhotoIds.push(uploadData.id);
      console.log('[Facebook Publisher] Photo uploaded:', uploadData.id);
    }

    if (uploadedPhotoIds.length === 0) {
      console.warn('[Facebook Publisher] All photo uploads failed, creating text-only post');
      return createFacebookPost({ pageAccessToken, pageId, content });
    }

    const postData: Record<string, string> = {
      message: content,
      access_token: pageAccessToken,
    };
    uploadedPhotoIds.forEach((photoId, index) => {
      postData[`attached_media[${index}]`] = JSON.stringify({ media_fbid: photoId });
    });

    console.log('[Facebook Publisher] Creating feed post with', uploadedPhotoIds.length, 'attached photos');

    const response = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(postData),
    });

    const responseData = await response.json() as {
      id?: string; error?: { message?: string; code?: number };
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
      id?: string; name?: string;
      error?: { message?: string; code?: number };
    };

    if (!response.ok) {
      return { valid: false, error: responseData.error?.message || 'Token verification failed' };
    }
    return {
      valid: true,
      pageInfo: { id: responseData.id || '', name: responseData.name || '' },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    };
  }
}

/**
 * Get page insights/metrics for a Facebook post
 * 
 * Strategy:
 * 1. Try the /insights endpoint (requires read_insights permission) for impressions
 * 2. ALWAYS get post data (likes, comments, shares) from the post endpoint
 *    which works with pages_read_engagement permission
 * 3. Merge results from both
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
  console.log('[Facebook Insights] Fetching insights for post:', postId);

  const metrics = {
    impressions: 0,
    reach: 0,
    engagement: 0,
    reactions: 0,
    comments: 0,
    shares: 0,
  };

  // ===== Strategy 1: Try insights endpoint (for impressions/reach) =====
  // This requires read_insights permission - may fail, that's OK
  try {
    const insightsResponse = await fetch(
      `${FB_GRAPH_URL}/${postId}/insights?metric=post_impressions,post_impressions_unique,post_engaged_users&access_token=${pageAccessToken}`
    );

    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json() as {
        data: Array<{
          name: string;
          values: Array<{ value: number | Record<string, number> }>;
        }>;
      };

      for (const insight of insightsData.data) {
        const value = insight.values[0]?.value;
        switch (insight.name) {
          case 'post_impressions':
            metrics.impressions = typeof value === 'number' ? value : 0;
            break;
          case 'post_impressions_unique':
            metrics.reach = typeof value === 'number' ? value : 0;
            break;
          case 'post_engaged_users':
            metrics.engagement = typeof value === 'number' ? value : 0;
            break;
        }
      }
      console.log('[Facebook Insights] Got insights data:', {
        impressions: metrics.impressions,
        reach: metrics.reach,
        engagement: metrics.engagement,
      });
    } else {
      console.warn('[Facebook Insights] Insights endpoint not available (likely missing read_insights permission). Using post data fallback for engagement metrics.');
    }
  } catch (e) {
    console.warn('[Facebook Insights] Insights endpoint failed:', e instanceof Error ? e.message : e);
  }

  // ===== Strategy 2: Get post data (likes, comments, shares) =====
  // This works with pages_read_engagement permission (which we have!)
  try {
    const postResponse = await fetch(
      `${FB_GRAPH_URL}/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${pageAccessToken}`
    );

    if (!postResponse.ok) {
      const errorData = await postResponse.json() as { error?: { message?: string } };
      const errorMsg = errorData.error?.message || `HTTP ${postResponse.status}`;
      console.error('[Facebook Insights] Post data fetch failed:', errorMsg);

      // If we got insights data earlier, still return what we have
      if (metrics.impressions > 0 || metrics.engagement > 0) {
        console.log('[Facebook Insights] Returning partial metrics from insights endpoint');
        return { success: true, metrics };
      }

      return { success: false, error: errorMsg };
    }

    const postData = await postResponse.json() as {
      likes?: { summary?: { total_count?: number } };
      comments?: { summary?: { total_count?: number } };
      shares?: { count?: number };
    };

    metrics.reactions = postData.likes?.summary?.total_count || 0;
    metrics.comments = postData.comments?.summary?.total_count || 0;
    metrics.shares = postData.shares?.count || 0;

    // If we didn't get engagement from insights, calculate from post data
    if (metrics.engagement === 0) {
      metrics.engagement = metrics.reactions + metrics.comments + metrics.shares;
    }

    console.log('[Facebook Insights] Final metrics:', metrics);

    return { success: true, metrics };
  } catch (error) {
    console.error('[Facebook Insights] Post data fetch failed:', error);

    // If we got insights data earlier, still return what we have
    if (metrics.impressions > 0 || metrics.engagement > 0) {
      return { success: true, metrics };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch post data',
    };
  }
}
