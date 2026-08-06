# Complete Database Schema - Production Ready

## Overview

**Core entities:**
1. **Resumes** - Store PDF files + extracted text
2. **Analyses** - Store each tab's analysis results per resume
3. **Payments** - Track all payment transactions
4. **Sessions** - Anonymous user tracking (no accounts yet)

---

## 1. Resume Storage

### `resumes` Table
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  session_id VARCHAR(64) NOT NULL, -- Anonymous user tracking
  resume_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 of content
  
  -- File storage
  pdf_url TEXT, -- S3/Supabase Storage URL
  pdf_size_bytes INT,
  file_name VARCHAR(255),
  
  -- Extracted content
  extracted_text TEXT NOT NULL, -- Full resume text from vision API
  extracted_json JSONB, -- Structured data from vision API (optional)
  
  -- Metadata
  inferred_job_target VARCHAR(200),
  inferred_industry VARCHAR(100),
  inferred_seniority VARCHAR(50), -- 'Entry', 'Mid', 'Senior', 'Lead', 'Executive'
  inferred_years_experience INT,
  
  -- Status
  processing_status VARCHAR(50) DEFAULT 'completed', -- 'processing', 'completed', 'failed'
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_analyzed_at TIMESTAMP,
  
  -- Indexes
  INDEX idx_session_id (session_id),
  INDEX idx_resume_hash (resume_hash),
  INDEX idx_created_at (created_at),
  INDEX idx_job_target (inferred_job_target),
  INDEX idx_industry (inferred_industry)
);
```

**Why store PDFs?**
- ✅ User can re-download their resume
- ✅ Re-analyze without re-uploading
- ✅ Compare different versions
- ✅ Backup in case of issues

**Storage location:** Supabase Storage or AWS S3
- Path: `resumes/{session_id}/{resume_hash}.pdf`
- Cost: ~$0.023/GB/month (S3) or free tier (Supabase)

---

## 2. Analysis Results (Per Tab)

### `analyses` Table
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  session_id VARCHAR(64) NOT NULL,
  payment_id UUID REFERENCES payments(id), -- NULL for free tier
  
  -- Analysis type
  analysis_type VARCHAR(50) NOT NULL, -- 'quick_free', 'quick_paid', 'section', 'language', 'career', 'insights'
  tier VARCHAR(20) NOT NULL, -- 'free', 'paid'
  
  -- Results
  result JSONB NOT NULL, -- Full JSON response from analysis
  
  -- Scores (denormalized for easy querying)
  overall_score INT,
  ats_score INT,
  clarity_score INT,
  impact_score INT,
  
  -- Performance
  processing_time_ms INT,
  token_count INT, -- Tokens used for this analysis
  api_cost_cents DECIMAL(10,4), -- Actual API cost in cents
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- 'processing', 'completed', 'failed'
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_resume_id (resume_id),
  INDEX idx_session_id (session_id),
  INDEX idx_payment_id (payment_id),
  INDEX idx_analysis_type (analysis_type),
  INDEX idx_tier (tier),
  INDEX idx_created_at (created_at),
  
  -- Unique constraint: One analysis per type per resume (can re-analyze)
  UNIQUE (resume_id, analysis_type, created_at)
);
```

**Analysis types:**
- `quick_free` - Free tier quick analysis (2-3 quick wins)
- `quick_paid` - Paid tier quick analysis (4-5 quick wins + metrics)
- `section` - Section-by-section analysis
- `language` - Language & branding analysis
- `career` - Career roadmap & tailoring
- `insights` - Deep psychological insights

**Storage per analysis:** ~5-15KB JSON
- Quick: ~5KB
- Section: ~10KB
- Language: ~8KB
- Career: ~12KB
- Insights: ~15KB

**Total per full analysis:** ~50KB

---

## 3. Payment Tracking

### `payments` Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User tracking
  session_id VARCHAR(64) NOT NULL,
  resume_id UUID REFERENCES resumes(id), -- Which resume was analyzed
  
  -- Stripe data
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255), -- For future subscriptions
  
  -- Payment details
  amount_cents INT NOT NULL, -- Amount in cents (e.g., 500 = $5.00)
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL, -- 'pending', 'succeeded', 'failed', 'refunded'
  
  -- Product details
  product_type VARCHAR(50) NOT NULL, -- 'full_analysis', 'quick_analysis', 'jd_comparison'
  product_description TEXT,
  
  -- Metadata
  analyses_included JSONB, -- ["quick_paid", "section", "language", "career", "insights"]
  metadata JSONB, -- Additional Stripe metadata
  
  -- Refund tracking
  refunded_at TIMESTAMP,
  refund_reason TEXT,
  refund_amount_cents INT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_session_id (session_id),
  INDEX idx_resume_id (resume_id),
  INDEX idx_stripe_payment_intent (stripe_payment_intent_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

**Payment flow:**
1. User uploads resume → Create `resumes` record
2. User clicks "Analyze" → Create `payments` record (status: 'pending')
3. Stripe payment succeeds → Update payment (status: 'succeeded')
4. Run analyses → Create `analyses` records (linked to payment_id)
5. Return results to user

**Product types:**
- `full_analysis` - All 5 tabs ($5-10)
- `quick_analysis` - Just quick analysis ($2)
- `jd_comparison` - Compare resume to job description ($1-2)
- `section_analysis` - Just section analysis ($2)

---

## 4. Session Tracking (Anonymous Users)

### `sessions` Table
```sql
CREATE TABLE sessions (
  id VARCHAR(64) PRIMARY KEY, -- Session ID (cookie)
  
  -- Tracking
  ip_hash VARCHAR(64), -- Hashed IP for abuse prevention
  user_agent TEXT,
  
  -- Usage stats
  free_analyses_count INT DEFAULT 0,
  paid_analyses_count INT DEFAULT 0,
  total_spent_cents INT DEFAULT 0,
  
  -- Timestamps
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_ip_hash (ip_hash),
  INDEX idx_first_seen (first_seen_at),
  INDEX idx_last_seen (last_seen_at)
);
```

**Why track sessions?**
- ✅ Prevent abuse (limit free analyses per session)
- ✅ Track conversion (free → paid)
- ✅ Identify power users (for future features)
- ✅ No user accounts needed yet

---

## 5. Structural Metrics (Optional - For Benchmarking)

### `resume_metrics` Table
```sql
CREATE TABLE resume_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id), -- Which analysis generated these metrics
  
  -- Structural metrics (100% objective)
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
  
  -- Indexes
  INDEX idx_resume_id (resume_id),
  INDEX idx_analysis_id (analysis_id),
  UNIQUE (resume_id) -- One metrics record per resume
);
```

**When to populate:**
- Run `safety-metrics.ts` once per resume
- Store results for benchmarking
- Use in future "Your resume vs average" feature

---

## 6. Error Tracking

### `analysis_errors` Table
```sql
CREATE TABLE analysis_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  session_id VARCHAR(64),
  resume_id UUID REFERENCES resumes(id),
  analysis_type VARCHAR(50),
  
  -- Error details
  error_type VARCHAR(100), -- 'json_parse_error', 'rate_limit', 'timeout', 'vision_api_error'
  error_message TEXT,
  error_stack TEXT,
  
  -- Request details
  request_payload JSONB, -- For debugging
  response_payload JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_session_id (session_id),
  INDEX idx_resume_id (resume_id),
  INDEX idx_error_type (error_type),
  INDEX idx_created_at (created_at)
);
```

---

## Complete Data Flow

### 1. User Uploads Resume
```typescript
// POST /api/upload
const { file } = await request.formData();

// 1. Extract text with vision API
const extractedText = await extractTextFromPDF(file);
const resumeHash = hashResume(extractedText);

// 2. Upload PDF to storage
const pdfUrl = await uploadToStorage(file, sessionId, resumeHash);

// 3. Create resume record
const resume = await db.insert('resumes', {
  session_id: sessionId,
  resume_hash: resumeHash,
  pdf_url: pdfUrl,
  pdf_size_bytes: file.size,
  file_name: file.name,
  extracted_text: extractedText,
  processing_status: 'completed',
});

return { resumeId: resume.id, resumeHash };
```

### 2. User Pays for Analysis
```typescript
// POST /api/payment/create
const { resumeId, productType } = await request.json();

// 1. Create payment intent with Stripe
const paymentIntent = await stripe.paymentIntents.create({
  amount: 500, // $5.00
  currency: 'usd',
  metadata: { resumeId, sessionId, productType },
});

// 2. Create payment record
const payment = await db.insert('payments', {
  session_id: sessionId,
  resume_id: resumeId,
  stripe_payment_intent_id: paymentIntent.id,
  amount_cents: 500,
  status: 'pending',
  product_type: productType,
  analyses_included: ['quick_paid', 'section', 'language', 'career', 'insights'],
});

return { clientSecret: paymentIntent.client_secret, paymentId: payment.id };
```

### 3. Payment Succeeds (Webhook)
```typescript
// POST /api/webhooks/stripe
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object;
  
  // Update payment status
  await db.update('payments', {
    where: { stripe_payment_intent_id: paymentIntent.id },
    data: { status: 'succeeded', updated_at: new Date() },
  });
  
  // Trigger analysis (background job or immediate)
  await triggerAnalysis(paymentIntent.metadata.resumeId, paymentIntent.metadata.paymentId);
}
```

### 4. Run Analyses (Each Tab)
```typescript
// POST /api/analysis/quick
const { resumeId, paymentId } = await request.json();

// 1. Get resume content
const resume = await db.findOne('resumes', { id: resumeId });

// 2. Run analysis
const startTime = Date.now();
const result = await runQuickAnalysis(resume.extracted_text);

// 3. Store analysis result
await db.insert('analyses', {
  resume_id: resumeId,
  session_id: sessionId,
  payment_id: paymentId,
  analysis_type: 'quick_paid',
  tier: 'paid',
  result: result,
  overall_score: result.scores.overall,
  ats_score: result.scores.ats,
  clarity_score: result.scores.clarity,
  impact_score: result.scores.impact,
  processing_time_ms: Date.now() - startTime,
  status: 'completed',
});

return result;
```

### 5. User Views Results
```typescript
// GET /api/resume/:resumeId/analyses
const { resumeId } = params;

// Get all analyses for this resume
const analyses = await db.findMany('analyses', {
  where: { resume_id: resumeId, status: 'completed' },
  orderBy: { created_at: 'desc' },
});

// Group by analysis type (latest for each type)
const latestAnalyses = {
  quick: analyses.find(a => a.analysis_type === 'quick_paid')?.result,
  section: analyses.find(a => a.analysis_type === 'section')?.result,
  language: analyses.find(a => a.analysis_type === 'language')?.result,
  career: analyses.find(a => a.analysis_type === 'career')?.result,
  insights: analyses.find(a => a.analysis_type === 'insights')?.result,
};

return latestAnalyses;
```

---

## Storage Estimates

### Per Resume (Full Analysis)
- PDF file: ~500KB (average)
- Extracted text: ~10KB
- Quick analysis: ~5KB
- Section analysis: ~10KB
- Language analysis: ~8KB
- Career analysis: ~12KB
- Insights analysis: ~15KB
- Metrics: ~2KB

**Total per resume:** ~562KB

### Monthly Costs (1000 Resumes)
- Storage: 562KB × 1000 = 562MB
- S3 cost: ~$0.013/month
- Supabase: Free tier (up to 1GB)

**Storage is negligible!**

---

## Queries for Common Operations

### 1. Get Resume with All Analyses
```sql
SELECT 
  r.*,
  json_agg(
    json_build_object(
      'type', a.analysis_type,
      'result', a.result,
      'scores', json_build_object(
        'overall', a.overall_score,
        'ats', a.ats_score,
        'clarity', a.clarity_score,
        'impact', a.impact_score
      ),
      'created_at', a.created_at
    )
  ) as analyses
FROM resumes r
LEFT JOIN analyses a ON a.resume_id = r.id
WHERE r.id = $1
GROUP BY r.id;
```

### 2. Get User's Payment History
```sql
SELECT 
  p.*,
  r.file_name,
  r.inferred_job_target,
  COUNT(a.id) as analyses_completed
FROM payments p
LEFT JOIN resumes r ON r.id = p.resume_id
LEFT JOIN analyses a ON a.payment_id = p.id
WHERE p.session_id = $1
GROUP BY p.id, r.file_name, r.inferred_job_target
ORDER BY p.created_at DESC;
```

### 3. Get Session Usage Stats
```sql
SELECT 
  s.*,
  COUNT(DISTINCT r.id) as resumes_uploaded,
  COUNT(DISTINCT p.id) as payments_made,
  COUNT(a.id) as total_analyses
FROM sessions s
LEFT JOIN resumes r ON r.session_id = s.id
LEFT JOIN payments p ON p.session_id = s.id
LEFT JOIN analyses a ON a.session_id = s.id
WHERE s.id = $1
GROUP BY s.id;
```

### 4. Revenue Analytics
```sql
-- Daily revenue
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as payments,
  SUM(amount_cents) / 100.0 as revenue_usd,
  AVG(amount_cents) / 100.0 as avg_order_value
FROM payments
WHERE status = 'succeeded'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

### 5. Popular Analysis Types
```sql
SELECT 
  analysis_type,
  tier,
  COUNT(*) as count,
  AVG(processing_time_ms) as avg_processing_time,
  AVG(overall_score) as avg_overall_score
FROM analyses
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY analysis_type, tier
ORDER BY count DESC;
```

---

## Implementation Checklist

### Phase 1: Core Tables (Week 1)
- [ ] Create `resumes` table
- [ ] Create `analyses` table
- [ ] Create `payments` table
- [ ] Create `sessions` table
- [ ] Set up Supabase Storage for PDFs

### Phase 2: Upload Flow (Week 1)
- [ ] Implement PDF upload endpoint
- [ ] Store PDF in Supabase Storage
- [ ] Extract text with vision API
- [ ] Create resume record
- [ ] Return resumeId to frontend

### Phase 3: Payment Flow (Week 2)
- [ ] Integrate Stripe payment intent
- [ ] Create payment record on checkout
- [ ] Set up Stripe webhook
- [ ] Update payment status on success
- [ ] Handle payment failures

### Phase 4: Analysis Flow (Week 2)
- [ ] Modify all 5 analysis endpoints to accept resumeId
- [ ] Store each analysis result in `analyses` table
- [ ] Link analyses to payment_id
- [ ] Return results from database (not just API)

### Phase 5: Retrieval (Week 3)
- [ ] Implement GET /api/resume/:id/analyses
- [ ] Implement GET /api/session/history
- [ ] Cache results in frontend
- [ ] Handle re-analysis (create new analysis record)

### Phase 6: Analytics (Week 3)
- [ ] Create `resume_metrics` table
- [ ] Implement safety-metrics calculation
- [ ] Store metrics per resume
- [ ] Build analytics dashboard

### Phase 7: Error Tracking (Week 4)
- [ ] Create `analysis_errors` table
- [ ] Add error logging to all endpoints
- [ ] Build error monitoring dashboard
- [ ] Set up alerts

---

## Summary

### ✅ What This Schema Provides
- 📄 **Resume storage:** PDFs + extracted text
- 📊 **Per-tab analysis:** Each analysis stored separately
- 💳 **Payment tracking:** Full Stripe integration
- 👤 **Anonymous users:** Session-based tracking
- 📈 **Analytics:** Benchmarking data
- 🐛 **Error tracking:** Monitor failures

### ✅ Key Features
- Re-analyze without re-uploading
- View payment history
- Track usage per session
- Build benchmarks over time
- Monitor error rates

### ✅ No User Accounts Needed
- Session-based tracking
- Can add user accounts later
- All data already structured for migration

**Next step:** Implement Phase 1 (core tables) and Phase 2 (upload flow)
