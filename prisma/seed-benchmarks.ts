import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface IndustryBenchmarkData {
  industry: string
  recommendedPostsPerWeek: number
  optimalPostsMin: number
  optimalPostsMax: number
  bestDays: string[]
  bestTimes: Record<string, string[]>
  platformPriority: Record<string, number>
  suggestedThemes: Record<string, string[]>
  topHashtags: string[]
  seoKeywords: string[]
  recommendedTone: string
  humorAppropriate: boolean
  avgEngagementRate: number
}

const industryBenchmarks: IndustryBenchmarkData[] = [
  // ============================================
  // TECHNOLOGY & SOFTWARE
  // ============================================
  {
    industry: "Technology & Software",
    recommendedPostsPerWeek: 5,
    optimalPostsMin: 4,
    optimalPostsMax: 7,
    bestDays: ["Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["09:00", "12:00", "17:00"],
      "Facebook": ["13:00", "16:00", "20:00"],
      "Twitter": ["09:00", "12:00", "15:00", "18:00"],
      "Instagram": ["11:00", "14:00", "19:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Twitter": 2,
      "Facebook": 3,
      "Instagram": 4
    },
    suggestedThemes: {
      "thought_leadership": ["Industry trends", "Tech predictions", "Innovation insights"],
      "educational": ["How-to guides", "Tech tips", "Best practices"],
      "company_culture": ["Team highlights", "Behind the scenes", "Work culture"],
      "product": ["Feature announcements", "Use cases", "Customer success"],
      "engagement": ["Polls", "Questions", "Industry debates"]
    },
    topHashtags: [
      "#TechNews", "#Innovation", "#Software", "#DigitalTransformation",
      "#AI", "#MachineLearning", "#CloudComputing", "#Startup",
      "#TechTrends", "#FutureOfWork", "#SaaS", "#DevOps"
    ],
    seoKeywords: [
      "software solutions", "digital transformation", "tech innovation",
      "cloud services", "AI solutions", "automation tools"
    ],
    recommendedTone: "professional-innovative",
    humorAppropriate: true,
    avgEngagementRate: 2.8
  },

  // ============================================
  // HEALTHCARE & MEDICAL
  // ============================================
  {
    industry: "Healthcare & Medical",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 5,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["08:00", "12:00", "17:00"],
      "Facebook": ["09:00", "13:00", "19:00"],
      "Twitter": ["10:00", "14:00", "18:00"],
      "Instagram": ["12:00", "18:00", "20:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Facebook": 2,
      "Instagram": 3,
      "Twitter": 4
    },
    suggestedThemes: {
      "educational": ["Health tips", "Prevention advice", "Wellness guidance"],
      "awareness": ["Health observances", "Disease awareness", "Mental health"],
      "trust_building": ["Staff spotlights", "Credentials", "Patient stories"],
      "community": ["Local health events", "Community involvement", "Partnerships"],
      "innovation": ["New treatments", "Technology in healthcare", "Research updates"]
    },
    topHashtags: [
      "#Healthcare", "#Health", "#Wellness", "#MedicalCare",
      "#HealthTips", "#Prevention", "#MentalHealth", "#PatientCare",
      "#HealthAwareness", "#MedicalInnovation", "#Doctors", "#Nursing"
    ],
    seoKeywords: [
      "healthcare services", "medical care", "health wellness",
      "patient care", "medical treatment", "health provider"
    ],
    recommendedTone: "professional-compassionate",
    humorAppropriate: false,
    avgEngagementRate: 2.1
  },

  // ============================================
  // FINANCE & BANKING
  // ============================================
  {
    industry: "Finance & Banking",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 5,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["07:00", "08:00", "12:00", "17:00"],
      "Facebook": ["09:00", "12:00", "15:00"],
      "Twitter": ["08:00", "12:00", "16:00"],
      "Instagram": ["12:00", "17:00", "19:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Twitter": 2,
      "Facebook": 3,
      "Instagram": 4
    },
    suggestedThemes: {
      "educational": ["Financial tips", "Money management", "Investment basics"],
      "market_insights": ["Market updates", "Economic trends", "Industry analysis"],
      "trust_building": ["Security measures", "Company milestones", "Awards"],
      "product": ["Service highlights", "New features", "Customer benefits"],
      "compliance": ["Regulatory updates", "Consumer protection", "Transparency"]
    },
    topHashtags: [
      "#Finance", "#Banking", "#Investment", "#FinancialPlanning",
      "#MoneyManagement", "#Fintech", "#WealthManagement", "#PersonalFinance",
      "#FinancialServices", "#Economy", "#Savings", "#FinancialLiteracy"
    ],
    seoKeywords: [
      "financial services", "banking solutions", "investment management",
      "wealth planning", "financial advisor", "money management"
    ],
    recommendedTone: "professional-authoritative",
    humorAppropriate: false,
    avgEngagementRate: 1.9
  },

  // ============================================
  // REAL ESTATE
  // ============================================
  {
    industry: "Real Estate",
    recommendedPostsPerWeek: 5,
    optimalPostsMin: 4,
    optimalPostsMax: 7,
    bestDays: ["Tuesday", "Wednesday", "Thursday", "Saturday"],
    bestTimes: {
      "LinkedIn": ["08:00", "12:00", "18:00"],
      "Facebook": ["10:00", "13:00", "19:00", "20:00"],
      "Twitter": ["09:00", "12:00", "17:00"],
      "Instagram": ["11:00", "14:00", "19:00", "21:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Facebook": 2,
      "LinkedIn": 3,
      "Twitter": 4
    },
    suggestedThemes: {
      "listings": ["New properties", "Featured homes", "Price reductions"],
      "market_updates": ["Market trends", "Neighborhood insights", "Price reports"],
      "educational": ["Buying tips", "Selling advice", "Investment guidance"],
      "lifestyle": ["Home decor", "Neighborhood features", "Local events"],
      "success_stories": ["Sold properties", "Happy clients", "Testimonials"]
    },
    topHashtags: [
      "#RealEstate", "#Property", "#HomesForSale", "#Realtor",
      "#HomeOwnership", "#Investment", "#DreamHome", "#HouseHunting",
      "#PropertyMarket", "#LuxuryHomes", "#FirstTimeBuyer", "#SoldProperty"
    ],
    seoKeywords: [
      "homes for sale", "real estate agent", "property investment",
      "buy house", "sell property", "real estate market"
    ],
    recommendedTone: "professional-enthusiastic",
    humorAppropriate: true,
    avgEngagementRate: 3.2
  },

  // ============================================
  // RETAIL & E-COMMERCE
  // ============================================
  {
    industry: "Retail & E-commerce",
    recommendedPostsPerWeek: 6,
    optimalPostsMin: 5,
    optimalPostsMax: 10,
    bestDays: ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"],
    bestTimes: {
      "LinkedIn": ["10:00", "12:00", "15:00"],
      "Facebook": ["09:00", "12:00", "15:00", "20:00"],
      "Twitter": ["10:00", "13:00", "17:00", "21:00"],
      "Instagram": ["09:00", "12:00", "18:00", "21:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Facebook": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "products": ["New arrivals", "Best sellers", "Featured items"],
      "promotions": ["Sales", "Discounts", "Limited offers"],
      "lifestyle": ["Product styling", "Use cases", "Customer photos"],
      "behind_scenes": ["Production", "Team", "Packaging"],
      "engagement": ["Polls", "Contests", "User-generated content"]
    },
    topHashtags: [
      "#Shopping", "#Sale", "#NewArrivals", "#ShopNow",
      "#OnlineShopping", "#Retail", "#Fashion", "#Deals",
      "#LimitedEdition", "#MustHave", "#ShopLocal", "#Ecommerce"
    ],
    seoKeywords: [
      "online shopping", "buy online", "best deals",
      "shop now", "free shipping", "new arrivals"
    ],
    recommendedTone: "friendly-exciting",
    humorAppropriate: true,
    avgEngagementRate: 3.8
  },

  // ============================================
  // FOOD & RESTAURANT
  // ============================================
  {
    industry: "Food & Restaurant",
    recommendedPostsPerWeek: 6,
    optimalPostsMin: 5,
    optimalPostsMax: 10,
    bestDays: ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    bestTimes: {
      "LinkedIn": ["11:00", "12:00"],
      "Facebook": ["10:00", "12:00", "17:00", "19:00"],
      "Twitter": ["11:00", "13:00", "18:00", "20:00"],
      "Instagram": ["11:00", "14:00", "18:00", "20:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Facebook": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "food_showcase": ["Dishes", "Specials", "New menu items"],
      "behind_scenes": ["Kitchen", "Chef", "Ingredients"],
      "promotions": ["Happy hour", "Specials", "Events"],
      "engagement": ["Food polls", "Recommendations", "Reviews"],
      "community": ["Local sourcing", "Staff stories", "Customer features"]
    },
    topHashtags: [
      "#Food", "#Foodie", "#Restaurant", "#Delicious",
      "#FoodPorn", "#Yummy", "#Chef", "#Dining",
      "#FoodLover", "#Tasty", "#EatLocal", "#FreshFood"
    ],
    seoKeywords: [
      "restaurant near me", "best food", "dining experience",
      "local restaurant", "fresh food", "menu specials"
    ],
    recommendedTone: "warm-appetizing",
    humorAppropriate: true,
    avgEngagementRate: 4.2
  },

  // ============================================
  // LEGAL SERVICES
  // ============================================
  {
    industry: "Legal Services",
    recommendedPostsPerWeek: 3,
    optimalPostsMin: 2,
    optimalPostsMax: 4,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["08:00", "10:00", "16:00"],
      "Facebook": ["09:00", "12:00", "17:00"],
      "Twitter": ["09:00", "13:00", "16:00"],
      "Instagram": ["12:00", "17:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Facebook": 2,
      "Twitter": 3,
      "Instagram": 4
    },
    suggestedThemes: {
      "educational": ["Legal tips", "Know your rights", "Process explanations"],
      "updates": ["Law changes", "Regulatory updates", "Case studies"],
      "trust_building": ["Attorney profiles", "Success stories", "Credentials"],
      "community": ["Pro bono work", "Community involvement", "Events"],
      "faq": ["Common questions", "Myth busting", "Client concerns"]
    },
    topHashtags: [
      "#Law", "#Legal", "#Attorney", "#Lawyer",
      "#LegalAdvice", "#Justice", "#LegalServices", "#LawFirm",
      "#LegalTips", "#YourRights", "#LegalHelp", "#Litigation"
    ],
    seoKeywords: [
      "legal services", "attorney near me", "law firm",
      "legal advice", "lawyer consultation", "legal representation"
    ],
    recommendedTone: "professional-trustworthy",
    humorAppropriate: false,
    avgEngagementRate: 1.8
  },

  // ============================================
  // MARKETING & ADVERTISING
  // ============================================
  {
    industry: "Marketing & Advertising",
    recommendedPostsPerWeek: 5,
    optimalPostsMin: 4,
    optimalPostsMax: 7,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["08:00", "10:00", "12:00", "17:00"],
      "Facebook": ["09:00", "13:00", "16:00"],
      "Twitter": ["09:00", "12:00", "15:00", "18:00"],
      "Instagram": ["10:00", "14:00", "19:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Twitter": 2,
      "Instagram": 3,
      "Facebook": 4
    },
    suggestedThemes: {
      "thought_leadership": ["Industry trends", "Strategy insights", "Predictions"],
      "case_studies": ["Campaign results", "Client wins", "ROI stories"],
      "tips": ["Marketing tips", "Growth hacks", "Best practices"],
      "tools": ["Tool recommendations", "Tech stack", "Platform updates"],
      "culture": ["Team life", "Agency culture", "Creative process"]
    },
    topHashtags: [
      "#Marketing", "#DigitalMarketing", "#Advertising", "#Branding",
      "#SocialMedia", "#ContentMarketing", "#SEO", "#MarketingStrategy",
      "#GrowthHacking", "#MarketingTips", "#CreativeAgency", "#AdTech"
    ],
    seoKeywords: [
      "digital marketing", "marketing agency", "advertising services",
      "brand strategy", "social media marketing", "content marketing"
    ],
    recommendedTone: "professional-creative",
    humorAppropriate: true,
    avgEngagementRate: 3.1
  },

  // ============================================
  // EDUCATION & TRAINING
  // ============================================
  {
    industry: "Education & Training",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 6,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["07:00", "10:00", "16:00", "19:00"],
      "Facebook": ["08:00", "12:00", "17:00", "20:00"],
      "Twitter": ["08:00", "12:00", "16:00", "19:00"],
      "Instagram": ["10:00", "15:00", "19:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Facebook": 2,
      "Instagram": 3,
      "Twitter": 4
    },
    suggestedThemes: {
      "educational": ["Learning tips", "Study techniques", "Career advice"],
      "success_stories": ["Student achievements", "Alumni spotlight", "Testimonials"],
      "programs": ["Course highlights", "New programs", "Certifications"],
      "events": ["Workshops", "Webinars", "Open days"],
      "inspiration": ["Motivational content", "Industry insights", "Future skills"]
    },
    topHashtags: [
      "#Education", "#Learning", "#Training", "#Skills",
      "#OnlineLearning", "#CareerDevelopment", "#Upskilling", "#EdTech",
      "#ProfessionalDevelopment", "#LifelongLearning", "#Courses", "#Certification"
    ],
    seoKeywords: [
      "online courses", "professional training", "education programs",
      "skill development", "certification courses", "career training"
    ],
    recommendedTone: "professional-encouraging",
    humorAppropriate: true,
    avgEngagementRate: 2.4
  },

  // ============================================
  // CONSTRUCTION & TRADES
  // ============================================
  {
    industry: "Construction & Trades",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 5,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["06:00", "12:00", "17:00"],
      "Facebook": ["06:00", "12:00", "18:00", "20:00"],
      "Twitter": ["07:00", "12:00", "17:00"],
      "Instagram": ["07:00", "12:00", "18:00"]
    },
    platformPriority: {
      "Facebook": 1,
      "Instagram": 2,
      "LinkedIn": 3,
      "Twitter": 4
    },
    suggestedThemes: {
      "projects": ["Project showcases", "Before/after", "Progress updates"],
      "expertise": ["Tips & tricks", "Material guides", "Safety tips"],
      "team": ["Crew spotlights", "Training", "Certifications"],
      "testimonials": ["Client reviews", "Completed projects", "Referrals"],
      "community": ["Local projects", "Community involvement", "Hiring"]
    },
    topHashtags: [
      "#Construction", "#Building", "#Contractor", "#Renovation",
      "#HomeImprovement", "#Trades", "#Builder", "#ConstructionLife",
      "#Craftsmanship", "#QualityWork", "#Licensed", "#SafetyFirst"
    ],
    seoKeywords: [
      "construction services", "general contractor", "home renovation",
      "building contractor", "construction company", "remodeling services"
    ],
    recommendedTone: "professional-practical",
    humorAppropriate: true,
    avgEngagementRate: 2.6
  },

  // ============================================
  // AUTOMOTIVE
  // ============================================
  {
    industry: "Automotive",
    recommendedPostsPerWeek: 5,
    optimalPostsMin: 4,
    optimalPostsMax: 7,
    bestDays: ["Tuesday", "Wednesday", "Thursday", "Saturday"],
    bestTimes: {
      "LinkedIn": ["08:00", "12:00", "17:00"],
      "Facebook": ["10:00", "14:00", "19:00", "20:00"],
      "Twitter": ["09:00", "13:00", "18:00"],
      "Instagram": ["10:00", "14:00", "19:00", "21:00"]
    },
    platformPriority: {
      "Facebook": 1,
      "Instagram": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "inventory": ["New arrivals", "Featured vehicles", "Special offers"],
      "educational": ["Maintenance tips", "Buying guides", "Car care"],
      "showcases": ["Customer deliveries", "Vehicle features", "Test drives"],
      "promotions": ["Sales events", "Financing options", "Trade-ins"],
      "community": ["Local events", "Sponsorships", "Customer stories"]
    },
    topHashtags: [
      "#Cars", "#Automotive", "#CarDealer", "#NewCar",
      "#UsedCars", "#CarSales", "#AutoSales", "#Vehicles",
      "#CarLife", "#DreamCar", "#CarLovers", "#DriveHome"
    ],
    seoKeywords: [
      "cars for sale", "car dealership", "used cars",
      "new vehicles", "auto sales", "car financing"
    ],
    recommendedTone: "friendly-enthusiastic",
    humorAppropriate: true,
    avgEngagementRate: 3.0
  },

  // ============================================
  // BEAUTY & WELLNESS
  // ============================================
  {
    industry: "Beauty & Wellness",
    recommendedPostsPerWeek: 6,
    optimalPostsMin: 5,
    optimalPostsMax: 10,
    bestDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    bestTimes: {
      "LinkedIn": ["10:00", "14:00"],
      "Facebook": ["10:00", "13:00", "19:00", "21:00"],
      "Twitter": ["10:00", "14:00", "19:00"],
      "Instagram": ["09:00", "12:00", "17:00", "20:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Facebook": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "transformations": ["Before/after", "Client results", "Makeovers"],
      "tips": ["Beauty tips", "Skincare routines", "Tutorials"],
      "products": ["Product features", "New arrivals", "Recommendations"],
      "behind_scenes": ["Salon life", "Team", "Techniques"],
      "promotions": ["Specials", "Packages", "Seasonal offers"]
    },
    topHashtags: [
      "#Beauty", "#Wellness", "#Skincare", "#Salon",
      "#BeautyTips", "#SelfCare", "#Spa", "#Makeup",
      "#HairStylist", "#BeautyRoutine", "#Glow", "#TreatYourself"
    ],
    seoKeywords: [
      "beauty salon", "spa services", "skincare treatment",
      "wellness center", "beauty services", "self care"
    ],
    recommendedTone: "warm-inspiring",
    humorAppropriate: true,
    avgEngagementRate: 4.5
  },

  // ============================================
  // FITNESS & SPORTS
  // ============================================
  {
    industry: "Fitness & Sports",
    recommendedPostsPerWeek: 6,
    optimalPostsMin: 5,
    optimalPostsMax: 10,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"],
    bestTimes: {
      "LinkedIn": ["07:00", "12:00", "17:00"],
      "Facebook": ["06:00", "12:00", "17:00", "20:00"],
      "Twitter": ["06:00", "12:00", "17:00", "20:00"],
      "Instagram": ["06:00", "09:00", "17:00", "20:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Facebook": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "workouts": ["Exercise demos", "Workout plans", "Training tips"],
      "motivation": ["Inspiration", "Success stories", "Transformations"],
      "nutrition": ["Meal ideas", "Nutrition tips", "Supplements"],
      "community": ["Member spotlights", "Classes", "Events"],
      "challenges": ["Fitness challenges", "Goals", "Achievements"]
    },
    topHashtags: [
      "#Fitness", "#Gym", "#Workout", "#Health",
      "#FitLife", "#Training", "#Motivation", "#FitnessGoals",
      "#Exercise", "#Strength", "#GetFit", "#ActiveLife"
    ],
    seoKeywords: [
      "gym near me", "fitness training", "personal trainer",
      "workout classes", "fitness center", "health club"
    ],
    recommendedTone: "energetic-motivating",
    humorAppropriate: true,
    avgEngagementRate: 4.0
  },

  // ============================================
  // TRAVEL & TOURISM
  // ============================================
  {
    industry: "Travel & Tourism",
    recommendedPostsPerWeek: 5,
    optimalPostsMin: 4,
    optimalPostsMax: 7,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
    bestTimes: {
      "LinkedIn": ["09:00", "12:00", "17:00"],
      "Facebook": ["10:00", "13:00", "19:00", "21:00"],
      "Twitter": ["10:00", "14:00", "19:00"],
      "Instagram": ["10:00", "14:00", "19:00", "21:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Facebook": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "destinations": ["Featured locations", "Hidden gems", "Travel guides"],
      "deals": ["Special offers", "Packages", "Last minute deals"],
      "inspiration": ["Travel stories", "Photography", "Bucket list"],
      "tips": ["Travel tips", "Packing guides", "Safety advice"],
      "experiences": ["Customer journeys", "Reviews", "Testimonials"]
    },
    topHashtags: [
      "#Travel", "#Tourism", "#Vacation", "#Wanderlust",
      "#TravelGram", "#Adventure", "#Explore", "#Holiday",
      "#TravelTips", "#Destination", "#TravelLife", "#BucketList"
    ],
    seoKeywords: [
      "travel deals", "vacation packages", "tourism services",
      "holiday destinations", "travel agency", "trip planning"
    ],
    recommendedTone: "inspiring-adventurous",
    humorAppropriate: true,
    avgEngagementRate: 3.7
  },

  // ============================================
  // NON-PROFIT & CHARITY
  // ============================================
  {
    industry: "Non-profit & Charity",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 5,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["09:00", "12:00", "17:00"],
      "Facebook": ["10:00", "13:00", "19:00", "20:00"],
      "Twitter": ["09:00", "12:00", "18:00"],
      "Instagram": ["11:00", "15:00", "19:00"]
    },
    platformPriority: {
      "Facebook": 1,
      "Instagram": 2,
      "LinkedIn": 3,
      "Twitter": 4
    },
    suggestedThemes: {
      "impact": ["Success stories", "Beneficiary updates", "Milestones"],
      "awareness": ["Cause education", "Statistics", "Advocacy"],
      "fundraising": ["Campaigns", "Donation drives", "Events"],
      "volunteers": ["Volunteer spotlights", "Opportunities", "Stories"],
      "transparency": ["Reports", "Fund usage", "Governance"]
    },
    topHashtags: [
      "#NonProfit", "#Charity", "#GiveBack", "#Donate",
      "#MakeADifference", "#Volunteer", "#Community", "#SocialGood",
      "#Fundraising", "#ChangeLives", "#Support", "#CharityWork"
    ],
    seoKeywords: [
      "donate now", "charity organization", "volunteer opportunities",
      "non profit", "community support", "make a difference"
    ],
    recommendedTone: "compassionate-hopeful",
    humorAppropriate: false,
    avgEngagementRate: 2.9
  },

  // ============================================
  // PROFESSIONAL SERVICES (Consulting, Accounting)
  // ============================================
  {
    industry: "Professional Services",
    recommendedPostsPerWeek: 3,
    optimalPostsMin: 2,
    optimalPostsMax: 4,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["07:00", "10:00", "16:00"],
      "Facebook": ["09:00", "12:00", "17:00"],
      "Twitter": ["08:00", "12:00", "16:00"],
      "Instagram": ["12:00", "17:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Facebook": 2,
      "Twitter": 3,
      "Instagram": 4
    },
    suggestedThemes: {
      "expertise": ["Industry insights", "Tips", "Best practices"],
      "thought_leadership": ["Trends", "Analysis", "Predictions"],
      "trust_building": ["Team credentials", "Case studies", "Testimonials"],
      "updates": ["Regulatory changes", "Deadlines", "News"],
      "culture": ["Team highlights", "Company values", "Community"]
    },
    topHashtags: [
      "#Consulting", "#Business", "#Accounting", "#Advisory",
      "#ProfessionalServices", "#BusinessTips", "#Strategy", "#Growth",
      "#SmallBusiness", "#Entrepreneur", "#BusinessAdvice", "#Expert"
    ],
    seoKeywords: [
      "consulting services", "business advisory", "professional advice",
      "accounting services", "business consulting", "expert guidance"
    ],
    recommendedTone: "professional-authoritative",
    humorAppropriate: false,
    avgEngagementRate: 1.7
  },

  // ============================================
  // MANUFACTURING & INDUSTRIAL
  // ============================================
  {
    industry: "Manufacturing & Industrial",
    recommendedPostsPerWeek: 3,
    optimalPostsMin: 2,
    optimalPostsMax: 4,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["07:00", "10:00", "14:00"],
      "Facebook": ["08:00", "12:00", "17:00"],
      "Twitter": ["08:00", "12:00", "15:00"],
      "Instagram": ["10:00", "14:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Facebook": 2,
      "Twitter": 3,
      "Instagram": 4
    },
    suggestedThemes: {
      "capabilities": ["Production", "Equipment", "Processes"],
      "innovation": ["New technologies", "Automation", "R&D"],
      "quality": ["Certifications", "Standards", "Testing"],
      "team": ["Employee spotlights", "Safety", "Training"],
      "sustainability": ["Environmental initiatives", "Efficiency", "Green practices"]
    },
    topHashtags: [
      "#Manufacturing", "#Industrial", "#MadeInUSA", "#Production",
      "#Engineering", "#Automation", "#Industry", "#Quality",
      "#Innovation", "#Factory", "#B2B", "#SupplyChain"
    ],
    seoKeywords: [
      "manufacturing services", "industrial solutions", "production",
      "custom manufacturing", "OEM supplier", "industrial equipment"
    ],
    recommendedTone: "professional-technical",
    humorAppropriate: false,
    avgEngagementRate: 1.5
  },

  // ============================================
  // ENTERTAINMENT & MEDIA
  // ============================================
  {
    industry: "Entertainment & Media",
    recommendedPostsPerWeek: 7,
    optimalPostsMin: 5,
    optimalPostsMax: 14,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    bestTimes: {
      "LinkedIn": ["10:00", "12:00", "17:00"],
      "Facebook": ["12:00", "15:00", "19:00", "21:00"],
      "Twitter": ["10:00", "14:00", "18:00", "21:00"],
      "Instagram": ["11:00", "15:00", "19:00", "21:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Twitter": 2,
      "Facebook": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "content": ["New releases", "Behind the scenes", "Previews"],
      "engagement": ["Polls", "Trivia", "Fan content"],
      "news": ["Announcements", "Updates", "Events"],
      "talent": ["Artist features", "Interviews", "Spotlights"],
      "interactive": ["Contests", "Giveaways", "Live events"]
    },
    topHashtags: [
      "#Entertainment", "#Media", "#NewRelease", "#Content",
      "#Streaming", "#Music", "#Film", "#TV",
      "#BehindTheScenes", "#Exclusive", "#Trending", "#Viral"
    ],
    seoKeywords: [
      "entertainment news", "new releases", "streaming content",
      "media production", "entertainment company", "content creation"
    ],
    recommendedTone: "exciting-engaging",
    humorAppropriate: true,
    avgEngagementRate: 4.8
  }
]

async function seedBenchmarks() {
  console.log('🌱 Starting Industry Benchmarks seed...\n')
  
  let created = 0
  let updated = 0
  let errors = 0

  for (const benchmark of industryBenchmarks) {
    try {
      const existing = await prisma.industryBenchmark.findUnique({
        where: { industry: benchmark.industry }
      })

      if (existing) {
        await prisma.industryBenchmark.update({
          where: { industry: benchmark.industry },
          data: {
            recommendedPostsPerWeek: benchmark.recommendedPostsPerWeek,
            optimalPostsMin: benchmark.optimalPostsMin,
            optimalPostsMax: benchmark.optimalPostsMax,
            bestDays: benchmark.bestDays,
            bestTimes: benchmark.bestTimes,
            platformPriority: benchmark.platformPriority,
            suggestedThemes: benchmark.suggestedThemes,
            topHashtags: benchmark.topHashtags,
            seoKeywords: benchmark.seoKeywords,
            recommendedTone: benchmark.recommendedTone,
            humorAppropriate: benchmark.humorAppropriate,
            avgEngagementRate: benchmark.avgEngagementRate,
            lastUpdated: new Date()
          }
        })
        console.log(`✅ Updated: ${benchmark.industry}`)
        updated++
      } else {
        await prisma.industryBenchmark.create({
          data: {
            industry: benchmark.industry,
            recommendedPostsPerWeek: benchmark.recommendedPostsPerWeek,
            optimalPostsMin: benchmark.optimalPostsMin,
            optimalPostsMax: benchmark.optimalPostsMax,
            bestDays: benchmark.bestDays,
            bestTimes: benchmark.bestTimes,
            platformPriority: benchmark.platformPriority,
            suggestedThemes: benchmark.suggestedThemes,
            topHashtags: benchmark.topHashtags,
            seoKeywords: benchmark.seoKeywords,
            recommendedTone: benchmark.recommendedTone,
            humorAppropriate: benchmark.humorAppropriate,
            avgEngagementRate: benchmark.avgEngagementRate
          }
        })
        console.log(`✨ Created: ${benchmark.industry}`)
        created++
      }
    } catch (error) {
      console.error(`❌ Error with ${benchmark.industry}:`, error)
      errors++
    }
  }

  console.log('\n════════════════════════════════════════')
  console.log('📊 SEED COMPLETE')
  console.log('════════════════════════════════════════')
  console.log(`✨ Created: ${created}`)
  console.log(`✅ Updated: ${updated}`)
  console.log(`❌ Errors:  ${errors}`)
  console.log(`📈 Total:   ${industryBenchmarks.length} industries`)
  console.log('════════════════════════════════════════\n')
}

seedBenchmarks()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })