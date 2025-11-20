# Draftr - Complete User Flow

## Landing Page
```
┌─────────────────────────────────────────────┐
│              DRAFTR                         │
│  AI-Powered Resume Builder & Analyzer      │
│                                             │
│  [Upload Your Resume - It's Free]          │
│                                             │
│  ✓ Instant AI extraction                   │
│  ✓ Free quick analysis                     │
│  ✓ Professional templates                  │
└─────────────────────────────────────────────┘
```

## Step 1: Upload (Free)
```
User uploads resume image (PNG/JPG)
    ↓
Kimi Vision extracts ALL data
    ↓
Shows extracted data in editor
    ↓
Automatically runs Quick Analysis (Free)
```

## Step 2: Quick Analysis Results (Free)
```
┌─────────────────────────────────────────────┐
│  Your Resume Score: 68/100                  │
│  ├─ ATS Score: 72/100                       │
│  ├─ Clarity: 65/100                         │
│  └─ Impact: 67/100                          │
│                                             │
│  Quick Wins (3):                            │
│  • Add metrics to Experience section        │
│  • Replace "responsible for" with action    │
│  • Include keywords: Python, AWS, Docker    │
│                                             │
│  Inferred Job Target: Software Engineer     │
│                                             │
│  [See Full Analysis - $9.99] [Skip]        │
└─────────────────────────────────────────────┘
```

**User Decision Point:**
- **Option 1**: Pay $9.99 for full analysis → Go to Step 3
- **Option 2**: Skip analysis → Go to Step 4 (Builder)

## Step 3: Full Analysis (After $9.99 Payment)
```
┌─────────────────────────────────────────────┐
│  [Quick] [Sections] [Language] [Career]    │
│  [Insights]                                 │
├─────────────────────────────────────────────┤
│  Section Analysis:                          │
│  • Experience: 65/100 - Lacks quantification│
│  • Education: 80/100 - Well structured      │
│  • Skills: 70/100 - Missing trending skills │
│                                             │
│  Language Analysis:                         │
│  • 12 grammar issues found                  │
│  • Weak action verbs: 45%                   │
│  • Vocabulary richness: 62/100              │
│                                             │
│  Career Roadmap:                            │
│  • Target Role 1: Senior SWE (1-2 years)    │
│  • Target Role 2: Tech Lead (2-4 years)     │
│  • Missing Skills: System Design, Leadership│
│                                             │
│  [Apply Suggestions to Resume]              │
│  [Download Analysis Report PDF]             │
└─────────────────────────────────────────────┘
```

**User Actions:**
- Review all analysis tabs
- Click "Apply Suggestions" → Auto-updates resume data
- Download analysis report as PDF (free with analysis)
- Continue to builder to redesign

## Step 4: Resume Builder (Free to Edit)
```
┌─────────────────────────────────────────────┐
│  [Modern] [Classic] [Minimal]               │
│  [Preview & Download] [Upload New]          │
├─────────────────────────────────────────────┤
│  Edit Your Resume                           │
│                                             │
│  Personal Info: [fields]                    │
│  Summary: [text] [✨ AI Rewrite]            │
│  Experience: [entries] [✨ AI Rewrite]      │
│  Education: [entries]                       │
│  Skills: [list]                             │
│                                             │
│  {If analysis was purchased:}               │
│  💡 Suggestion: Add "Led team of 5" to Exp  │
│  [Apply]                                    │
└─────────────────────────────────────────────┘
```

**User Actions:**
- Edit all sections
- Use AI rewrite (free, included)
- Add/remove/reorder entries
- Switch templates
- Click "Preview & Download"

## Step 5: Preview & Payment
```
┌──────────────────┐  ┌──────────────────────┐
│  Preview         │  │  Download Options    │
│                  │  │                      │
│  [Resume Image]  │  │  Choose Template:    │
│                  │  │  ○ Modern            │
│  Protected       │  │  ○ Classic           │
│  Watermarked     │  │  ● Minimal           │
│                  │  │                      │
│  [← Back]        │  │  Price: $4.99        │
│                  │  │                      │
│                  │  │  {If analysis paid:} │
│                  │  │  Bundle discount!    │
│                  │  │  ~~$4.99~~ $2.99     │
│                  │  │                      │
│                  │  │  [Pay & Download]    │
└──────────────────┘  └──────────────────────┘
```

**Pricing Logic:**
- No analysis: $4.99 for PDF
- With analysis: $2.99 for PDF (bundle discount)

## Step 6: Download
```
┌─────────────────────────────────────────────┐
│  🎉 Success!                                │
│                                             │
│  Your resume is ready                       │
│                                             │
│  [⬇ Download Resume PDF]                   │
│                                             │
│  {If analysis was purchased:}               │
│  [⬇ Download Analysis Report PDF]          │
│                                             │
│  [Make More Changes] [Start New Resume]    │
└─────────────────────────────────────────────┘
```

## Pricing Summary

### Individual Products
- **Quick Analysis**: FREE (always included)
- **Full Analysis**: $9.99 (one-time)
- **Resume PDF**: $4.99 (one-time)

### Bundles
- **Analysis + Resume**: $12.99 (save $2)
  - Buy analysis first: $9.99, then resume for $2.99
  - Buy together upfront: $12.99

### What's Free
- Upload & data extraction
- Quick analysis (scores + 3 quick wins)
- Resume editing
- AI rewrite for sections
- Template switching
- Preview (watermarked)

### What Costs Money
- Full analysis (5 buckets): $9.99
- PDF download: $4.99 (or $2.99 if bought analysis)

## Revenue Scenarios

### Scenario 1: Builder Only
User uploads → Skips analysis → Edits → Pays $4.99 → Downloads
**Revenue: $4.99**

### Scenario 2: Analysis Only
User uploads → Pays $9.99 → Gets insights → Manually improves resume elsewhere
**Revenue: $9.99**

### Scenario 3: Full Bundle
User uploads → Pays $9.99 → Gets insights → Applies suggestions → Pays $2.99 → Downloads
**Revenue: $12.99**

### Scenario 4: Analysis First, Builder Later
User uploads → Pays $9.99 → Reviews insights → Comes back later → Pays $2.99 → Downloads
**Revenue: $12.99** (over 2 sessions)

## Cost Analysis

### Per User Costs
- Upload & extraction: $0.01 (Kimi Vision)
- Quick analysis: $0.002 (Kimi Text)
- Full analysis: $0.015 (Kimi Text)
- AI rewrites: $0.001 each (Kimi Text)
- PDF generation: $0 (local)

**Total cost per full bundle user: ~$0.03**
**Profit per bundle: $12.96**
**Margin: 99.7%**

## Conversion Funnel

```
100 visitors
    ↓ 60% upload
60 uploads (Free quick analysis)
    ↓ 30% buy full analysis
18 full analysis purchases ($9.99 each = $179.82)
    ↓ 80% also buy PDF
14 PDF purchases ($2.99 each = $41.86)
    ↓
Total Revenue: $221.68
Total Costs: $1.80
Net Profit: $219.88
```

## UI Placement

### Main Page Layout
```
┌─────────────────────────────────────────────┐
│  [Templates] [Preview] [Upload New]         │
├──────────────────┬──────────────────────────┤
│                  │  📊 Resume Score: 68/100 │
│  Resume Editor   │  [See Full Analysis]     │
│                  │                          │
│  [Edit fields]   │  💡 Quick Wins:          │
│                  │  • Add metrics           │
│                  │  • Use action verbs      │
│                  │  • Add keywords          │
│                  │                          │
│                  │  [Apply All]             │
└──────────────────┴──────────────────────────┘
```

### Analysis Dashboard (After Payment)
```
┌─────────────────────────────────────────────┐
│  [Quick] [Sections] [Language] [Career]    │
│  [Insights]                                 │
├─────────────────────────────────────────────┤
│  {Tab content}                              │
│                                             │
│  [Apply Suggestions to Resume]              │
│  [Back to Editor]                           │
└─────────────────────────────────────────────┘
```

## Key Decision Points

### When to Show Analysis Upsell?
**Option 1**: Immediately after upload (Recommended)
- Shows value right away
- User sees their score before editing

**Option 2**: After editing
- User has invested time
- More likely to want validation

**Option 3**: Before download
- Last chance to improve
- Risk: User already satisfied

**Recommendation: Option 1** - Strike while the iron is hot

### How to Present Pricing?
**Option 1**: Show both prices upfront
- Transparent
- User chooses their path

**Option 2**: Show analysis price, mention bundle later
- Focus on analysis value
- Surprise discount for PDF

**Recommendation: Option 1** - Transparency builds trust

## Implementation Priority

### Phase 1: MVP (Week 1)
1. Add Quick Analysis (free) after upload
2. Show scores in sidebar
3. Add "Unlock Full Analysis" button
4. Create payment gate (mock for now)

### Phase 2: Full Analysis (Week 2-3)
1. Implement all 5 analysis buckets
2. Create analysis dashboard UI
3. Add "Apply Suggestions" functionality
4. Generate analysis report PDF

### Phase 3: Integration (Week 4)
1. Connect analysis to editor
2. Show suggestions inline
3. Add bundle pricing logic
4. Implement discount for combo purchase

### Phase 4: Polish (Week 5)
1. Add animations and transitions
2. Improve error handling
3. Add analytics tracking
4. A/B test pricing

## Next Steps

1. **Decide on pricing model** (Freemium recommended)
2. **Choose upsell timing** (After upload recommended)
3. **Implement Quick Analysis** (Free tier)
4. **Add payment gate** for full analysis
5. **Build analysis dashboard** UI
6. **Test conversion funnel**

What do you think? Should we go with the Freemium model?
