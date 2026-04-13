// apps/web/src/lib/intelligence/prompts/analysis-prompt.ts

/**
 * ANALYSIS PROMPT TEMPLATES
 * Groq/LLM prompts for company intelligence extraction
 */

/**
 * Main company analysis prompt
 */
export function buildAnalysisPrompt(companyName: string, combinedText: string): string {
    return `You are a business intelligence analyst specializing in South African companies.
  
  Analyze the following company information and extract structured data.
  
  COMPANY NAME: ${companyName}
  
  INFORMATION GATHERED FROM COMPANY SOURCES:
  ${combinedText}
  
  INSTRUCTIONS:
  1. Identify ALL industries/sectors this company operates in (they may have multiple)
  2. Extract ALL services they offer with specific details
  3. Identify unique selling points / competitive advantages with evidence
  4. Determine their target audience and typical clients
  5. Assess their brand voice and communication style from the text
  6. Detect any South African specific context (CIDB, B-BBEE, etc.)
  7. Suggest content themes based on their expertise
  
  SOUTH AFRICAN CONTEXT TO DETECT:
  - CIDB grades for construction (CE=Civil Engineering, GB=General Building, ME=Mechanical Engineering, EP=Electrical Engineering Infrastructure, EB=Electrical Engineering Buildings, SQ/SF=Specialist Works) with levels 1-9
  - B-BBEE levels 1-8
  - Provincial operations (Gauteng, Western Cape, KwaZulu-Natal, etc.)
  - Industry body memberships (SAFCEC, MBA, SAISC, etc.)
  
  INDUSTRY CODE FORMAT:
  Use category_subcategory format, examples:
  - CONST_CE (Construction - Civil Engineering)
  - CONST_GB (Construction - General Building)
  - CONST_ME (Construction - Mechanical Engineering)
  - TECH_SOFTWARE (Technology - Software)
  - HEALTH_MEDICAL (Healthcare - Medical)
  - FINANCE_BANKING (Finance - Banking)
  - RETAIL_ECOMMERCE (Retail - E-commerce)
  - FOOD_RESTAURANT (Food - Restaurant)
  - PROF_LEGAL (Professional Services - Legal)
  - PROF_ACCOUNTING (Professional Services - Accounting)
  
  Respond with ONLY valid JSON in this exact structure (no markdown, no explanation):
  {
    "industries": [
      {
        "code": "CONST_CE",
        "name": "Civil Engineering",
        "category": "Construction",
        "confidence": 0.95,
        "cidbCode": "CE",
        "cidbGrade": 7
      }
    ],
    
    "services": [
      {
        "name": "Structural Steel Erection",
        "description": "Design and construction of structural steel frameworks for industrial facilities",
        "keywords": ["steel", "structural", "fabrication", "erection", "industrial"],
        "isCore": true,
        "relatedIndustry": "CONST_ME"
      }
    ],
    
    "uniqueSellingPoints": [
      {
        "point": "CIDB Level 7 in 5 disciplines",
        "category": "certification",
        "evidence": "Mentioned on website services page"
      }
    ],
    
    "targetAudience": {
      "businessType": "B2B",
      "primarySectors": ["Mining", "Industrial"],
      "secondarySectors": ["Commercial Property"],
      "decisionMakers": ["Procurement Managers", "Project Engineers", "Facilities Managers"],
      "companySize": "Enterprise",
      "geographicFocus": ["Gauteng", "Mpumalanga", "Limpopo"],
      "description": "Mining and industrial companies seeking reliable multi-discipline contractors for complex infrastructure projects"
    },
    
    "brandVoice": {
      "formality": "professional",
      "personality": ["confident", "reliable", "expert", "experienced"],
      "technicalLevel": "high",
      "warmth": "moderate",
      "traits": {
        "weAlwaysSay": ["quality", "safety", "excellence", "certified", "experienced"],
        "weNeverSay": ["cheap", "budget", "try", "maybe"],
        "industryTermsUsed": ["CIDB", "SHEQ", "ISO", "OHSAS"]
      }
    },
    
    "saContext": {
      "bbeeLevel": 2,
      "cidbGrades": {
        "CE": 7,
        "GB": 7,
        "ME": 7,
        "EP": 6,
        "SQ": 6
      },
      "provinces": ["Gauteng", "Mpumalanga", "Limpopo"],
      "localEmphasis": true,
      "industryBodies": ["SAFCEC", "MBA"]
    },
    
    "suggestedContentThemes": [
      {
        "theme": "Technical Expertise & Project Showcases",
        "purpose": "Establish authority with procurement decision-makers",
        "topicExamples": [
          "Case study: How we delivered [specific project type]",
          "The advantages of multi-discipline contractors",
          "Understanding CIDB grading for your project"
        ],
        "frequency": "weekly"
      },
      {
        "theme": "Industry Insights & Thought Leadership",
        "purpose": "Position as industry experts",
        "topicExamples": [
          "Trends in [industry] construction",
          "Regulatory updates affecting [sector]",
          "Innovation in [service area]"
        ],
        "frequency": "biweekly"
      },
      {
        "theme": "Safety & Compliance",
        "purpose": "Build trust through demonstrated commitment",
        "topicExamples": [
          "Our safety record and what it means",
          "Compliance requirements explained",
          "Behind the scenes of our safety culture"
        ],
        "frequency": "biweekly"
      }
    ],
    
    "confidenceScore": 0.85,
    "dataQuality": "high",
    "missingInformation": ["Specific project portfolio details", "Team size", "Years in operation"]
  }
  
  IMPORTANT RULES:
  1. Only include industries/services that are clearly indicated in the text
  2. If CIDB grades are mentioned, extract them exactly as stated
  3. Confidence scores should reflect how clearly the information was stated (0.5-1.0)
  4. If information is not available, use null for optional fields or omit from arrays
  5. Be specific with services - don't just say "construction services", list actual services
  6. For B2B companies, identify the actual decision makers, not just "businesses"
  7. Content themes should be specific to what THIS company does, not generic
  8. Return ONLY the JSON object, no other text`;
  }
  
  /**
   * Prompt for re-analysis comparison
   */
  export function buildReanalysisPrompt(
    companyName: string, 
    newText: string, 
    previousAnalysis: string
  ): string {
    return `You are a business intelligence analyst. A company has updated their information and needs re-analysis.
  
  COMPANY NAME: ${companyName}
  
  NEW INFORMATION:
  ${newText}
  
  PREVIOUS ANALYSIS:
  ${previousAnalysis}
  
  Compare the new information with the previous analysis and identify:
  1. New industries/services detected
  2. Updated information (grades changed, new certifications, etc.)
  3. Removed information (services no longer offered)
  4. Confidence changes
  
  Respond with ONLY valid JSON:
  {
    "hasChanges": true,
    "changes": {
      "industries": {
        "added": [],
        "removed": [],
        "updated": []
      },
      "services": {
        "added": [],
        "removed": [],
        "updated": []
      },
      "usps": {
        "added": [],
        "removed": [],
        "updated": []
      },
      "saContext": {
        "changes": []
      }
    },
    "updatedAnalysis": {
      // Full updated analysis in same format as original
    },
    "changesSummary": "Brief human-readable summary of what changed"
  }`;
  }
  
  /**
   * Prompt for generating content themes from services
   */
  export function buildContentThemesPrompt(
    companyName: string,
    industries: string,
    services: string,
    audience: string,
    businessGoal: string
  ): string {
    return `Generate content themes for ${companyName}.
  
  INDUSTRIES: ${industries}
  SERVICES: ${services}
  TARGET AUDIENCE: ${audience}
  PRIMARY BUSINESS GOAL: ${businessGoal}
  
  Create 5-7 content themes that will help achieve the business goal while showcasing expertise.
  
  Each theme should have:
  - A clear purpose tied to the goal
  - 5 specific topic examples (not generic)
  - Recommended frequency
  - Which services it showcases
  
  Respond with ONLY valid JSON array:
  [
    {
      "theme": "Theme Name",
      "purpose": "How this theme helps achieve the goal",
      "topicExamples": ["Specific topic 1", "Specific topic 2", "Specific topic 3", "Specific topic 4", "Specific topic 5"],
      "frequency": "weekly",
      "showcasesServices": ["Service 1", "Service 2"],
      "targetFunnelStage": "awareness"
    }
  ]`;
  }
  
  /**
   * Prompt for extracting services from text
   */
  export function buildServiceExtractionPrompt(text: string): string {
    return `Extract all services/offerings mentioned in this text.
  
  TEXT:
  ${text}
  
  For each service found, provide:
  - Name (concise, professional)
  - Description (one sentence)
  - Keywords (for matching)
  - Whether it seems like a core service or secondary
  
  Respond with ONLY valid JSON array:
  [
    {
      "name": "Service Name",
      "description": "Brief description of the service",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "isCore": true
    }
  ]`;
  }