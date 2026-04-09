// apps/web/src/app/(dashboard)/companies/[id]/queue/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  FileText,
  Send,
  Calendar,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Sparkles,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Globe,
  Check,
  X,
  CalendarPlus,
  ThumbsUp,
  MessageCircle,
  Share2,
  Wand2,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

interface Company {
  id: string;
  name: string;
}

interface Platform {
  id: string;
  type: string;
  name: string;
  username?: string;
}

interface GeneratedPost {
  id: string;
  title?: string | null;
  content: string;
  hashtags: string[];
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'ARCHIVED';
  scheduledFor?: string | null;
  publishedAt?: string | null;
  platformId: string;
  platform: Platform;
  createdAt: string;
  updatedAt: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

interface ContentQueueItem {
  id: string;
  content: string;
  hashtags: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REGENERATING' | 'SCHEDULED';
  suggestedDate: string;
  suggestedTime: string;
  pillar?: string | null;
  contentType?: string | null;
  tone?: string | null;
  engagementPrediction?: string | null;
  platformId: string;
  platform: Platform;
  createdAt: string;
}

type TabType = 'all' | 'pending' | 'drafts' | 'scheduled' | 'published';

// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------

const platformIcons: Record<string, typeof Linkedin> = {
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  wordpress: Globe,
};

const platformColors: Record<string, { bg: string; text: string }> = {
  linkedin: { bg: 'bg-[#0A66C2]/10', text: 'text-[#0A66C2]' },
  facebook: { bg: 'bg-[#1877F2]/10', text: 'text-[#1877F2]' },
  twitter: { bg: 'bg-[#1DA1F2]/10', text: 'text-[#1DA1F2]' },
  instagram: { bg: 'bg-[#E4405F]/10', text: 'text-[#E4405F]' },
  wordpress: { bg: 'bg-[#21759B]/10', text: 'text-[#21759B]' },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400' },
  PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  APPROVED: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  SCHEDULED: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
  PUBLISHING: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
  PUBLISHED: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
  FAILED: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  REJECTED: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  REGENERATING: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' },
  ARCHIVED: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
};

// ---------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------

export default function CompanyQueuePage() {
  const params = useParams();
  const companyId = params.id as string;

  // Data state
  const [company, setCompany] = useState<Company | null>(null);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [queueItems, setQueueItems] = useState<ContentQueueItem[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'post' | 'queue' } | null>(null);
  
  // Weekly generation state
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);

  // ---------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------

  const fetchData = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);

      const [companyRes, postsRes, queueRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/posts?companyId=${companyId}`),
        fetch(`/api/queue?companyId=${companyId}`),
      ]);

      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }

      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setQueueItems(queueData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setNotification({ type: 'error', message: 'Failed to load queue data' });
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ---------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------

  const stats = {
    pending: queueItems.filter((q) => q.status === 'PENDING').length,
    drafts: posts.filter((p) => p.status === 'DRAFT').length,
    scheduled: posts.filter((p) => p.status === 'SCHEDULED').length,
    published: posts.filter((p) => p.status === 'PUBLISHED').length,
  };

  const filteredPosts = posts.filter((post) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'drafts') return post.status === 'DRAFT';
    if (activeTab === 'scheduled') return post.status === 'SCHEDULED';
    if (activeTab === 'published') return post.status === 'PUBLISHED';
    return true;
  });

  const filteredQueue = activeTab === 'all' || activeTab === 'pending'
    ? queueItems.filter((q) => q.status === 'PENDING')
    : [];

  // ---------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------

  async function handleGenerateWeeklyContent() {
    setIsGeneratingWeekly(true);
    setNotification(null);
    
    try {
      const res = await fetch(`/api/cron/auto-generate?companyId=${companyId}`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        const company = data.companies?.[0];
        const generated = company?.postsGenerated || 0;
        const queued = company?.postsQueued || 0;
        const scheduled = company?.postsScheduled || 0;
        
        if (generated === 0) {
          setNotification({
            type: 'error',
            message: company?.errors?.[0] || 'No content generated. Check company settings and connected platforms.',
          });
        } else {
          setNotification({
            type: 'success',
            message: `Generated ${generated} posts! ${queued > 0 ? `${queued} pending review.` : ''} ${scheduled > 0 ? `${scheduled} auto-scheduled.` : ''}`,
          });
          fetchData();
        }
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Weekly generation failed:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate weekly content',
      });
    } finally {
      setIsGeneratingWeekly(false);
    }
  }

  async function handleApproveQueue(queueId: string) {
    setActionLoading(queueId);
    try {
      const res = await fetch(`/api/queue/${queueId}/approve`, { method: 'POST' });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Content approved and moved to drafts' });
        fetchData();
      } else {
        throw new Error('Failed to approve');
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to approve content' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectQueue(queueId: string) {
    setActionLoading(queueId);
    try {
      const res = await fetch(`/api/queue/${queueId}/reject`, { method: 'POST' });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Content rejected' });
        fetchData();
      } else {
        throw new Error('Failed to reject');
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to reject content' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRegenerateQueue(queueId: string) {
    setActionLoading(queueId);
    try {
      const res = await fetch(`/api/queue/${queueId}/regenerate`, { method: 'POST' });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Regenerating content...' });
        fetchData();
      } else {
        throw new Error('Failed to regenerate');
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to regenerate content' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeletePost(postId: string) {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Post deleted' });
        setDeleteConfirm(null);
        fetchData();
      } else {
        throw new Error('Failed to delete');
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to delete post' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteQueueItem(queueId: string) {
    setActionLoading(queueId);
    try {
      const res = await fetch(`/api/queue/${queueId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Queue item deleted' });
        setDeleteConfirm(null);
        fetchData();
      } else {
        throw new Error('Failed to delete');
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to delete queue item' });
    } finally {
      setActionLoading(null);
    }
  }

  // ---------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------

  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function truncateContent(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading queue...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle size={48} className="text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Company Not Found</h3>
          <Link href="/companies" className="mt-4 text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowLeft size={14} />
            Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-3 p-4 rounded-lg border ${
              notification.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <p className="text-sm font-medium">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-auto opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href={`/companies/${companyId}`}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              {company.name}
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Content Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your scheduled and draft posts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          
          {/* NEW: Generate Weekly Content Button */}
          <button
            onClick={handleGenerateWeeklyContent}
            disabled={isGeneratingWeekly}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingWeekly ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={16} />
                Generate Weekly
              </>
            )}
          </button>
          
          <Link
            href={`/companies/${companyId}/generate`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Single Post
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'amber' },
          { label: 'Drafts', value: stats.drafts, icon: FileText, color: 'gray' },
          { label: 'Scheduled', value: stats.scheduled, icon: Calendar, color: 'purple' },
          { label: 'Published', value: stats.published, icon: Send, color: 'green' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-card border border-border/60"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>
                <stat.icon size={20} className={`text-${stat.color}-500`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-secondary/30 rounded-lg w-fit">
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: `Pending (${stats.pending})` },
          { id: 'drafts', label: `Drafts (${stats.drafts})` },
          { id: 'scheduled', label: `Scheduled (${stats.scheduled})` },
          { id: 'published', label: `Published (${stats.published})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pending Queue Items */}
      {filteredQueue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            AI-Generated (Pending Approval)
          </h2>
          <div className="space-y-2">
            {filteredQueue.map((item) => {
              const platformType = item.platform?.type?.toLowerCase() || 'linkedin';
              const Icon = platformIcons[platformType] || Globe;
              const colors = platformColors[platformType] || platformColors.linkedin;
              const isExpanded = expandedPost === `queue-${item.id}`;
              const isActionLoading = actionLoading === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${colors.bg} shrink-0`}>
                          <Icon size={18} className={colors.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-medium capitalize">{platformType}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors.PENDING.bg} ${statusColors.PENDING.text}`}>
                              Pending
                            </span>
                            {item.contentType && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                {item.contentType}
                              </span>
                            )}
                            {item.engagementPrediction && (
                              <span className="text-[10px] text-muted-foreground">
                                Est. {item.engagementPrediction} engagement
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground">
                            {isExpanded ? item.content : truncateContent(item.content)}
                          </p>
                          {item.content.length > 150 && (
                            <button
                              onClick={() => setExpandedPost(isExpanded ? null : `queue-${item.id}`)}
                              className="text-xs text-primary hover:underline mt-1"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                          {item.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.hashtags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[10px] text-primary">
                                  #{tag}
                                </span>
                              ))}
                              {item.hashtags.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{item.hashtags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Suggested: {formatDate(item.suggestedDate)} at {item.suggestedTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleApproveQueue(item.id)}
                          disabled={isActionLoading}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button
                          onClick={() => handleRejectQueue(item.id)}
                          disabled={isActionLoading}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => handleRegenerateQueue(item.id)}
                          disabled={isActionLoading}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
                          title="Regenerate"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Posts List */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-3">
          {(activeTab === 'all' || activeTab === 'pending') && filteredQueue.length > 0 && (
            <h2 className="text-sm font-semibold">Posts</h2>
          )}
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="divide-y divide-border/40">
              {filteredPosts.map((post) => {
                const platformType = post.platform?.type?.toLowerCase() || 'linkedin';
                const Icon = platformIcons[platformType] || Globe;
                const colors = platformColors[platformType] || platformColors.linkedin;
                const statusStyle = statusColors[post.status] || statusColors.DRAFT;
                const isExpanded = expandedPost === post.id;

                return (
                  <div key={post.id} className="p-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${colors.bg} shrink-0`}>
                          <Icon size={18} className={colors.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium capitalize">{platformType}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                              {post.status}
                            </span>
                          </div>
                          {post.title && (
                            <p className="text-sm font-medium mb-1">{post.title}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {isExpanded ? post.content : truncateContent(post.content)}
                          </p>
                          {post.content.length > 150 && (
                            <button
                              onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                              className="text-xs text-primary hover:underline mt-1"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                            {post.scheduledFor && (
                              <span className="flex items-center gap-1">
                                <Calendar size={10} />
                                {formatDate(post.scheduledFor)}
                              </span>
                            )}
                            {post.status === 'PUBLISHED' && (
                              <span className="flex items-center gap-2">
                                <span className="flex items-center gap-0.5">
                                  <ThumbsUp size={10} />
                                  {post.likes || 0}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <MessageCircle size={10} />
                                  {post.comments || 0}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Share2 size={10} />
                                  {post.shares || 0}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {post.status === 'DRAFT' && (
                          <Link
                            href={`/companies/${companyId}/calendar?schedule=${post.id}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                            title="Schedule"
                          >
                            <CalendarPlus size={16} />
                          </Link>
                        )}
                        <button
                          onClick={() => setDeleteConfirm({ id: post.id, type: 'post' })}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        activeTab !== 'pending' && filteredQueue.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 p-12 text-center">
            <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-sm font-medium text-muted-foreground">No posts found</h3>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {activeTab === 'all'
                ? 'Generate some content to get started'
                : `No ${activeTab} posts yet`}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={handleGenerateWeeklyContent}
                disabled={isGeneratingWeekly}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                <Zap size={16} />
                {isGeneratingWeekly ? 'Generating...' : 'Generate Weekly'}
              </button>
              <Link
                href={`/companies/${companyId}/generate`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
              >
                <Sparkles size={16} />
                Single Post
              </Link>
            </div>
          </div>
        )
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setDeleteConfirm(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border/60 bg-background p-6 shadow-xl mx-4">
            <h3 className="text-lg font-semibold">Delete {deleteConfirm.type === 'post' ? 'Post' : 'Queue Item'}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'post') {
                    handleDeletePost(deleteConfirm.id);
                  } else {
                    handleDeleteQueueItem(deleteConfirm.id);
                  }
                }}
                disabled={actionLoading === deleteConfirm.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading === deleteConfirm.id && <Loader2 size={16} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}