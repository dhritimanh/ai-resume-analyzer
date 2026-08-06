# Database Schema - Data Collection (No Profiles)

## Strategy: Pay-Per-Use + Anonymous Data Collection

**Goal:** Collect resume analysis data for future insights WITHOUT building user profiles yet.

**Benefits:**
- 📊 Build dataset for future ML/benchmarking
- 💰 Keep pay-per-use model (no caching = more revenue short-term)
- 🔒 Privacy-friendly (anonymous data collection)
- 🚀 Fast to implement (no auth, no profiles)
- 📈 Analyze trends (what industries, roles, scores are common)

---

## Core Tables

### 1. `resume_analyses` (Main Data Collection)

```sql
CREATE TABLE resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Anonymous tracking (no user accounts yet)
  session_id VARCHAR(64), -- Browser fingerprint or session cookie
  ip_hash VARCHAR(64), -- Hashed IP for abuse prevention
  
  -- Resume metadata
  resume_hash VARCHAR(64) NOT NULL, -- SHA-256 of resume content
  resume_length INT, -- Character count
  file_type VARCHAR(20), -- 'pdf', 'docx', 'txt'
  
  -- Analysis metadata
  analysis_type VARCHAR(50) NOT NULL, -- 'quick_free', 'quick_paid', 'section', 'language', 'career', 'insights'
  tier VARCHAR(20) NOT NULL, -- 'free', 'paid'
  
  -- Results (store everything for future analysis)
  result JSONB NOT NULL,
  
  -- Inferred data (for trend analysis)
  inferred_job_target VARCHAR(200), -- e.g., "Senior Software Engineer"
  inferred_industry VARCHAR(100), -- e.g., "Technology", "Healthcare"
  inferred_seniority VARCHAR(50), -- e.g., "Entry", "Mid", "Senior", "Lead"
  inferred_years_experience INT, -- Estimated from resume
  
  -- Scores (denormalized for easy querying)
  overall_score INT,
  ats_score INT,
  clarity_score INT,
  impact_score INT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  processing_time_ms INT, -- How long analysis took
  
  -- Indexes
  INDEX idx_session_id (session_id),
  INDEX idx_resume_hash (resume_hash),
  INDEX idx_analysis_type (analysis_type),
  INDEX idx_tier (tier),
  INDEX idx_job_target (inferred_job_target),
  INDEX idx_industry (inferred_industry),
  INDEX idx_created_at (created_at),
  INDEX idx_scores (overall_score, ats_score, clarity_score, impact_score)
);
```

**Why this works:**
- ✅ No user accounts needed
- ✅ Anonymous (session_id + ip_hash for abuse prevention only)
- ✅ Stores full results for future analysis
- ✅ Denormalized scores for fast aggregation queries
- ✅ Can track trends without identifying users

---

### 2. `resume_metrics` (Aggregated Metrics for Benchmarking)

```sql
CREATE TABLE resume_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES resume_analyses(id),
  
  -- Structural metrics (from future safety-metrics.ts)
  total_bullet_points INT,
  bullets_with_numbers INT,
  quantification_rate DECIMAL(5,2), -- 0-100
  total_experience_roles INT,
  avg_tenure_per_role DECIMAL(4,2), -- years
  section_count INT,
  total_word_count INT,
  action_verb_count INT,
  unique_action_verbs INT,
  verb_diversity_ratio DECIMAL(4,2), -- 0-1
  passive_voice_instances INT,
  first_person_pronouns INT,
  avg_bullet_length_words DECIMAL(5,2),
  longest_bullet_words INT,
  shortest_bullet_words INT,
  resume_density DECIMAL(6,2), -- words per page
  career_span_years DECIMAL(4,1),
  employment_gaps JSONB, -- [{"between": "Company A and B", "duration_months": 3}]
  progression_velocity DECIMAL(4,2), -- years per level increase
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_analysis_id (analysis_id),
  INDEX idx_quantification_rate (quantification_rate),
  INDEX idx_career_span (career_span_years)
);
```

**Why this is valuable:**
- 📊 Build benchmarks: "Average quantification rate for Software Engineers is 68%"
- 📈 Trend analysis: "Resumes with >70% quantification score 15 points higher"
- 🎯 Future feature: "Your resume is in the top 25% for your industry"
- 💡 Product insights: "Most users struggle with action verbs (avg 45%)"

---

### 3. `analysis_errors` (Error Tracking)

```sql
CREATE TABLE analysis_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64),
  analysis_type VARCHAR(50),
  error_type VARCHAR(100), -- 'json_parse_error', 'rate_limit', 'timeout', etc.
  error_message TEXT,
  resume_hash VARCHAR(64), -- For debugging
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_error_type (error_type),
  INDEX idx_created_at (created_at)
);
```

**Why this matters:**
- 🐛 Track which prompts fail most often
- 📉 Monitor error rates over time
- 🔧 Prioritize prompt improvements
- 💰 Calculate actual success rate for pricing

---

## Data Collection Flow (No Caching)

```typescript
// /app/api/analysis/quick/route.ts
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const { resumeContent } = await request.json();
  
  // Generate anonymous identifiers
  const sessionId = request.cookies.get('session_id')?.value || generateSessionId();
  const ipHash = hashIP(request.ip);
  const resumeHash = hashResume(resumeContent);
  
  try {
    // Run analysis (NO caching - pay per use)
    const result = await runQuickAnalysis(resumeContent);
    
    // Store in database for data collection
    await db.insert('resume_analyses', {
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
    // Log error for analysis
    await db.insert('analysis_errors', {
      session_id: sessionId,
      analysis_type: 'quick_paid',
      error_type: error.name,
      error_message: error.message,
      resume_hash: resumeHash,
    });
    
    throw error;
  }
}
```

---

## Future Insights You Can Build

### 1. Industry Benchmarks (After 1000+ resumes)
```sql
-- Average scores by job target
SELECT 
  inferred_job_target,
  COUNT(*) as sample_size,
  AVG(overall_score) as avg_overall,
  AVG(ats_score) as avg_ats,
  AVG(clarity_score) as avg_clarity,
  AVG(impact_score) as avg_impact
FROM resume_analyses
WHERE tier = 'paid' AND created_at > NOW() - INTERVAL '90 days'
GROUP BY inferred_job_target
HAVING COUNT(*) >= 50
ORDER BY sample_size DESC;
```

**Output:**
```
Senior Software Engineer | 342 | 72 | 75 | 68 | 73
Product Manager          | 218 | 68 | 71 | 70 | 65
Data Scientist           | 156 | 70 | 73 | 67 | 71
```

**Future feature:** "Your score (78) is above average for Senior Software Engineers (72)"

---

### 2. Quantification Rate Analysis
```sql
-- Correlation between quantification and overall score
SELECT 
  CASE 
    WHEN m.quantification_rate >= 70 THEN '70-100%'
    WHEN m.quantification_rate >= 50 THEN '50-69%'
    WHEN m.quantification_rate >= 30 THEN '30-49%'
    ELSE '0-29%'
  END as quantification_bucket,
  COUNT(*) as count,
  AVG(a.overall_score) as avg_overall_score,
  AVG(a.impact_score) as avg_impact_score
FROM resume_metrics m
JOIN resume_analyses a ON m.analysis_id = a.id
GROUP BY quantification_bucket
ORDER BY quantification_bucket DESC;
```

**Output:**
```
70-100% | 234 | 78 | 82
50-69%  | 412 | 71 | 74
30-49%  | 298 | 64 | 66
0-29%   | 156 | 58 | 59
```

**Insight:** "Resumes with >70% quantification score 20 points higher on average"

---

### 3. Common Weaknesses by Role
```sql
-- Most common issues by job target
SELECT 
  inferred_job_target,
  AVG(m.quantification_rate) as avg_quantification,
  AVG(m.verb_diversity_ratio) as avg_verb_diversity,
  AVG(m.passive_voice_instances) as avg_passive_voice
FROM resume_analyses a
JOIN resume_metrics m ON m.analysis_id = a.id
WHERE a.tier = 'paid'
GROUP BY inferred_job_target
HAVING COUNT(*) >= 30;
```

**Output:**
```
Product Manager          | 58% | 0.52 | 4.2
Senior Software Engineer | 72% | 0.61 | 2.8
Data Scientist           | 65% | 0.48 | 3.5
```

**Insight:** "Product Managers struggle most with quantification (58% avg)"

---

### 4. Conversion Funnel Analysis
```sql
-- Free vs Paid usage patterns
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) FILTER (WHERE tier = 'free') as free_analyses,
  COUNT(*) FILTER (WHERE tier = 'paid') as paid_analyses,
  COUNT(DISTINCT session_id) FILTER (WHERE tier = 'free') as free_users,
  COUNT(DISTINCT session_id) FILTER (WHERE tier = 'paid') as paid_users
FROM resume_analyses
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

**Insight:** Track conversion rate from free to paid

---

## Privacy & Compliance

### What We Store:
- ✅ Resume content hash (not actual content)
- ✅ Analysis results (scores, suggestions)
- ✅ Inferred metadata (job target, industry)
- ✅ Anonymous session ID (browser fingerprint)
- ✅ Hashed IP (for abuse prevention)

### What We DON'T Store:
- ❌ Actual resume text/content
- ❌ Names, emails, phone numbers
- ❌ User accounts (yet)
- ❌ Payment info (Stripe handles that)

### GDPR Compliance:
- ✅ Anonymous data (no PII)
- ✅ Can delete by session_id if requested
- ✅ Data retention policy (e.g., 2 years)
- ✅ Clear privacy policy

---

## Implementation Checklist

### Phase 1: Basic Data Collection (Week 1)
- [ ] Create `resume_analyses` table
- [ ] Add database insert to all 5 analysis endpoints
- [ ] Generate session_id cookie on first visit
- [ ] Hash IP addresses for abuse prevention
- [ ] Test data collection in production

### Phase 2: Metrics Collection (Week 2)
- [ ] Implement `safety-metrics.ts` (structural metrics)
- [ ] Create `resume_metrics` table
- [ ] Store metrics alongside analysis results
- [ ] Verify data quality

### Phase 3: Error Tracking (Week 3)
- [ ] Create `analysis_errors` table
- [ ] Add error logging to all endpoints
- [ ] Build error dashboard (Grafana/Metabase)
- [ ] Set up alerts for high error rates

### Phase 4: Analytics Dashboard (Week 4)
- [ ] Build internal analytics dashboard
- [ ] Query: Average scores by job target
- [ ] Query: Quantification rate correlation
- [ ] Query: Common weaknesses by role
- [ ] Query: Free vs paid conversion funnel

### Phase 5: Future Features (Month 2+)
- [ ] Add benchmarking: "Your score vs average"
- [ ] Add trends: "Top 25% in your industry"
- [ ] Add insights: "Resumes with X score Y higher"
- [ ] Consider adding user profiles (optional)

---

## Cost Analysis

### Storage Costs (Supabase/PostgreSQL)
- Average analysis result: ~5KB JSON
- 1000 analyses/month: ~5MB
- 12 months: ~60MB
- **Cost:** ~$0 (well within free tier)

### Query Costs
- Aggregation queries: Fast with proper indexes
- 1000 analyses: <100ms query time
- **Cost:** Negligible

### Benefits
- 📊 Build valuable dataset for future features
- 💡 Product insights (what users struggle with)
- 🎯 Benchmarking data (industry averages)
- 📈 Conversion tracking (free → paid)
- 🔧 Error monitoring (improve prompts)

---

## Summary

**Current approach (pay-per-use + data collection):**
- ✅ No caching = more revenue short-term
- ✅ Collect data for future insights
- ✅ No user profiles = faster to implement
- ✅ Privacy-friendly (anonymous)
- ✅ Build benchmarks over time

**Future approach (when ready):**
- Add user profiles (optional)
- Add result caching (optional)
- Add personalized analysis (optional)
- Use collected data for benchmarking

**No prompt changes needed** - just add database inserts to existing API routes!
