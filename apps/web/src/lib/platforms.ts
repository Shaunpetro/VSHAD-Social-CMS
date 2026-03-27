export interface PlatformConfig {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  defaultScopes: string[];
  accountPlaceholder: string;
  oauthSupported: boolean;
}

export const PLATFORMS: Record<string, PlatformConfig> = {
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]/10",
    borderColor: "border-[#0A66C2]/20",
    description: "Professional networking & B2B content",
    defaultScopes: ["openid", "profile", "email", "w_member_social", "r_member_social"],
    accountPlaceholder: "e.g. My Company Page",
    oauthSupported: true,
  },
  twitter: {
    id: "twitter",
    name: "Twitter / X",
    color: "text-[#1DA1F2]",
    bgColor: "bg-[#1DA1F2]/10",
    borderColor: "border-[#1DA1F2]/20",
    description: "Microblogging & real-time engagement",
    defaultScopes: ["tweet.read", "tweet.write", "users.read"],
    accountPlaceholder: "e.g. @mycompany",
    oauthSupported: false,
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
    borderColor: "border-[#1877F2]/20",
    description: "Social networking & community engagement",
    defaultScopes: [
      "pages_manage_posts",
      "pages_read_engagement",
      "pages_show_list",
    ],
    accountPlaceholder: "e.g. My Business Page",
    oauthSupported: true,
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    color: "text-[#E4405F]",
    bgColor: "bg-[#E4405F]/10",
    borderColor: "border-[#E4405F]/20",
    description: "Visual storytelling & brand showcase",
    defaultScopes: ["instagram_basic", "instagram_content_publish"],
    accountPlaceholder: "e.g. @mycompany",
    oauthSupported: false,
  },
  wordpress: {
    id: "wordpress",
    name: "WordPress",
    color: "text-[#21759B]",
    bgColor: "bg-[#21759B]/10",
    borderColor: "border-[#21759B]/20",
    description: "Blog & long-form content publishing",
    defaultScopes: ["posts", "media"],
    accountPlaceholder: "e.g. myblog.wordpress.com",
    oauthSupported: false,
  },
};

export const PLATFORM_LIST = Object.values(PLATFORMS);

export type PlatformId = keyof typeof PLATFORMS;

export interface PlatformConnection {
  id: string;
  platform: string;
  accountName: string;
  status: string;
  scopes: string[];
  config: Record<string, unknown> | null;
  expiresAt: string | null;
  companyId: string;
  company: {
    id: string;
    name: string;
  };
  createdAt?: string;
}
