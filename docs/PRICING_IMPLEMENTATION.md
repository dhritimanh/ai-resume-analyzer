# Draftr - Pricing & Analysis Implementation

## Pricing Structure (Freemium Model)

### Free Features
- ✅ Upload resume image (PNG/JPG)
- ✅ AI extraction of all data
- ✅ **Quick Analysis** (automatic after upload)
  - Overall score (0-100)
  - ATS, Clarity, Impact scores
  - 3-5 quick wins
  - Key strengths & top issues
  - Inferred job target
- ✅ Full resume editing
- ✅ AI rewrite for sections
- ✅ Template switching
- ✅ Protected preview

### Paid Options

#### Option 1: Just Redesign - $1.99
- Professional template (Modern/Classic/Minimal)
- High-quality PDF download
- Print-ready, ATS-friendly
- Instant download

#### Option 2: Full Analysis + Redesign - $4.99 (BEST VALUE)
- Everything in Option 1
- **Full Analysis** (5 detailed buckets):
  - Section-by-section breakdown
  - Language & branding analysis
  - Career roadmap with goals
  - Deep psychological insights
  - Industry & cultural fit
- 50+ actionable suggestions
- Analysis report PDF
- Auto-apply suggestions

## Quick Analysis Details

### What It Provides (FREE)
```json
{
  "scores": {
    "overall": 68,
    "ats": 72,
    "clarity": 65,
    "impact": 67
  },
  "quickWins": [
    {
      "text": "Add metrics to 'Led team' in Experience",
      "section": "Experience",
      "priority": "High"
    }
  ],
  "inferredJobTarget": "Software Engineer",
  "keyStrengths": [
    "Strong technical skills listed",
    "Clear education section",
    "Good use of action verbs"
  ],
  "topIssues": [
    "No quantifiable achievements",
    "Missing industry keywords",
    "Passive voice overused"
  ]
}
```

### Cost Optimization
- **Token Usage**: ~800-1000 tokens per analysis
- **Cost**: ~$0.0008 per analysis
- **Response Time**: 2-3 seconds
- **Prompt**: Optimized for speed and accuracy

### Scoring Algorithm
```
overall = (ats * 0.4) + (clarity * 0.3) + (impact * 0.3)

ats = Keywords + Formatting + Structure + Metrics
clarity = Readability + Sentence structure + Flow
impact = Action verbs + Quantified achievements + Results
```

## User Flow

### 1. Upload (Free)
```
User uploads resume image
    ↓
Kimi Vision extracts data
    ↓
Shows in editor
    ↓
Automatically runs Quick Analysis (FREE)
```

### 2. Quick Analysis Display (Free)
```
┌─────────────────────────────────────┐
│  Resume Analysis                    │
│  Target Role: Software Engineer     │
├─────────────────────────────────────┤
│  Overall Score: 68/100              │
│  ├─ ATS: 72/100                     │
│  ├─ Clarity: 65/100                 │
│  └─ Impact: 67/100                  │
│                                     │
│  Quick Wins (3):                    │
│  🔴 High: Add metrics to Experience │
│  🟡 Med: Replace weak verbs         │
│  🔵 Low: Add LinkedIn profile       │
│                                     │
│  ✓ Strengths:                       │
│  • Strong technical skills          │
│  • Clear education section          │
│                                     │
│  ⚠ Top Issues:                      │
│  • No quantifiable achievements     │
│  • Missing keywords                 │
│                                     │
│  [Unlock Full Analysis - $4.99]    │
│  Or continue editing ($1.99)        │
└─────────────────────────────────────┘
```

### 3. Edit Resume (Free)
```
User edits sections
    ↓
Quick Analysis stays visible in sidebar
    ↓
Shows live scores
    ↓
User clicks "Preview & Download"
```

### 4. Payment Options
```
┌─────────────────────────────────────┐
│  Choose Your Option:                │
├─────────────────────────────────────┤
│  ○ Just Redesign - $1.99            │
│    • Professional template          │
│    • High-quality PDF               │
│    • Instant download               │
│                                     │
│  ● Full Analysis + Redesign - $4.99│
│    BEST VALUE                       │
│    • Everything above               │
│    • Detailed analysis              │
│    • Career roadmap                 │
│    • 50+ suggestions                │
│    • Analysis report PDF            │
│                                     │
│  [Pay & Download]                   │
└─────────────────────────────────────┘
```

### 5. After Payment
```
If paid $1.99:
    ↓
Download resume PDF
    ↓
Done

If paid $4.99:
    ↓
Run full analysis (5 buckets)
    ↓
Show detailed dashboard
    ↓
User reviews insights
    ↓
Optional: Apply suggestions
    ↓
Download resume PDF + analysis report
    ↓
Done
```

## Implementation Status

### ✅ Completed
- [x] Quick Analysis module (`lib/resume-analysis/quick-analysis.ts`)
- [x] Quick Analysis API route (`app/api/analysis/quick/route.ts`)
- [x] Quick Analysis UI component (`components/QuickAnalysis.tsx`)
- [x] Integration with main page (sidebar display)
- [x] Pricing options in preview screen
- [x] Resume content extraction for analysis
- [x] Score color coding and labels
- [x] Quick wins prioritization

### 🚧 To Be Implemented
- [ ] Full Analysis (5 buckets)
- [ ] Analysis dashboard UI
- [ ] Apply suggestions functionality
- [ ] Analysis report PDF generation
- [ ] Payment gateway integration (Stripe)
- [ ] Bundle discount logic
- [ ] Analytics tracking

## Files Created

```
draftr/
├── lib/
│   └── resume-analysis/
│       ├── types.ts                    # TypeScript interfaces
│       └── quick-analysis.ts           # Quick analysis logic
├── app/
│   └── api/
│       └── analysis/
│           └── quick/
│               └── route.ts            # Quick analysis endpoint
├── components/
│   └── QuickAnalysis.tsx               # Quick analysis UI
└── docs/
    ├── ANALYSIS_INTEGRATION.md         # Full analysis plan
    ├── USER_FLOW.md                    # Complete user journey
    └── PRICING_IMPLEMENTATION.md       # This file
```

## Revenue Projections

### Scenario Analysis (per 100 users)

#### Conservative (30% conversion)
```
100 uploads (free)
    ↓
30 pay for redesign
    ↓
Revenue:
- 20 x $1.99 = $39.80 (just redesign)
- 10 x $4.99 = $49.90 (full bundle)
Total: $89.70
Costs: $3.00 (Kimi API)
Profit: $86.70
```

#### Moderate (50% conversion)
```
100 uploads (free)
    ↓
50 pay for redesign
    ↓
Revenue:
- 30 x $1.99 = $59.70 (just redesign)
- 20 x $4.99 = $99.80 (full bundle)
Total: $159.50
Costs: $5.00 (Kimi API)
Profit: $154.50
```

#### Optimistic (70% conversion)
```
100 uploads (free)
    ↓
70 pay for redesign
    ↓
Revenue:
- 35 x $1.99 = $69.65 (just redesign)
- 35 x $4.99 = $174.65 (full bundle)
Total: $244.30
Costs: $7.00 (Kimi API)
Profit: $237.30
```

### Key Metrics to Track
- Upload rate
- Quick analysis completion rate
- Conversion rate (free → paid)
- Bundle selection rate ($4.99 vs $1.99)
- Average revenue per user (ARPU)
- Customer acquisition cost (CAC)
- Lifetime value (LTV)

## A/B Testing Ideas

### Test 1: Pricing
- A: $1.99 / $4.99 (current)
- B: $2.99 / $5.99
- C: $0.99 / $3.99

### Test 2: Quick Analysis Timing
- A: Immediately after upload (current)
- B: After user starts editing
- C: Before preview

### Test 3: Upsell Messaging
- A: "Unlock Full Analysis" (current)
- B: "Get Career Insights"
- C: "Boost Your Score"

### Test 4: Bundle Presentation
- A: Two options side-by-side (current)
- B: Single option with toggle
- C: Three tiers (basic/pro/premium)

## Next Steps

### Phase 1: Launch MVP (Current)
1. ✅ Quick Analysis working
2. ✅ Pricing options displayed
3. 🚧 Payment integration (Stripe)
4. 🚧 Download with payment gate

### Phase 2: Full Analysis (Week 2-3)
1. Implement 5 analysis buckets
2. Create analysis dashboard
3. Build apply suggestions feature
4. Generate analysis report PDF

### Phase 3: Optimization (Week 4)
1. Add analytics tracking
2. Implement A/B tests
3. Optimize conversion funnel
4. Add user testimonials

### Phase 4: Scale (Month 2)
1. Add more templates
2. Implement web search features
3. Add collaborative features
4. Build mobile app

## Support & Documentation

### For Users
- Quick start guide
- Video tutorials
- FAQ section
- Email support

### For Developers
- API documentation
- Architecture guide
- Deployment guide
- Testing guide

## Success Metrics

### Month 1 Goals
- 1,000 uploads
- 30% conversion rate
- $300+ revenue
- 4.5+ star rating

### Month 3 Goals
- 10,000 uploads
- 50% conversion rate
- $5,000+ revenue
- 4.8+ star rating

### Month 6 Goals
- 50,000 uploads
- 60% conversion rate
- $30,000+ revenue
- Featured on Product Hunt
