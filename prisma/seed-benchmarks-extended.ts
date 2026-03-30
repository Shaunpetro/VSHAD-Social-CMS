import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const additionalBenchmarks = [
  // ============================================
  // AGRICULTURE & FARMING
  // ============================================
  {
    industry: "Agriculture & Farming",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 5,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Friday"],
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
      "farm_life": ["Daily operations", "Seasonal updates", "Behind the scenes"],
      "products": ["Harvest showcases", "Product quality", "Farm to table"],
      "educational": ["Farming tips", "Sustainable practices", "Industry insights"],
      "community": ["Local events", "Farmer markets", "Partnerships"],
      "weather_seasons": ["Seasonal content", "Weather updates", "Planting/harvesting"]
    },
    topHashtags: [
      "#Farming", "#Agriculture", "#FarmLife", "#Harvest",
      "#Sustainable", "#FarmToTable", "#LocalProduce", "#Agri",
      "#Crops", "#LiveStock", "#FreshProduce", "#GrowLocal"
    ],
    seoKeywords: [
      "local farm", "fresh produce", "sustainable farming",
      "farm products", "agriculture services", "organic farming"
    ],
    recommendedTone: "authentic-hardworking",
    humorAppropriate: true,
    avgEngagementRate: 3.5
  },

  // ============================================
  // SECURITY SERVICES
  // ============================================
  {
    industry: "Security Services",
    recommendedPostsPerWeek: 3,
    optimalPostsMin: 2,
    optimalPostsMax: 4,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["08:00", "12:00", "16:00"],
      "Facebook": ["07:00", "12:00", "18:00"],
      "Twitter": ["08:00", "12:00", "17:00"],
      "Instagram": ["10:00", "15:00", "18:00"]
    },
    platformPriority: {
      "Facebook": 1,
      "LinkedIn": 2,
      "Instagram": 3,
      "Twitter": 4
    },
    suggestedThemes: {
      "safety_tips": ["Security advice", "Crime prevention", "Safety awareness"],
      "services": ["Service highlights", "Technology", "Response times"],
      "trust_building": ["Team profiles", "Certifications", "Track record"],
      "community": ["Local alerts", "Community involvement", "Partnerships"],
      "testimonials": ["Client feedback", "Success stories", "Case studies"]
    },
    topHashtags: [
      "#Security", "#SafetyFirst", "#Protection", "#SecurityServices",
      "#ArmedResponse", "#CCTV", "#Surveillance", "#PropertySecurity",
      "#SafeHome", "#SecurityGuards", "#CrimeAwareness", "#StaySafe"
    ],
    seoKeywords: [
      "security company", "armed response", "security services",
      "property protection", "security guards", "surveillance systems"
    ],
    recommendedTone: "professional-reassuring",
    humorAppropriate: false,
    avgEngagementRate: 2.2
  },

  // ============================================
  // CLEANING SERVICES
  // ============================================
  {
    industry: "Cleaning Services",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 5,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"],
    bestTimes: {
      "LinkedIn": ["08:00", "12:00"],
      "Facebook": ["08:00", "12:00", "18:00", "20:00"],
      "Twitter": ["09:00", "13:00", "17:00"],
      "Instagram": ["09:00", "14:00", "18:00"]
    },
    platformPriority: {
      "Facebook": 1,
      "Instagram": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "transformations": ["Before/after", "Deep cleaning results", "Satisfying cleans"],
      "tips": ["Cleaning hacks", "Product recommendations", "Maintenance tips"],
      "services": ["Service packages", "Specialized cleaning", "Commercial services"],
      "team": ["Staff highlights", "Training", "Uniforms"],
      "promotions": ["Seasonal specials", "Package deals", "Referral offers"]
    },
    topHashtags: [
      "#Cleaning", "#CleanHome", "#CleaningServices", "#DeepClean",
      "#SpotlessClean", "#ProfessionalCleaning", "#CleaningCompany", "#Sanitize",
      "#HomeClean", "#OfficeCleaning", "#CleanFreak", "#SparklingClean"
    ],
    seoKeywords: [
      "cleaning services", "house cleaning", "office cleaning",
      "deep cleaning", "professional cleaners", "cleaning company"
    ],
    recommendedTone: "friendly-reliable",
    humorAppropriate: true,
    avgEngagementRate: 3.8
  },

  // ============================================
  // EVENT PLANNING & MANAGEMENT
  // ============================================
  {
    industry: "Event Planning & Management",
    recommendedPostsPerWeek: 5,
    optimalPostsMin: 4,
    optimalPostsMax: 7,
    bestDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Sunday"],
    bestTimes: {
      "LinkedIn": ["09:00", "12:00", "17:00"],
      "Facebook": ["10:00", "14:00", "19:00", "21:00"],
      "Twitter": ["10:00", "14:00", "18:00"],
      "Instagram": ["10:00", "14:00", "19:00", "21:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Facebook": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "portfolio": ["Event showcases", "Venue setups", "Decor highlights"],
      "behind_scenes": ["Planning process", "Setup timelapse", "Team work"],
      "inspiration": ["Theme ideas", "Trends", "Color palettes"],
      "tips": ["Planning tips", "Budget advice", "Vendor recommendations"],
      "testimonials": ["Happy clients", "Event reviews", "Success stories"]
    },
    topHashtags: [
      "#EventPlanning", "#Events", "#EventManager", "#Celebrations",
      "#PartyPlanner", "#WeddingPlanner", "#CorporateEvents", "#EventDesign",
      "#EventDecor", "#EventProfs", "#SpecialEvents", "#EventInspiration"
    ],
    seoKeywords: [
      "event planner", "event management", "party planning",
      "wedding planner", "corporate events", "event coordination"
    ],
    recommendedTone: "creative-enthusiastic",
    humorAppropriate: true,
    avgEngagementRate: 4.2
  },

  // ============================================
  // PHOTOGRAPHY & VIDEOGRAPHY
  // ============================================
  {
    industry: "Photography & Videography",
    recommendedPostsPerWeek: 5,
    optimalPostsMin: 4,
    optimalPostsMax: 7,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"],
    bestTimes: {
      "LinkedIn": ["10:00", "14:00"],
      "Facebook": ["10:00", "14:00", "19:00", "21:00"],
      "Twitter": ["10:00", "14:00", "19:00"],
      "Instagram": ["09:00", "12:00", "18:00", "21:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Facebook": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "portfolio": ["Best shots", "Recent work", "Client sessions"],
      "behind_scenes": ["Gear setup", "Editing process", "On location"],
      "tips": ["Photography tips", "Lighting advice", "Posing guides"],
      "client_features": ["Client stories", "Session highlights", "Testimonials"],
      "personal": ["Creative projects", "Inspiration", "Growth journey"]
    },
    topHashtags: [
      "#Photography", "#Photographer", "#PhotoOfTheDay", "#Portrait",
      "#WeddingPhotography", "#Videography", "#ContentCreator", "#VisualArt",
      "#PhotoShoot", "#CaptureLife", "#ProfessionalPhotographer", "#FilmMaker"
    ],
    seoKeywords: [
      "photographer", "photography services", "wedding photographer",
      "videographer", "photo shoot", "professional photography"
    ],
    recommendedTone: "creative-artistic",
    humorAppropriate: true,
    avgEngagementRate: 4.5
  },

  // ============================================
  // TRANSPORTATION & LOGISTICS
  // ============================================
  {
    industry: "Transportation & Logistics",
    recommendedPostsPerWeek: 3,
    optimalPostsMin: 2,
    optimalPostsMax: 4,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["07:00", "12:00", "16:00"],
      "Facebook": ["07:00", "12:00", "17:00"],
      "Twitter": ["08:00", "12:00", "16:00"],
      "Instagram": ["09:00", "14:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Facebook": 2,
      "Twitter": 3,
      "Instagram": 4
    },
    suggestedThemes: {
      "fleet": ["Vehicle showcases", "New additions", "Fleet maintenance"],
      "services": ["Service areas", "Delivery capabilities", "Tracking features"],
      "reliability": ["On-time delivery", "Safety records", "Testimonials"],
      "team": ["Driver spotlights", "Training", "Safety culture"],
      "industry": ["Logistics tips", "Industry news", "Efficiency tips"]
    },
    topHashtags: [
      "#Logistics", "#Transport", "#Delivery", "#Fleet",
      "#SupplyChain", "#Trucking", "#Courier", "#Shipping",
      "#FreightServices", "#OnTimeDelivery", "#TransportServices", "#Moving"
    ],
    seoKeywords: [
      "transport services", "logistics company", "delivery services",
      "courier services", "freight transport", "moving services"
    ],
    recommendedTone: "professional-reliable",
    humorAppropriate: false,
    avgEngagementRate: 1.9
  },

  // ============================================
  // PET SERVICES
  // ============================================
  {
    industry: "Pet Services",
    recommendedPostsPerWeek: 5,
    optimalPostsMin: 4,
    optimalPostsMax: 7,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday", "Sunday"],
    bestTimes: {
      "LinkedIn": ["12:00"],
      "Facebook": ["09:00", "13:00", "19:00", "21:00"],
      "Twitter": ["10:00", "14:00", "19:00"],
      "Instagram": ["09:00", "13:00", "18:00", "21:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Facebook": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "cute_content": ["Pet photos", "Funny moments", "Transformations"],
      "services": ["Grooming results", "Boarding facilities", "Training sessions"],
      "tips": ["Pet care advice", "Health tips", "Training tips"],
      "community": ["Pet events", "Adoption drives", "Customer pets"],
      "promotions": ["Specials", "Packages", "Seasonal offers"]
    },
    topHashtags: [
      "#Pets", "#PetCare", "#DogGrooming", "#PetLovers",
      "#DogsOfInstagram", "#CatsOfInstagram", "#PetServices", "#Grooming",
      "#PetBoarding", "#DogTraining", "#FurBaby", "#PetLife"
    ],
    seoKeywords: [
      "pet grooming", "dog boarding", "pet services",
      "pet care", "dog training", "cat grooming"
    ],
    recommendedTone: "warm-playful",
    humorAppropriate: true,
    avgEngagementRate: 5.2
  },

  // ============================================
  // RELIGIOUS & FAITH ORGANIZATIONS
  // ============================================
  {
    industry: "Religious & Faith Organizations",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 6,
    bestDays: ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"],
    bestTimes: {
      "LinkedIn": ["08:00", "17:00"],
      "Facebook": ["07:00", "12:00", "18:00", "20:00"],
      "Twitter": ["08:00", "12:00", "18:00"],
      "Instagram": ["08:00", "12:00", "18:00"]
    },
    platformPriority: {
      "Facebook": 1,
      "Instagram": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "inspiration": ["Daily verses", "Encouragement", "Testimonies"],
      "events": ["Service times", "Special events", "Community gatherings"],
      "community": ["Outreach programs", "Volunteer opportunities", "Member stories"],
      "teaching": ["Sermon clips", "Bible study", "Devotionals"],
      "announcements": ["Updates", "New programs", "Important dates"]
    },
    topHashtags: [
      "#Faith", "#Church", "#Worship", "#Prayer",
      "#Community", "#Blessed", "#Inspiration", "#SundayService",
      "#ChurchFamily", "#Praise", "#Scripture", "#FaithJourney"
    ],
    seoKeywords: [
      "church near me", "worship service", "faith community",
      "religious organization", "sunday service", "prayer group"
    ],
    recommendedTone: "warm-uplifting",
    humorAppropriate: false,
    avgEngagementRate: 3.4
  },

  // ============================================
  // FUNERAL & MEMORIAL SERVICES
  // ============================================
  {
    industry: "Funeral & Memorial Services",
    recommendedPostsPerWeek: 2,
    optimalPostsMin: 1,
    optimalPostsMax: 3,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["09:00", "14:00"],
      "Facebook": ["09:00", "14:00", "17:00"],
      "Twitter": ["10:00", "14:00"],
      "Instagram": ["10:00", "15:00"]
    },
    platformPriority: {
      "Facebook": 1,
      "LinkedIn": 2,
      "Instagram": 3,
      "Twitter": 4
    },
    suggestedThemes: {
      "compassion": ["Grief support", "Condolence messages", "Memorial ideas"],
      "services": ["Service options", "Pre-planning information", "Facilities"],
      "community": ["Community involvement", "Charity work", "Support groups"],
      "education": ["Planning guides", "Process explanations", "FAQ"],
      "tributes": ["Memorial tributes", "Celebration of life", "Remembrance"]
    },
    topHashtags: [
      "#FuneralServices", "#Memorial", "#CelebrationOfLife", "#Remembrance",
      "#CompassionateCare", "#FuneralHome", "#GriefSupport", "#InLovingMemory",
      "#FinalFarewell", "#FuneralPlanning", "#MemorialService", "#HonoringLife"
    ],
    seoKeywords: [
      "funeral services", "funeral home", "memorial services",
      "cremation services", "funeral planning", "bereavement services"
    ],
    recommendedTone: "compassionate-dignified",
    humorAppropriate: false,
    avgEngagementRate: 1.2
  },

  // ============================================
  // CHILDCARE & DAYCARE
  // ============================================
  {
    industry: "Childcare & Daycare",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 5,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    bestTimes: {
      "LinkedIn": ["12:00"],
      "Facebook": ["07:00", "12:00", "17:00", "20:00"],
      "Twitter": ["08:00", "12:00", "17:00"],
      "Instagram": ["08:00", "12:00", "17:00", "20:00"]
    },
    platformPriority: {
      "Facebook": 1,
      "Instagram": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "activities": ["Daily activities", "Learning moments", "Creative projects"],
      "milestones": ["Child achievements", "Developmental updates", "Celebrations"],
      "trust_building": ["Staff qualifications", "Safety measures", "Facilities"],
      "parenting_tips": ["Development tips", "Activity ideas", "Nutrition advice"],
      "community": ["Events", "Parent involvement", "School partnerships"]
    },
    topHashtags: [
      "#Childcare", "#Daycare", "#EarlyLearning", "#Preschool",
      "#ChildDevelopment", "#KidsActivities", "#ParentingTips", "#EarlyEducation",
      "#PlayBasedLearning", "#ChildcareCenter", "#LittleLearners", "#NurturingCare"
    ],
    seoKeywords: [
      "daycare near me", "childcare services", "preschool",
      "early learning center", "child development", "nursery school"
    ],
    recommendedTone: "warm-nurturing",
    humorAppropriate: true,
    avgEngagementRate: 3.6
  },

  // ============================================
  // HOME SERVICES (Plumbing, Electrical, HVAC)
  // ============================================
  {
    industry: "Home Services",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 5,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"],
    bestTimes: {
      "LinkedIn": ["07:00", "12:00"],
      "Facebook": ["07:00", "12:00", "18:00", "20:00"],
      "Twitter": ["08:00", "12:00", "17:00"],
      "Instagram": ["08:00", "12:00", "18:00"]
    },
    platformPriority: {
      "Facebook": 1,
      "Instagram": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "work_showcases": ["Before/after", "Completed jobs", "Problem solving"],
      "tips": ["Maintenance tips", "DIY advice", "Warning signs"],
      "services": ["Service offerings", "Emergency services", "New capabilities"],
      "trust_building": ["Certifications", "Reviews", "Team expertise"],
      "seasonal": ["Seasonal prep", "Weather-related tips", "Maintenance reminders"]
    },
    topHashtags: [
      "#Plumber", "#Electrician", "#HVAC", "#HomeRepair",
      "#Handyman", "#HomeServices", "#LocalBusiness", "#EmergencyRepair",
      "#HomeMaintenance", "#FixIt", "#TrustedTradie", "#QualityWork"
    ],
    seoKeywords: [
      "plumber near me", "electrician services", "HVAC repair",
      "home repair services", "emergency plumber", "electrical contractor"
    ],
    recommendedTone: "helpful-trustworthy",
    humorAppropriate: true,
    avgEngagementRate: 2.8
  },

  // ============================================
  // MINING & RESOURCES
  // ============================================
  {
    industry: "Mining & Resources",
    recommendedPostsPerWeek: 3,
    optimalPostsMin: 2,
    optimalPostsMax: 4,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["07:00", "10:00", "15:00"],
      "Facebook": ["08:00", "12:00", "17:00"],
      "Twitter": ["08:00", "12:00", "16:00"],
      "Instagram": ["10:00", "15:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Facebook": 2,
      "Twitter": 3,
      "Instagram": 4
    },
    suggestedThemes: {
      "operations": ["Site updates", "Production milestones", "Equipment"],
      "safety": ["Safety culture", "Training", "Zero harm initiatives"],
      "community": ["Local employment", "CSR initiatives", "Community projects"],
      "sustainability": ["Environmental initiatives", "Rehabilitation", "Green mining"],
      "careers": ["Job opportunities", "Career growth", "Employee stories"]
    },
    topHashtags: [
      "#Mining", "#MiningIndustry", "#Resources", "#SafetyFirst",
      "#Minerals", "#MiningLife", "#Sustainability", "#MiningJobs",
      "#NaturalResources", "#MiningEquipment", "#MiningCommunity", "#Extraction"
    ],
    seoKeywords: [
      "mining company", "mining services", "mineral resources",
      "mining jobs", "mining equipment", "resource extraction"
    ],
    recommendedTone: "professional-responsible",
    humorAppropriate: false,
    avgEngagementRate: 1.6
  },

  // ============================================
  // INSURANCE SERVICES
  // ============================================
  {
    industry: "Insurance Services",
    recommendedPostsPerWeek: 3,
    optimalPostsMin: 2,
    optimalPostsMax: 4,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["08:00", "12:00", "16:00"],
      "Facebook": ["09:00", "12:00", "17:00"],
      "Twitter": ["09:00", "12:00", "16:00"],
      "Instagram": ["12:00", "17:00"]
    },
    platformPriority: {
      "LinkedIn": 1,
      "Facebook": 2,
      "Twitter": 3,
      "Instagram": 4
    },
    suggestedThemes: {
      "educational": ["Insurance tips", "Coverage explanations", "Claim process"],
      "trust_building": ["Company history", "Team profiles", "Customer stories"],
      "awareness": ["Risk awareness", "Safety tips", "Protection advice"],
      "products": ["Coverage options", "New products", "Special offers"],
      "community": ["Local involvement", "Charity work", "Partnerships"]
    },
    topHashtags: [
      "#Insurance", "#LifeInsurance", "#CarInsurance", "#HomeInsurance",
      "#Protection", "#Coverage", "#InsuranceAgent", "#FinancialPlanning",
      "#RiskManagement", "#InsuranceTips", "#SecureYourFuture", "#PeaceOfMind"
    ],
    seoKeywords: [
      "insurance quotes", "life insurance", "car insurance",
      "home insurance", "insurance agent", "coverage options"
    ],
    recommendedTone: "professional-caring",
    humorAppropriate: false,
    avgEngagementRate: 1.8
  },

  // ============================================
  // HOSPITALITY & LODGING
  // ============================================
  {
    industry: "Hospitality & Lodging",
    recommendedPostsPerWeek: 5,
    optimalPostsMin: 4,
    optimalPostsMax: 7,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sunday"],
    bestTimes: {
      "LinkedIn": ["09:00", "12:00"],
      "Facebook": ["10:00", "14:00", "19:00", "21:00"],
      "Twitter": ["10:00", "14:00", "18:00"],
      "Instagram": ["10:00", "14:00", "19:00", "21:00"]
    },
    platformPriority: {
      "Instagram": 1,
      "Facebook": 2,
      "Twitter": 3,
      "LinkedIn": 4
    },
    suggestedThemes: {
      "property": ["Room showcases", "Amenities", "Views and surroundings"],
      "experiences": ["Guest experiences", "Local attractions", "Activities"],
      "promotions": ["Special offers", "Packages", "Seasonal deals"],
      "behind_scenes": ["Staff highlights", "Kitchen", "Preparation"],
      "reviews": ["Guest testimonials", "Awards", "Recognition"]
    },
    topHashtags: [
      "#Hotel", "#Hospitality", "#Travel", "#Accommodation",
      "#Vacation", "#Getaway", "#Staycation", "#LuxuryHotel",
      "#GuestExperience", "#HotelLife", "#BookNow", "#TravelSouthAfrica"
    ],
    seoKeywords: [
      "hotel near me", "accommodation", "bed and breakfast",
      "guest house", "lodge", "vacation rental"
    ],
    recommendedTone: "welcoming-luxurious",
    humorAppropriate: true,
    avgEngagementRate: 3.9
  },

  // ============================================
  // GENERAL BUSINESS (Fallback for unmatched)
  // ============================================
  {
    industry: "General Business",
    recommendedPostsPerWeek: 4,
    optimalPostsMin: 3,
    optimalPostsMax: 5,
    bestDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    bestTimes: {
      "LinkedIn": ["08:00", "12:00", "17:00"],
      "Facebook": ["09:00", "12:00", "18:00", "20:00"],
      "Twitter": ["09:00", "12:00", "17:00"],
      "Instagram": ["10:00", "14:00", "19:00"]
    },
    platformPriority: {
      "Facebook": 1,
      "LinkedIn": 2,
      "Instagram": 3,
      "Twitter": 4
    },
    suggestedThemes: {
      "value_proposition": ["What you offer", "Why choose you", "Success stories"],
      "behind_scenes": ["Team", "Process", "Daily operations"],
      "customer_focus": ["Testimonials", "Case studies", "Customer spotlight"],
      "expertise": ["Tips", "Industry insights", "How-to content"],
      "community": ["Local involvement", "Partnerships", "Events"]
    },
    topHashtags: [
      "#SmallBusiness", "#LocalBusiness", "#Entrepreneur", "#Business",
      "#SupportLocal", "#BusinessOwner", "#SmallBiz", "#ShopLocal",
      "#BusinessTips", "#GrowYourBusiness", "#BusinessGrowth", "#Success"
    ],
    seoKeywords: [
      "local business", "services near me", "small business",
      "professional services", "quality service", "trusted provider"
    ],
    recommendedTone: "professional-friendly",
    humorAppropriate: true,
    avgEngagementRate: 2.5
  }
]

async function seedAdditionalBenchmarks() {
  console.log('🌱 Adding extended industry benchmarks...\n')
  
  let created = 0
  let updated = 0
  let errors = 0

  for (const benchmark of additionalBenchmarks) {
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

  // Count total industries in database
  const total = await prisma.industryBenchmark.count()

  console.log('\n════════════════════════════════════════')
  console.log('📊 EXTENDED SEED COMPLETE')
  console.log('════════════════════════════════════════')
  console.log(`✨ Created: ${created}`)
  console.log(`✅ Updated: ${updated}`)
  console.log(`❌ Errors:  ${errors}`)
  console.log(`📈 Total industries in database: ${total}`)
  console.log('════════════════════════════════════════\n')
}

seedAdditionalBenchmarks()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })