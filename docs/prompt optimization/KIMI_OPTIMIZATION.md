# Kimi API Optimization Analysis & Implementation Plan

**Date:** November 21, 2025  
**Purpose:** Document all optimization suggestions, analysis, and original code for potential rollback

---

## 🎯 Executive Summary

**Goal:** Reduce API costs by 30-40% while maintaining or improving quality and consistency.

**Key Optimizations:**
1. ✅ Perceptual-hash cache (50-70% savings on repeat uploads)
2. ✅ Add `seed` parameter for determinism
3. ✅ Compress prompts by 25-30% (remove redundancy)
4. ✅ System message caching for rubrics (10-15% savings)
5. ✅ Add `top_p = 0.01` for reproducibility
6. ⚠️ Image resize (40% savings, but OCR accuracy risk)
7. ❌ max_tokens=700 (TOO RISKY - will truncate complex resumes)

**Expected Cost Reduction:** 30-40% with zero quality loss  
**Expected Consistency Improvement:** Near-perfect determinism with temperature=0 + seed + top_p

---

## 📊 Current State Analysis

### Current Costs (per resume):
- **Vision API:** ~$0.05 (5 pages × 1024 tokens × $0.01)
- **Free analysis:** ~$0.0008 (800 tokens)
- **Full analysis:** ~$0.015 (15,000 tokens)
- **Total per user:** ~$0.066

### Current Token Usage:
- **Vision prompt:** ~1850 tokens (text portion)
- **Vision response:** ~700 tokens (JSON)
- **Image tokens:** ~5120 tokens (5 pages × 1024)
- **Analysis prompts:** 800-4000 tokens each

---

## 🔍 Kimi's Suggestions (from Kimi AI)

### 1. Perceptual-Hash Cache
```typescript
// Kimi's approach:
const pHash = (buf: Buffer) => createHash.createHash('sha256').update(buf).digest('hex').slice(0, 16);
const cacheKey = (hash: string) => `vision:${hash}`;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Benefits:
// - Same image = instant answer, 0 tokens
// - 50-70% cost reduction if users iterate
// - Zero risk
```

**Analysis:** ✅ EXCELLENT - Implement immediately

### 2. Pre-Resize Images (Sharp.js)
```typescript
// Kimi's approach:
const resizedBuffers = await Promise.all(imageUrls.map(async (u) => {
  const buf = Buffer.from(await (await fetch(u)).arrayBuffer());
  return sharp(buf).resize({ width: 1000, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
}));
```

**Analysis:** ⚠️ RISKY - We already resize client-side. Server-side resize adds complexity and may hurt OCR accuracy on small text.

### 3. Compact Prompt
```typescript
// Kimi's compact version (~1180 tokens):
const prompt = `Extract resume into EXACT JSON:
{"personalInfo":{"name":"","email":"","phone":"","location":"","linkedin":"","github":""},"summary":"","experience":[{"id":"1","company":"","position":"","location":"","startDate":"","endDate":"","description":[]}],"education":[],"skills":[],"customSections":[]}
Rules:
- Name=biggest top text (NOT "Resume"/title).
- Email=@, phone=10+ digits, location=City ST.
- Exp: all bullets verbatim; add id as string index.
- Skills: every tech/word listed.
- Missing="" or [].
${imageUrls.length}-page resume. Output ONLY JSON.`;
```

**Analysis:** ⚠️ TOO AGGRESSIVE - Loses critical accuracy instructions. Hybrid approach better.

### 4. Add `seed` Parameter
```typescript
seed: parseInt(phash, 16) % 10_000, // same pic → same seed
```

**Analysis:** ✅ EXCELLENT - Combined with temperature=0 for perfect determinism

### 5. Reduce max_tokens to 700
```typescript
max_tokens: 700, // down from 4096
```

**Analysis:** ❌ TOO RISKY - Will truncate complex multi-page resumes with projects/certifications

---

## 🆕 Additional Optimization Suggestions

### 6. System Message Caching for Rubrics
**Concept:** Move scoring rubrics and instructions to system message, cache per session
**Benefit:** 10-15% token savings on analysis calls
**Risk:** Low - system messages are designed for this

### 7. Add `top_p = 0.01`
**Concept:** Further constrain randomness beyond temperature=0
**Benefit:** Better reproducibility, especially with JSON schema
**Risk:** None - we want determinism

---

## 🚨 CRITICAL CACHE INVALIDATION CONCERN

### The Problem You Identified:

**Scenario:**
1. User uploads resume → Gets analysis: "Add metrics to bullet 2"
2. User edits resume, adds metrics to bullet 2
3. User re-uploads → Cache hit (same perceptual hash?)
4. User sees SAME analysis: "Add metrics to bullet 2"
5. **User thinks:** "WTF, I already fixed this! This app is broken!"

### The Answer: **YES, THIS IS A REAL PROBLEM!**

**Cache invalidation strategies:**

#### Option A: Hash the EXTRACTED TEXT, not the image
```typescript
// After extraction, hash the resumeContent string
const contentHash = createHash('sha256').update(resumeContent).digest('hex');
const cacheKey = `analysis:${contentHash}`;
```
**Pro:** Different content = different cache  
**Con:** Still costs vision API tokens (but saves analysis tokens)

#### Option B: Visual diff detection
```typescript
// Use perceptual hash but with sensitivity threshold
// If image is 95%+ similar but not identical → invalidate cache
```
**Pro:** Catches small edits  
**Con:** Complex to implement, may miss subtle changes

#### Option C: Cache ONLY vision extraction, NOT analysis
```typescript
// Cache: image → ResumeData extraction (saves $0.05)
// Always run: ResumeData → analysis (costs $0.015)
```
**Pro:** Analysis always fresh, extraction cached  
**Con:** Smaller savings (but safer)

#### Option D: Time-based + content-based invalidation
```typescript
// Cache vision for 24h
// Cache analysis for 1h OR until content changes
// Track: lastAnalysisHash vs currentContentHash
```
**Pro:** Balance between cost and freshness  
**Con:** More complex logic

### **RECOMMENDED APPROACH: Option C + Option D Hybrid**

```typescript
// Two-tier caching:
// 1. Vision cache: image hash → ResumeData (24h TTL)
//    - Saves expensive vision API calls
//    - Safe because extraction is deterministic
//
// 2. Analysis cache: content hash → analysis results (1h TTL)
//    - Short TTL ensures freshness
//    - Content hash catches edits
//    - User can force refresh
```

**Why this works:**
- Vision extraction is expensive ($0.05) and deterministic → cache aggressively
- Analysis is cheap ($0.015) and user expects freshness → cache conservatively
- Content hash catches ANY text change, even 1 character
- 1h TTL prevents stale analysis even if hash collision

---

## 📝 Original Code (for rollback)

### Original: kimi-vision.ts (Current Implementation)

```typescript
// ORIGINAL PROMPT (1850 tokens)
const prompt = `You are an expert resume data extraction AI with perfect OCR capabilities. Your task is to analyze ${imageUrls.length > 1 ? `these ${imageUrls.length} resume pages` : 'this resume image'} and extract EVERY SINGLE PIECE OF INFORMATION with 100% accuracy into structured JSON format.

${imageUrls.length > 1 ? `IMPORTANT: This is a ${imageUrls.length}-page resume. Extract and combine information from ALL pages into a single JSON object. Do not duplicate information - merge content intelligently.` : ''}

CRITICAL EXTRACTION RULES:

1. NAME EXTRACTION (HIGHEST PRIORITY):
   - The name is typically the LARGEST text at the top of the resume
   - Extract the FULL name exactly as shown (First Middle Last)
   - Do NOT extract job titles, company names, or section headers as the name
   - Common locations: Top center, top left, or in a header section
   - If multiple large texts appear, the name is usually the FIRST one
   - Example: "John Michael Smith" NOT "Software Engineer" or "Resume"

2. CONTACT INFORMATION:
   - Email: Look for @ symbol
   - Phone: Look for numbers with dashes, dots, or parentheses
   - Location: City, State or City, Country format
   - LinkedIn: linkedin.com/in/username
   - GitHub: github.com/username
   - Website/Portfolio: Any URL that's not LinkedIn or GitHub

3. READ CAREFULLY:
   - Use OCR to read ALL text accurately
   - Preserve exact spelling, capitalization, and punctuation
   - Do not make assumptions or corrections
   - If text is unclear, extract your best interpretation

SECTIONS TO EXTRACT (extract ALL you see):
- Personal/Contact Information
- Summary/Objective/Profile
- Work Experience/Employment History
- Education/Academic Background
- Skills/Technical Skills/Core Competencies
- Projects/Side Projects/Personal Projects
- Awards/Honors/Achievements/Certifications
- Publications/Research/Papers
- Volunteer Work/Community Service
- Languages/Language Proficiency
- Interests/Hobbies
- References
- Professional Affiliations/Memberships
- Courses/Training/Workshops
- GitHub/Portfolio/Code Samples
- Patents
- Speaking Engagements/Presentations

DETAILED EXTRACTION INSTRUCTIONS:

PERSONAL INFORMATION (Extract with 100% accuracy):
- name: The FULL name from the top of the resume (usually largest text)
  ✓ CORRECT: "Sarah Johnson", "Michael Chen", "Dr. Emily Rodriguez"
  ✗ WRONG: "Software Engineer", "Resume", "Professional Summary"
- email: Exact email address with @ symbol
- phone: Phone number with all digits and formatting
- location: City and State/Country exactly as shown
- linkedin: Full LinkedIn URL or username
- website: Personal website URL
- github: GitHub profile URL or username
- portfolio: Portfolio website URL

SUMMARY/OBJECTIVE:
- Extract the introductory paragraph word-for-word
- May be labeled: Summary, Objective, Profile, About Me, Professional Summary
- Preserve all sentences and punctuation exactly

WORK EXPERIENCE (Extract EVERY job):
- company: Company name exactly as shown
- position: Job title exactly as shown
- location: City, State where job was located
- startDate: Start date EXACTLY as shown (e.g., "Jan 2020", "January 2020", "2020-01")
- endDate: End date EXACTLY as shown (e.g., "Present", "Current", "Dec 2022")
- description: Array of ALL bullet points/achievements
  - Each bullet point as a separate array item
  - Preserve exact wording
  - Include ALL bullets, don't skip any

EDUCATION (Extract EVERY degree):
- school: University/College name exactly as shown
- degree: Degree type (e.g., "Bachelor of Science", "Master of Arts", "PhD")
- field: Field of study (e.g., "Computer Science", "Business Administration")
- location: City, State of the school
- graduationDate: Graduation date EXACTLY as shown

SKILLS:
- Extract ALL skills mentioned anywhere in the resume
- Include: Technical skills, soft skills, tools, languages, frameworks
- Preserve exact names (e.g., "JavaScript" not "Javascript", "React.js" not "React")

CUSTOM SECTIONS:
- For Projects, Awards, Certifications, Publications, etc.
- Extract with title, type, and content
- Preserve all details and formatting

QUALITY CHECKS:
✓ Name is a person's name, not a job title or section header
✓ All dates are preserved exactly as shown
✓ All bullet points are captured
✓ No information is lost or summarized
✓ Spelling and capitalization are exact
✓ All sections are identified and extracted

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations):
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "(123) 456-7890",
    "location": "City, State",
    "linkedin": "linkedin.com/in/username",
    "website": "website.com",
    "github": "github.com/username",
    "portfolio": "portfolio.com"
  },
  "summary": "Professional summary text here",
  "experience": [
    {
      "id": "1",
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, State",
      "startDate": "Jan 2020",
      "endDate": "Present",
      "description": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "id": "1",
      "school": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "location": "City, State",
      "graduationDate": "May 2020"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "customSections": [
    {
      "id": "1",
      "title": "Projects",
      "type": "items",
      "content": [
        {
          "id": "1",
          "title": "Project Name",
          "subtitle": "React, Node.js, MongoDB",
          "date": "Jan 2020 - Mar 2020",
          "description": ["Built feature X", "Achieved Y"]
        }
      ]
    },
    {
      "id": "2",
      "title": "Awards",
      "type": "list",
      "content": ["Award 1 - 2020", "Award 2 - 2019"]
    },
    {
      "id": "3",
      "title": "Certifications",
      "type": "text",
      "content": "AWS Certified Solutions Architect - 2020"
    }
  ]
}

If any field is not found, use empty string "" or empty array []. Ensure all IDs are unique strings.`;

// ORIGINAL API CALL
const response = await retryWithBackoff(
  () => axios.post(
    KIMI_API_URL,
    {
      model: 'moonshot-v1-32k-vision-preview',
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      temperature: 0,
      max_tokens: 4096,
      // NO seed parameter
      // NO top_p parameter
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  ),
  5,
  2000,
  (attempt, delay) => {
    console.log(`Kimi Vision: Rate limit or error, retrying in ${delay}ms (attempt ${attempt}/5)`);
  }
);
```

### Original: quick-analysis-free.ts (Current Prompt)

```typescript
// ORIGINAL PROMPT (850 tokens)
const prompt = `You are an expert resume analyst. Analyze this resume and provide a FREE quick assessment that demonstrates your expertise while leaving room for the paid deep-dive.

STRATEGY: Show them you found REAL issues in THEIR resume using THEIR data. Be specific enough to prove value, but hold back the complete solution.

Return ONLY this JSON structure (no markdown, no explanations):
{
  "scores": {
    "overall": number (0-100, weighted: ats*0.4 + clarity*0.3 + impact*0.3),
    "ats": number (0-100, ATS compatibility score),
    "clarity": number (0-100, readability and structure),
    "impact": number (0-100, achievement strength)
  },
  "quickWins": [
    {
      "text": "specific observation pointing to the issue with their actual data",
      "section": "exact section name from resume",
      "priority": "High | Medium | Low"
    }
  ],
  "inferredJobTarget": "specific job title inferred from experience and skills",
  "keyStrengths": ["specific strength with evidence from their resume", "strength 2"],
  "topIssues": ["specific issue with their actual data", "issue 2"]
}

SCORING (same methodology as full version):
- ATS Score: Keywords, quantification, structure, formatting, action verbs
- Clarity Score: Readability, conciseness, flow, grammar
- Impact Score: Quantified results, verb strength, achievement focus, business impact

QUICK WINS (provide exactly 2-3, ordered by priority):
- Use THEIR actual text/data from the resume
- Point out the PROBLEM clearly
- Give 80% of the insight (enough to be helpful)
- Hold back 20% (the exact rewrite/solution)

EXAMPLES OF GOOD FREE-TIER SUGGESTIONS:

✓ "Experience bullet 2 says 'Led team' - no team size or outcome mentioned"
  → Shows the problem, references their text, but doesn't give the full rewrite

✓ "'Managed projects' in Experience section - lacks numbers (how many? what results?)"
  → Points to vague language, asks the right questions, but doesn't solve it

✓ "Skills section missing key tools for [job target]: no mention of [specific tools]"
  → Identifies the gap with specifics, but doesn't list all missing keywords

✓ "3 out of 5 experience bullets start with weak verbs ('Responsible for', 'Helped with')"
  → Quantifies the issue, shows you analyzed it, but doesn't rewrite them all

BAD EXAMPLES (too generic or too complete):

✗ "Add more metrics to your experience" (generic, no proof you read it)
✗ "Replace 'Led team' with 'Led team of 8 engineers, delivering 3 products worth $2.3M'" (gave away the full solution)
✗ "Improve your resume" (useless)

KEY STRENGTHS (exactly 2, with evidence):
- Reference THEIR actual content
- Be specific: "5 out of 6 bullets in Experience include metrics"
- Show you analyzed their unique profile

TOP ISSUES (exactly 2, with specific data):
- Use THEIR text: "No metrics in Experience bullets 1, 3, 5"
- Quantify when possible: "Weak action verbs appear 4 times"
- Be precise enough to verify immediately

JOB TARGET INFERENCE:
- Analyze their experience titles, skills, industry
- Be SPECIFIC: "Senior Product Manager" not just "Manager"
- Consider career level based on years

Resume Content:
${resumeContent}

REMEMBER: Give them 80% - enough to see you're legit and get some value, but make them want the remaining 20% (exact fixes, more insights, detailed rewrites).`;

// ORIGINAL API CALL
const response = await queuedApiCall(() =>
  retryWithBackoff(
    () => axios.post(
      KIMI_API_URL,
      {
        model: 'kimi-k2-turbo-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0,
        max_tokens: 800,
        // NO top_p parameter
        // NO system message caching
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    ),
    5,
    3000,
    (attempt, delay) => {
      console.log(`Quick Analysis Free: Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/5)`);
    }
  )
);
```

---

## 🎯 Optimized Implementation Plan

### Phase 1: Safe Optimizations (Implement Now)

#### 1.1 Add Perceptual-Hash Cache (Vision Only)
```typescript
// Cache vision extraction for 24h
// Always run fresh analysis (no stale suggestions)
```

#### 1.2 Add seed + top_p Parameters
```typescript
// Vision API:
seed: 42, // Fixed seed for consistency
top_p: 0.01,

// Analysis APIs:
top_p: 0.01,
```

#### 1.3 Compress Prompts (25-30%)
```typescript
// Remove redundant examples
// Keep critical accuracy instructions
// Consolidate similar rules
```

#### 1.4 System Message Caching
```typescript
// Move scoring rubrics to system message
// Cache per session
```

### Phase 2: Test & Validate

#### 2.1 Test max_tokens Reduction
```typescript
// Try 2000 first (not 700)
// Monitor for truncation
// A/B test with real resumes
```

#### 2.2 Monitor Cache Hit Rate
```typescript
// Track: cache hits vs misses
// Measure: actual cost savings
// Alert: if hit rate < 30%
```

### Phase 3: Advanced (If Needed)

#### 3.1 Image Resize Testing
```typescript
// Test OCR accuracy at different resolutions
// Compare: 1000px vs 1500px vs 2000px
// Measure: extraction errors
```

---

## 📈 Expected Results

### Cost Savings:
- **Vision cache:** 50-70% on repeat uploads
- **Prompt compression:** 25-30% token reduction
- **System message caching:** 10-15% on analysis
- **Total expected:** 30-40% overall cost reduction

### Quality Improvements:
- **Determinism:** Near-perfect with temperature=0 + seed + top_p
- **Consistency:** Same input → same output
- **Freshness:** Analysis always reflects current resume

### Risk Mitigation:
- ✅ Two-tier caching prevents stale analysis
- ✅ Content hashing catches edits
- ✅ Conservative max_tokens prevents truncation
- ✅ Hybrid prompts maintain accuracy

---

## 🔄 Rollback Instructions

If optimizations cause issues:

1. **Revert kimi-vision.ts:**
   - Remove cache logic
   - Remove seed parameter
   - Restore original prompt (see above)
   - Set max_tokens back to 4096

2. **Revert analysis files:**
   - Remove top_p parameter
   - Remove system message caching
   - Restore original prompts (see above)

3. **Monitor:**
   - Check extraction accuracy
   - Verify analysis quality
   - Measure cost impact

---

## 📝 Notes & Learnings

### What Worked:
- (To be filled after implementation)

### What Didn't Work:
- (To be filled after implementation)

### Unexpected Issues:
- (To be filled after implementation)

### Future Optimizations:
- (To be filled after implementation)

---

**Last Updated:** November 21, 2025  
**Status:** Ready for Phase 1 implementation
