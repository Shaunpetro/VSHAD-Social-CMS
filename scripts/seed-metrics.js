// scripts/seed-metrics.js
/**
 * Seeds realistic engagement metrics for GeneratedPost records.
 *
 * Defaults:
 *  - Statuses: PUBLISHED only
 *  - Range: last 90 days (based on publishedAt/scheduledFor/createdAt)
 *  - Skips posts that already have metrics unless --overwrite is provided
 *
 * Usage:
 *  pnpm seed:metrics
 *  pnpm seed:metrics -- --days=180
 *  pnpm seed:metrics -- --companyId=xxx
 *  pnpm seed:metrics -- --includeScheduled
 *  pnpm seed:metrics -- --overwrite
 *  pnpm seed:metrics -- --dryRun
 */

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function parseDotEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const raw = fs.readFileSync(filePath, "utf8");
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();

      // Strip surrounding quotes
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }

      // Don't override existing env vars
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    // ignore
  }
}

function loadEnv() {
  // Try typical Next/Node env files at repo root
  const repoRoot = process.cwd();
  parseDotEnvFile(path.join(repoRoot, ".env"));
  parseDotEnvFile(path.join(repoRoot, ".env.local"));
  parseDotEnvFile(path.join(repoRoot, ".env.development.local"));
}

function getArgValue(name, defaultValue) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (!hit) return defaultValue;
  return hit.slice(prefix.length);
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

// Deterministic-ish PRNG from a numeric seed
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Simple string hash to seed PRNG per post
function hashStringToUint32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clampInt(n, min, max) {
  const x = Math.round(Number(n));
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng, min, max) {
  return rng() * (max - min) + min;
}

/**
 * Platform tuning: impression ranges and engagement-rate ranges.
 * Engagement rate is (likes+comments+shares)/impressions.
 */
const PLATFORM_TUNING = {
  LINKEDIN: {
    impressions: [800, 6000],
    engagementRate: [0.02, 0.065],
    commentShareSplit: { comments: [0.08, 0.16], shares: [0.12, 0.22] },
  },
  INSTAGRAM: {
    impressions: [1200, 9000],
    engagementRate: [0.03, 0.11],
    commentShareSplit: { comments: [0.06, 0.14], shares: [0.06, 0.14] },
  },
  TWITTER: {
    impressions: [600, 7000],
    engagementRate: [0.01, 0.055],
    commentShareSplit: { comments: [0.05, 0.12], shares: [0.08, 0.18] },
  },
  FACEBOOK: {
    impressions: [700, 8000],
    engagementRate: [0.01, 0.05],
    commentShareSplit: { comments: [0.06, 0.14], shares: [0.06, 0.16] },
  },
  WORDPRESS: {
    impressions: [250, 4500],
    engagementRate: [0.006, 0.03],
    commentShareSplit: { comments: [0.03, 0.08], shares: [0.03, 0.08] },
  },
  UNKNOWN: {
    impressions: [400, 5000],
    engagementRate: [0.01, 0.05],
    commentShareSplit: { comments: [0.05, 0.14], shares: [0.05, 0.18] },
  },
};

function getPlatformType(post) {
  const t = post?.platform?.type;
  if (!t) return "UNKNOWN";
  const upper = String(t).toUpperCase();
  return PLATFORM_TUNING[upper] ? upper : "UNKNOWN";
}

function computeMetricsForPost(post, globalSeed) {
  const platformType = getPlatformType(post);
  const tuning = PLATFORM_TUNING[platformType] || PLATFORM_TUNING.UNKNOWN;

  const seed = (hashStringToUint32(post.id) ^ globalSeed) >>> 0;
  const rng = mulberry32(seed);

  // Base impressions with mild skew (more small than huge)
  const [impMin, impMax] = tuning.impressions;
  const skew = Math.pow(rng(), 0.65); // skew towards higher a bit
  let impressions = impMin + skew * (impMax - impMin);

  // Boost if media exists (images/videos often increase impressions)
  const mediaCount = Array.isArray(post.postMedia) ? post.postMedia.length : 0;
  if (mediaCount > 0) {
    const mediaBoost = 1 + Math.min(0.25, 0.08 * mediaCount); // up to +25%
    impressions *= mediaBoost;
  }

  // Small boost if content has hashtags
  const hashtagCount = Array.isArray(post.hashtags) ? post.hashtags.length : 0;
  if (hashtagCount > 0) {
    impressions *= 1 + Math.min(0.15, 0.02 * hashtagCount); // up to +15%
  }

  impressions = clampInt(impressions, 10, 2_000_000);

  const [erMin, erMax] = tuning.engagementRate;
  const engagementRate = randFloat(rng, erMin, erMax);

  const engagements = clampInt(impressions * engagementRate, 0, impressions);

  const [cMin, cMax] = tuning.commentShareSplit.comments;
  const [sMin, sMax] = tuning.commentShareSplit.shares;

  const commentsShare = randFloat(rng, cMin, cMax);
  const sharesShare = randFloat(rng, sMin, sMax);

  // Ensure shares+comments doesn't exceed 60% of engagements
  const totalNonLike = Math.min(0.6, commentsShare + sharesShare);
  const normalizedComments = commentsShare / (commentsShare + sharesShare || 1);
  const normalizedShares = sharesShare / (commentsShare + sharesShare || 1);

  let comments = clampInt(engagements * totalNonLike * normalizedComments, 0, engagements);
  let shares = clampInt(engagements * totalNonLike * normalizedShares, 0, engagements);
  let likes = clampInt(engagements - comments - shares, 0, engagements);

  // Add small jitter so not too "perfect"
  const jitter = () => (rng() - 0.5) * 0.06; // +/-3%
  likes = clampInt(likes * (1 + jitter()), 0, impressions);
  comments = clampInt(comments * (1 + jitter()), 0, impressions);
  shares = clampInt(shares * (1 + jitter()), 0, impressions);

  // Ensure totals don't exceed impressions and remain consistent
  const total = likes + comments + shares;
  if (total > impressions) {
    const scale = impressions / total;
    likes = clampInt(likes * scale, 0, impressions);
    comments = clampInt(comments * scale, 0, impressions);
    shares = clampInt(shares * scale, 0, impressions);
  }

  // Avoid all zeros when impressions > 0
  if (impressions > 0 && likes === 0 && comments === 0 && shares === 0) {
    likes = Math.max(1, randInt(rng, 1, 3));
  }

  return { impressions, likes, comments, shares };
}

async function asyncPool(limit, items, fn) {
  const ret = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    ret.push(p);

    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

async function main() {
  loadEnv();

  const companyId = getArgValue("companyId", "");
  const days = Number(getArgValue("days", "90"));
  const includeScheduled = hasFlag("includeScheduled");
  const overwrite = hasFlag("overwrite");
  const dryRun = hasFlag("dryRun");
  const concurrency = clampInt(getArgValue("concurrency", "10"), 1, 50);

  const globalSeed = hashStringToUint32(getArgValue("seed", "vshad-metrics-seed"));

  if (!process.env.DATABASE_URL) {
    console.error(
      "[seed-metrics] DATABASE_URL is not set. Ensure your .env/.env.local is present or export DATABASE_URL."
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (Number.isFinite(days) ? days : 90));

  const statuses = includeScheduled ? ["PUBLISHED", "SCHEDULED"] : ["PUBLISHED"];

  console.log("[seed-metrics] Starting...");
  console.log(
    JSON.stringify(
      {
        companyId: companyId || "(all)",
        days: Number.isFinite(days) ? days : 90,
        includeScheduled,
        overwrite,
        dryRun,
        concurrency,
        cutoff: cutoff.toISOString(),
        statuses,
      },
      null,
      2
    )
  );

  const where = {
    status: { in: statuses },
    ...(companyId ? { companyId } : {}),
    OR: [
      { publishedAt: { gte: cutoff } },
      { scheduledFor: { gte: cutoff } },
      { createdAt: { gte: cutoff } },
    ],
  };

  const posts = await prisma.generatedPost.findMany({
    where,
    include: {
      platform: true,
      postMedia: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`[seed-metrics] Found ${posts.length} posts in scope.`);

  let eligible = 0;
  let updated = 0;
  let skipped = 0;

  const updates = [];

  for (const post of posts) {
    const alreadyHasMetrics =
      (post.impressions || 0) > 0 ||
      (post.likes || 0) > 0 ||
      (post.comments || 0) > 0 ||
      (post.shares || 0) > 0;

    if (alreadyHasMetrics && !overwrite) {
      skipped++;
      continue;
    }

    eligible++;

    const nextMetrics = computeMetricsForPost(post, globalSeed);

    updates.push({
      id: post.id,
      platformType: getPlatformType(post),
      prev: {
        impressions: post.impressions || 0,
        likes: post.likes || 0,
        comments: post.comments || 0,
        shares: post.shares || 0,
      },
      next: nextMetrics,
    });
  }

  console.log(
    `[seed-metrics] Eligible for update: ${eligible}. Skipped (already had metrics): ${skipped}.`
  );

  if (dryRun) {
    console.log("[seed-metrics] Dry run enabled. Showing sample (up to 10):");
    console.log(
      updates.slice(0, 10).map((u) => ({
        id: u.id,
        platformType: u.platformType,
        prev: u.prev,
        next: u.next,
      }))
    );
    await prisma.$disconnect();
    return;
  }

  await asyncPool(concurrency, updates, async (u) => {
    await prisma.generatedPost.update({
      where: { id: u.id },
      data: {
        impressions: u.next.impressions,
        likes: u.next.likes,
        comments: u.next.comments,
        shares: u.next.shares,
      },
    });
    updated++;
  });

  console.log(`[seed-metrics] Done. Updated ${updated} posts.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[seed-metrics] Fatal error:", err);
  process.exit(1);
});