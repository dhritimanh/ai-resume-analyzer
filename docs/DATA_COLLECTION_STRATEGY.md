# Data Collection Strategy - Pay Per Use (No Profiles)

## ✅ Decision: Collect Data Without User Profiles

### Why This Approach?

**Short-term benefits:**
- 💰 **More revenue:** No caching = users pay for every analysis
- 🚀 **Faster launch:** No auth system, no user profiles, no complexity
- 🔒 **Privacy-friendly:** Anonymous data collection (GDPR compliant)
- 📊 **Build dataset:** Collect data for future features

**Long-term benefits:**
- 📈 **Benchmarking:** "Your score vs industry average" (after 1000+ resumes)
- 💡 **Product insights:** "Most users struggle with quantification"
- 🎯 **Future features:** Personalized analysis, progress tracking
- 🔧 **Prompt optimization:** Track which prompts fail most often

---

## What Gets Stored

### ✅ Anonymous Data (Safe to Store)
- Resume content hash (SHA-256) - NOT the actual content
- Analysis results (scores, suggestions, full JSON)
- Inferred metadata (job target, industry, seniority)
- Session ID (browser fingerprint)
- Hashed IP (for abuse prevention)
- Timestamps, processing time

### ❌ Personal Data (NOT Stored)
- Actual resume text/content
- Names, emails, phone numbers
- User accounts (not yet)
- Payment info (Stripe handles that)

---

## Database Schema

### Core Table: `resume_analyses`
```sql
CREATE TABLE resume_analyses (
  id UUID PRIMARY KEY,
  session_id VARCHAR(64),      -- Anonymous tracking
  ip_hash VARCHAR(64),          -- Abuse prevention
  resume_hash VARCHAR(64),      -- Resume fingerprint
  analysis_type VARCHAR(50),    -- 'quick_paid', 'section', etc.
  tier VARCHAR(20),             -- 'free', 'paid'
  result JSONB,                 -- Full analysis result
  inferred_job_target VARCHAR(200),
  inferred_industry VARCHAR(100),
  overall_score INT,
  ats_score INT,
  clarity_score INT,
  impact_score INT,
  processing_time_ms INT,
  created_at TIMESTAMP
);
```

**Storage:** ~5KB per analysis = 5MB per 1000 analyses (negligible cost)

---

## Implementation

### 1. Add to API Routes (No Prompt Changes!)

```typescript
// /app/api/analysis/quick/route.ts
import { storeAnalysis, hashResume, hashIP, generateSessionId, inferMetadata } from '@/lib/db/analytics';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const { resumeContent } = await request.json();
  
  // Anonymous tracking
  const sessionId = request.cookies.get('session_id')?.value || generateSessionId();
  const ipHash = hashIP(request.ip);
  const resumeHash = hashResume(resumeContent);
  
  try {
    // Run analysis (NO CHANGES TO PROMPTS)
    const result = await runQuickAnalysis(resumeContent);
    
    // Store for data collection
    await storeAnalysis({
      session_id: sessionId,
      ip_hash: ipHash,
      resume_hash: resumeHash,
      analysis_type: 'quick_paid',
      tier: 'paid',
      result: result,
      inferred_job_target: result.inferredJobTarget,
      overall_score: result.scores.overall,
      ats_score: result.scores.ats,
      clarity_score: result.scores.clarity,
      impact_score: result.scores.impact,
      processing_time_ms: Date.now() - startTime,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    await storeError({ session_id: sessionId, error });
    throw error;
  }
}
```

**Key points:**
- ✅ No prompt changes
- ✅ No caching (pay per use)
- ✅ Anonymous tracking
- ✅ Store full results for future analysis

---

## Future Insights (After 1000+ Resumes)

### 1. Industry Benchmarks
```sql
SELECT 
  inferred_job_target,
  COUNT(*) as sample_size,
  AVG(overall_score) as avg_score
FROM resume_analyses
WHERE tier = 'paid'
GROUP BY inferred_job_target
HAVING COUNT(*) >= 50;
```

**Output:**
```
Senior Software Engineer | 342 | 72
Product Manager          | 218 | 68
Data Scientist           | 156 | 70
```

**Future feature:** "Your score (78) is above average for Senior Software Engineers (72)"

### 2. Quantification Impact
```sql
-- Correlation between quantification rate and overall score
SELECT 
  CASE 
    WHEN (result->>'quantificationRate')::int >= 70 THEN 'High (70-100%)'
    WHEN (result->>'quantificationRate')::int >= 50 THEN 'Medium (50-69%)'
    ELSE 'Low (0-49%)'
  END as quantification_level,
  AVG(overall_score) as avg_overall_score
FROM resume_analyses
WHERE result->>'quantificationRate' IS NOT NULL
GROUP BY quantification_level;
```

**Insight:** "Resumes with high quantification score 20 points higher on average"

### 3. Common Weaknesses
```sql
-- Most common issues by role
SELECT 
  inferred_job_target,
  AVG((result->'metrics'->>'quantificationRate')::decimal) as avg_quantification,
  COUNT(*) as sample_size
FROM resume_analyses
WHERE tier = 'paid'
GROUP BY inferred_job_target
HAVING COUNT(*) >= 30;
```

**Insight:** "Product Managers struggle most with quantification (58% avg)"

### 4. Conversion Tracking
```sql
-- Free vs Paid usage
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) FILTER (WHERE tier = 'free') as free_analyses,
  COUNT(*) FILTER (WHERE tier = 'paid') as paid_analyses
FROM resume_analyses
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY date;
```

**Insight:** Track conversion rate from free to paid

---

## Privacy & Compliance

### GDPR Compliance
- ✅ **Anonymous data:** No PII stored
- ✅ **Right to deletion:** Can delete by session_id
- ✅ **Data retention:** Auto-delete after 2 years
- ✅ **Transparency:** Clear privacy policy

### Privacy Policy (Add to Site)
```
We collect anonymous resume analysis data to improve our service:
- Analysis results (scores, suggestions)
- Inferred job information (e.g., "Senior Engineer")
- Anonymous session ID (no personal information)
- We do NOT store your actual resume content
- We do NOT store names, emails, or contact information
- Data is used for product improvement and benchmarking
- You can request deletion by contacting support
```

---

## Implementation Timeline

### Week 1: Basic Setup
- [ ] Create database tables (Supabase/PostgreSQL)
- [ ] Implement `lib/db/analytics.ts` functions
- [ ] Add session ID cookie generation
- [ ] Test data collection locally

### Week 2: API Integration
- [ ] Add `storeAnalysis()` to all 5 analysis endpoints
- [ ] Add error tracking to all endpoints
- [ ] Deploy to production
- [ ] Verify data collection works

### Week 3: Monitoring
- [ ] Build simple analytics dashboard
- [ ] Query: Total analyses by type
- [ ] Query: Average scores by job target
- [ ] Query: Error rates by endpoint
- [ ] Set up alerts for high error rates

### Week 4: Insights
- [ ] Wait for 100+ analyses
- [ ] Run benchmark queries
- [ ] Analyze common patterns
- [ ] Document insights for future features

### Month 2+: Future Features
- [ ] Add benchmarking: "Your score vs average"
- [ ] Add trends: "Top 25% in your industry"
- [ ] Consider adding user profiles (optional)
- [ ] Consider adding result caching (optional)

---

## Cost Analysis

### Current (Pay Per Use)
- User uploads resume → $0.015 API cost
- User pays $2-5 → Profit: $1.985-4.985
- **Margin:** 99.25% - 99.7%

### With Data Collection
- User uploads resume → $0.015 API cost + $0.0001 DB cost
- User pays $2-5 → Profit: $1.9849-4.9849
- **Margin:** 99.24% - 99.69%

**Database cost is negligible (~0.01% of revenue)**

### Future (With Caching)
- First upload → $0.015 API cost
- Repeat upload → $0.0001 DB cost (90% savings)
- But: Less revenue (users don't pay again)

**Recommendation:** Start with pay-per-use, add caching later when you have user profiles

---

## Summary

### ✅ What We're Doing
- Pay-per-use model (no caching)
- Anonymous data collection
- Store full analysis results
- Track scores, job targets, industries
- Build dataset for future features

### ✅ What We're NOT Doing (Yet)
- User profiles
- Result caching
- Personalized analysis
- Progress tracking

### ✅ Benefits
- 💰 Maximum revenue short-term
- 📊 Build valuable dataset
- 🚀 Fast to implement
- 🔒 Privacy-friendly
- 📈 Enable future features

### ✅ No Prompt Changes Needed
All prompts stay exactly the same - just add database inserts to API routes!

---

## Files Created

1. `DATABASE_SCHEMA_DATA_COLLECTION.md` - Full schema + queries
2. `lib/db/analytics.ts` - Helper functions (ready to use)
3. `DATA_COLLECTION_STRATEGY.md` - This document

**Next step:** Implement database tables and add `storeAnalysis()` calls to API routes.
