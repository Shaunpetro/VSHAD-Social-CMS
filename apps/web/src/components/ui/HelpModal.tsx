// apps/web/src/components/ui/HelpModal.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  MessageCircle,
  Linkedin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Heart,
  Code2,
  Zap,
  BookOpen,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// FAQ Data
const FAQ_ITEMS = [
  {
    question: "How do I connect my social media accounts?",
    answer:
      "Navigate to any company's dashboard and click on 'Platforms' in the sidebar. From there, click 'Connect Platform' and follow the OAuth flow for LinkedIn, Facebook, Instagram, or Twitter.",
  },
  {
    question: "How does the AI generate content?",
    answer:
      "Our AI uses your company's intelligence profile (brand voice, content pillars, target audience) combined with the 40-30-20-10 content mix strategy. It generates educational (40%), engagement (30%), social proof (20%), and promotional (10%) content optimized for each platform.",
  },
  {
    question: "What is the content queue?",
    answer:
      "The content queue holds AI-generated posts awaiting your approval. You can review, edit, approve, or reject each post. Approved posts move to your scheduled content calendar.",
  },
  {
    question: "How do I schedule posts?",
    answer:
      "After approving content from the queue, posts are automatically scheduled based on your posting preferences. You can also drag and drop posts on the calendar to reschedule them.",
  },
  {
    question: "What does the intelligence score mean?",
    answer:
      "The intelligence score (0-100) measures how well the AI understands your brand. It increases as you complete your company profile, add content pillars, connect platforms, and as the system learns from your post performance.",
  },
  {
    question: "Can I edit AI-generated content?",
    answer:
      "Yes! Click on any post in the queue or calendar to open the detail modal. You can edit the content, hashtags, scheduled time, and media before publishing.",
  },
  {
    question: "How does auto-generation work?",
    answer:
      "Every Sunday at 8 PM (SAST), the system automatically generates a week's worth of content based on your posting preferences. You'll find new posts in your content queue ready for review.",
  },
  {
    question: "What platforms are supported?",
    answer:
      "Currently supported: LinkedIn (full support), Facebook Pages, Instagram Business, and Twitter/X. Each platform has optimized content formatting and character limits.",
  },
];

// Version info
const VERSION_INFO = {
  version: "3.0.0",
  releaseDate: "April 2025",
  codename: "Intelligence",
};

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<"about" | "faq" | "support">("about");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--bg-elevated)] rounded-2xl shadow-2xl border border-[var(--border-default)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[var(--border-default)] bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-blue-500/10">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
          >
            <X size={20} />
          </button>

          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-lg flex items-center justify-center">
              <Image
                src="/vshad-logo.png"
                alt="VSHAD RoboSocial"
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                VSHAD RoboSocial
                <span className="px-2 py-0.5 text-xs font-medium bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-full">
                  v{VERSION_INFO.version}
                </span>
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                AI-Powered Social Media Management
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4">
            {[
              { id: "about", label: "About", icon: Sparkles },
              { id: "faq", label: "FAQ", icon: HelpCircle },
              { id: "support", label: "Support", icon: MessageCircle },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  activeTab === id
                    ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* About Tab */}
          {activeTab === "about" && (
            <div className="space-y-6">
              {/* Product Description */}
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  VSHAD RoboSocial is an intelligent social media management platform that uses 
                  advanced AI to understand your brand, generate engaging content, and optimize 
                  your social media presence across multiple platforms.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Zap, label: "AI Content Generation", color: "text-yellow-500" },
                  { icon: BookOpen, label: "Brand Intelligence", color: "text-blue-500" },
                  { icon: Sparkles, label: "Auto-Scheduling", color: "text-purple-500" },
                  { icon: Code2, label: "Multi-Platform", color: "text-green-500" },
                ].map(({ icon: Icon, label, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]"
                  >
                    <div className={cn("p-2 rounded-lg bg-[var(--bg-tertiary)]", color)}>
                      <Icon size={18} />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Version Info */}
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Version Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Version</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      {VERSION_INFO.version} ({VERSION_INFO.codename})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Release Date</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      {VERSION_INFO.releaseDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Framework</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      Next.js 15 + TypeScript
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">AI Engine</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      Groq Llama 3.3 70B
                    </span>
                  </div>
                </div>
              </div>

              {/* Developer Credits */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-brand-500/10 via-purple-500/10 to-blue-500/10 border border-brand-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Heart size={16} className="text-red-500" />
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    Created with passion by
                  </h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    PM
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      Petro Malamule
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Full-Stack Developer & AI Enthusiast
                    </p>
                  </div>
                </div>

                {/* Powered By */}
                <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">Powered by</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)]">
                      <Sparkles size={14} className="text-brand-500" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        AI Technology
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)]">
                      <Code2 size={14} className="text-purple-500" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        ATG Solutions
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === "faq" && (
            <div className="space-y-2">
              {FAQ_ITEMS.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[var(--border-default)] overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)] pr-4">
                      {item.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronUp size={18} className="text-[var(--text-tertiary)] flex-shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-[var(--text-tertiary)] flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Support Tab */}
          {activeTab === "support" && (
            <div className="space-y-4">
              {/* Contact Options */}
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                  Get in Touch
                </h4>
                <div className="space-y-3">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/27813877744"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] hover:border-green-500/50 hover:bg-green-500/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white">
                      <MessageCircle size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        WhatsApp Support
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        +27 81 387 7744
                      </p>
                    </div>
                    <ExternalLink size={16} className="text-[var(--text-tertiary)] group-hover:text-green-500 transition-colors" />
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://linkedin.com/in/petromalamule"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white">
                      <Linkedin size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        LinkedIn
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        @petromalamule
                      </p>
                    </div>
                    <ExternalLink size={16} className="text-[var(--text-tertiary)] group-hover:text-[#0A66C2] transition-colors" />
                  </a>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-brand-500" />
                  Quick Tips
                </h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-500 mt-1">•</span>
                    Complete your company onboarding for better AI-generated content
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-500 mt-1">•</span>
                    Add at least 3 content pillars with multiple topics each
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-500 mt-1">•</span>
                    Connect multiple platforms to maximize your reach
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-500 mt-1">•</span>
                    Review and approve queued content regularly
                  </li>
                </ul>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Keyboard Shortcuts
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { keys: "Esc", action: "Close modals" },
                    { keys: "?", action: "Open help" },
                    { keys: "G C", action: "Go to Calendar" },
                    { keys: "G M", action: "Go to Media" },
                  ].map(({ keys, action }) => (
                    <div key={keys} className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">{action}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-[var(--bg-tertiary)] rounded border border-[var(--border-default)] text-[var(--text-primary)]">
                        {keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-tertiary)]">
              © 2025 VSHAD RoboSocial. All rights reserved.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}