# Prompt Optimization & Database Impact Analysis

## ✅ Completed: Removed Redundant Instructions

### Changes Made (Token Savings: ~50-80 tokens per call)

#### 1. **career-tailoring.ts**
**Removed (redundant with systemMessage CRITICAL section):**
- ❌ "Score all metrics (0-100) based on resume content only, never external benchmarks"
- ❌ "Frame role suggestions as 'based on your progression' not 'you should be' or 'market demands'"
- ❌ "Never claim roles are 'in high demand' or reference salary ranges"
- ❌ "Let THEM decide next role - provide options based on trajectory, not prescriptions"

**Kept (actionable, non-redundant):**
- ✅ "Suggest 2-6 roles based on career stage"
- ✅ "Provide career paths showing progression"
- ✅ "Identify gaps ONLY if job description provided"
- ✅ "Link 3-5 goals per role to resume gaps"
- ✅ "In justification field, cite THEIR progression pattern"

#### 2. **language-branding.ts**
**Removed (redundant with systemMessage CRITICAL section):**
- ❌ "Score all branding metrics (0-100) with clear reasons based on resume content only"
- ❌ "Never reference external benchmarks, industry averages, or typical scores"

**Kept (actionable, non-redundant):**
- ✅ "Count grammar issues by type"
- ✅ "Calculate word_count, avg_sentence_length, unique_word_count"
- ✅ "Categorize action verbs: weak/medium/strong"
- ✅ "Provide 3-5 verb examples with 10-word context snippets"

#### 3. **deep-insights.ts**
**Removed (redundant with systemMessage CRITICAL section):**
- ❌ "All scores 0-100 based on resume content, never external benchmarks"
- ❌ "Never claim 'you prefer X' or 'you're a great fit for Y' - only state observable patterns"
- ❌ "NOT absolutes ('great fit for startups')" (already in example)

**Kept (actionable, non-redundant):**
- ✅ "Infer psychological traits from resume evidence only"
- ✅ "Evidence quotes: 10-15 words from resume"
- ✅ "For cultural fit: cite observable data (e.g., '5 cross-functional collaborations, 0 direct-reports')"
- ✅ "Organization type scores reflect EXPERIENCE at those types"

---

## 🗄️ Database Impact Analysis

### Current Architecture (No Database)
```
User uploads resume → Vision API extracts text → 5 analysis calls → Results returned
```

**Prompt structure:**
- `systemMessage`: Cached per session (scoring methodology, safety rules)
- `prompt`: Sent every time (resume content, instructions)

### Future Architecture (With Database)

#### Option A: Cache Analysis Results
```
User uploads resume → Check DB for existing analysis → If found: return cached
                                                     → If not: run analysis → save to DB
```

**Impact on prompts:** ✅ **NONE** - Prompts stay the same, just cache the results

**Benefits:**
- Instant results for repeat uploads
- Reduce API costs by ~90% for returning users
- Same prompts, same quality

#### Option B: Store Resume Embeddings + Incremental Analysis
```
User uploads resume → Generate embedding → Find similar resumes in DB
                   → If similar: use cached analysis + delta update
                   → If new: full analysis → save to DB
```

**Impact on prompts:** ⚠️ **MINOR** - Add "previous analysis" context to prompt

**Example change:**
```typescript
const prompt = `Analyze this resume for job target: "${inferredJobTarget}"

${previousAnalysis ? `PREVIOUS ANALYSIS (for reference):
${JSON.stringify(previousAnalysis.scores)}
Focus on what's CHANGED since last analysis.` : ''}

Return ONLY this JSON:
...
```

**Benefits:**
- Detect resume improvements over time
- Show "Your score improved from 65 → 78"
- Personalized suggestions based on history

#### Option C: Store User Preferences + Personalized Prompts
```
User profile in DB → Job target preferences, industry, seniority
                   → Customize prompts per user
```

**Impact on prompts:** ⚠️ **MODERATE** - Add user context to systemMessage

**Example change:**
```typescript
const systemMessage = `You are a professional resume analyst. Output ONLY valid JSON.

${userProfile ? `USER CONTEXT:
- Target Industry: ${userProfile.targetIndustry}
- Target Role: ${userProfile.targetRole}
- Seniority: ${userProfile.seniority}
- Previous feedback: User improved quantification from 45% → 68%` : ''}

SCORING METHODOLOGY...
```

**Benefits:**
- Hyper-personalized analysis
- Track user progress over time
- Adaptive suggestions based on user goals

---

## 🎯 Recommendation: Start with Option A

### Phase 1: Simple Result Caching (No Prompt Changes)
```sql
CREATE TABLE resume_analyses (
  id UUID PRIMARY KEY,
  user_id UUID,
  resume_hash VARCHAR(64), -- SHA-256 of resume content
  analysis_type VARCHAR(50), -- 'quick', 'section', 'language', etc.
  result JSONB,
  created_at TIMESTAMP,
  INDEX (user_id, resume_hash, analysis_type)
);
```

**Query logic:**
```typescript
// Before running analysis
const cached = await db.query(
  'SELECT result FROM resume_analyses WHERE resume_hash = $1 AND analysis_type = $2',
  [resumeHash, 'quick']
);

if (cached) return cached.result; // Instant return

// Run analysis
const result = await runQuickAnalysis(resumeContent);

// Cache for next time
await db.insert('resume_analyses', { resume_hash: resumeHash, result });
```

**Prompt impact:** ✅ **ZERO** - No changes needed

### Phase 2: Add User Progress Tracking (Minor Prompt Changes)
```sql
ALTER TABLE resume_analyses ADD COLUMN previous_analysis_id UUID;
```

**Prompt change:**
```typescript
// Only if user has previous analysis
if (previousAnalysis) {
  prompt += `\nPREVIOUS SCORES: Overall ${previousAnalysis.scores.overall}, ATS ${previousAnalysis.scores.ats}
  Focus on improvements and new issues.`;
}
```

**Prompt impact:** ⚠️ **MINOR** - Add 1-2 lines to user prompt (optional)

### Phase 3: Personalized Analysis (Moderate Prompt Changes)
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  target_industry VARCHAR(100),
  target_role VARCHAR(100),
  seniority VARCHAR(50),
  preferences JSONB
);
```

**Prompt change:**
```typescript
// Add to systemMessage
if (userProfile) {
  systemMessage += `\nUSER CONTEXT: Targeting ${userProfile.targetRole} in ${userProfile.targetIndustry}`;
}
```

**Prompt impact:** ⚠️ **MODERATE** - Modify systemMessage (still cached)

---

## 📊 Token Cost Analysis

### Current (No Database)
- Quick analysis: ~1,200 tokens/call
- Section analysis: ~3,500 tokens/call
- Language & branding: ~2,500 tokens/call
- Career & tailoring: ~3,500 tokens/call
- Deep insights: ~4,000 tokens/call

**Total per full analysis:** ~14,700 tokens (~$0.015 per resume)

### With Database (Option A - Result Caching)
- First upload: ~14,700 tokens (~$0.015)
- Repeat upload: **0 tokens** (~$0.000)

**Savings:** 90% cost reduction for returning users

### With Database (Option B - Incremental Analysis)
- First upload: ~14,700 tokens (~$0.015)
- Updated resume: ~8,000 tokens (~$0.008) - only analyze changes

**Savings:** 45% cost reduction for resume updates

### With Database (Option C - Personalized Prompts)
- First upload: ~15,500 tokens (~$0.016) - slightly more for user context
- Repeat upload: **0 tokens** (~$0.000) - cached
- Updated resume: ~8,500 tokens (~$0.009)

**Savings:** 40% cost reduction + better quality

---

## ✅ Summary

### Current State (After Optimization)
- ✅ Removed redundant instructions from 3 files
- ✅ Saved ~50-80 tokens per call
- ✅ Cleaner, more focused prompts
- ✅ Single source of truth for safety rules (systemMessage)

### Database Impact
- ✅ **Option A (Result Caching):** No prompt changes needed
- ⚠️ **Option B (Incremental):** Minor prompt changes (1-2 lines)
- ⚠️ **Option C (Personalized):** Moderate prompt changes (systemMessage update)

### Recommendation
**Start with Option A** - Get 90% cost savings with zero prompt changes, then gradually add Options B & C as needed.
