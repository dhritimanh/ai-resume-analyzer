# Complete User Flow - Draftr

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    1. LANDING PAGE                          │
│                                                             │
│                      [Upload Resume]                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              2. UPLOAD & EXTRACTION (FREE)                  │
│                                                             │
│  • User uploads image (PNG/JPG)                            │
│  • Kimi Vision extracts ALL data                           │
│  • Quick Analysis runs automatically (FREE)                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              3. RESUME EDITOR (FREE)                        │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │  Resume Editor   │  │  Quick Analysis (Sidebar)    │   │
│  │                  │  │  • Overall Score: 68/100     │   │
│  │  • Personal Info │  │  • ATS: 72/100               │   │
│  │  • Summary       │  │  • Clarity: 65/100           │   │
│  │  • Experience    │  │  • Impact: 67/100            │   │
│  │  • Education     │  │                              │   │
│  │  • Skills        │  │  Quick Wins (3):             │   │
│  │                  │  │  • Add metrics               │   │
│  │  [AI Rewrite]    │  │  • Use action verbs          │   │
│  │                  │  │  • Add keywords              │   │
│  │                  │  │                              │   │
│  │                  │  │  [Unlock Full Analysis]      │   │
│  │                  │  │  $4.99                       │   │
│  └──────────────────┘  └──────────────────────────────┘   │
│                                                             │
│              [Preview & Download]                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              4. PREVIEW & PRICING                           │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │  Resume Preview  │  │  Choose Your Option:         │   │
│  │  (Protected)     │  │                              │   │
│  │                  │  │  ○ Just Redesign - $1.99     │   │
│  │  [Watermarked]   │  │    • Professional template   │   │
│  │                  │  │    • High-quality PDF        │   │
│  │                  │  │    • Instant download        │   │
│  │                  │  │                              │   │
│  │                  │  │  ● Full Analysis - $4.99     │   │
│  │                  │  │    BEST VALUE                │   │
│  │                  │  │    • Everything above        │   │
│  │                  │  │    • Detailed analysis       │   │
│  │                  │  │    • Career roadmap          │   │
│  │                  │  │    • 50+ suggestions         │   │
│  │                  │  │    • Analysis report PDF     │   │
│  │                  │  │                              │   │
│  │                  │  │  [Pay & Proceed]             │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │                   │
              $1.99 │                   │ $4.99
                    ↓                   ↓
┌──────────────────────────┐  ┌──────────────────────────────┐
│  5A. JUST DOWNLOAD       │  │  5B. FULL ANALYSIS           │
│                          │  │                              │
│  • Generate PDF          │  │  • Run 5 analysis buckets    │
│  • Download immediately  │  │  • Show detailed dashboard   │
│  • Done!                 │  │  • Generate analysis report  │
└──────────────────────────┘  └──────────────────────────────┘
                                            ↓
                              ┌─────────────────────────────┐
                              │  6. ANALYSIS DASHBOARD      │
                              │                             │
                              │  ┌────────────┐ ┌─────────┐│
                              │  │ Analysis   │ │ Resume  ││
                              │  │ Results    │ │ Editor  ││
                              │  │            │ │         ││
                              │  │ • Section  │ │ • Edit  ││
                              │  │ • Language │ │ • Apply ││
                              │  │ • Career   │ │ • Review││
                              │  │ • Insights │ │         ││
                              │  │            │ │         ││
                              │  │ [Download  │ │ [Preview││
                              │  │  Report]   │ │  Resume]││
                              │  └────────────┘ └─────────┘│
                              └─────────────────────────────┘
                                            ↓
                              ┌─────────────────────────────┐
                              │  7. FINAL DOWNLOAD          │
                              │                             │
                              │  • Download Resume PDF      │
                              │  • Download Analysis Report │
                              │  • Done!                    │
                              └─────────────────────────────┘
```

## Detailed Flow Breakdown

### Step 1: Landing Page
**State**: No resume uploaded
**Actions**: 
- User sees upload area
- Drag & drop or click to select image

### Step 2: Upload & Extraction (FREE)
**State**: `resumeData` populated, `resumeContent` stored
**Process**:
1. Image uploaded to `/api/parse-resume`
2. Kimi Vision extracts all data
3. Quick Analysis runs automatically
4. Shows in editor with sidebar

**Cost**: ~$0.001 (Vision) + $0.002 (Quick Analysis) = $0.003

### Step 3: Resume Editor (FREE)
**State**: `showPreview = false`, editing mode
**Features**:
- Full editing of all sections
- AI rewrite buttons (free)
- Quick Analysis visible in sidebar
- Template selector in sticky header
- "Preview & Download" button

**User Actions**:
- Edit any field
- Click AI rewrite
- Add/remove/reorder entries
- Switch templates
- Click "Preview & Download"

### Step 4: Preview & Pricing
**State**: `showPreview = true`
**Display**:
- Left: Protected preview (PDF → Image, watermarked)
- Right: Pricing options

**Pricing Options**:
```typescript
Option 1: Just Redesign - $1.99
- hasFullAnalysis = false
- Action: Download PDF immediately

Option 2: Full Analysis + Redesign - $4.99
- hasFullAnalysis = true
- Action: Run full analysis first
```

**User Decision Point**: Choose $1.99 or $4.99

### Step 5A: Just Download ($1.99)
**State**: `hasPaid = true`, `hasFullAnalysis = false`
**Process**:
1. Payment processed (mock for now)
2. Generate PDF via `/api/generate-pdf`
3. Download starts immediately
4. Done!

**Flow**: Upload → Edit → Pay $1.99 → Download → Done

### Step 5B: Full Analysis ($4.99)
**State**: `hasFullAnalysis = true`, `showFullAnalysis = true`
**Process**:
1. Payment processed (mock for now)
2. Run full analysis (5 buckets):
   - Section Analysis
   - Language & Branding
   - Career Roadmap
   - Deep Insights
   - Generate report
3. Show analysis dashboard
4. User reviews insights
5. User edits resume based on suggestions
6. Download resume + analysis report

**Flow**: Upload → Edit → Pay $4.99 → Analyze → Review → Edit → Download → Done

### Step 6: Analysis Dashboard (Only for $4.99)
**State**: `showFullAnalysis = true`
**Layout**: Two columns

**Left Column - Analysis Results**:
- Section Analysis card
- Language & Branding card
- Career Roadmap card
- Deep Insights card
- [Download Analysis Report PDF] button

**Right Column - Resume Editor**:
- Mini editor (name, summary, key fields)
- Template selector
- [Preview & Download Resume] button

**User Actions**:
- Review analysis insights
- Download analysis report
- Edit resume based on suggestions
- Switch templates
- Preview final resume
- Download resume PDF

### Step 7: Final Download
**State**: `hasPaid = true`
**Downloads**:
- Resume PDF (always)
- Analysis Report PDF (only if $4.99)

**Options**:
- Make more changes
- Start new resume

## State Management

```typescript
// Core States
resumeData: ResumeData | null          // Extracted resume data
resumeContent: string                   // Text for analysis
selectedTemplate: TemplateType          // Modern/Classic/Minimal

// Flow States
showPreview: boolean                    // Show preview screen
showFullAnalysis: boolean               // Show analysis dashboard
hasPaid: boolean                        // Payment completed
hasFullAnalysis: boolean                // User selected $4.99

// Processing States
isProcessing: boolean                   // Loading state
fullAnalysisData: any | null           // Full analysis results
```

## State Transitions

```
Initial: 
  resumeData = null

After Upload:
  resumeData = {...}
  resumeContent = "..."

Click "Preview & Download":
  showPreview = true

Select $1.99 & Pay:
  hasPaid = true
  → Download immediately

Select $4.99 & Pay:
  hasFullAnalysis = true
  isProcessing = true
  → Run analysis
  → fullAnalysisData = {...}
  → showFullAnalysis = true
  → showPreview = false

From Analysis Dashboard:
  Click "Preview & Download Resume"
  → showPreview = true
  → hasPaid = true (already paid)
  → Download

Click "Back to Editor":
  showPreview = false
  showFullAnalysis = false
  → Return to editing
```

## API Calls

### Free Tier
1. `/api/parse-resume` - Extract data from image
2. `/api/analysis/quick` - Quick analysis (auto)
3. `/api/rewrite` - Rewrite sections (on demand)
4. `/api/generate-preview` - Protected preview

### Paid ($1.99)
5. `/api/generate-pdf` - Final PDF download

### Paid ($4.99)
5. `/api/analysis/section` - Section analysis
6. `/api/analysis/language` - Language & branding
7. `/api/analysis/career` - Career roadmap
8. `/api/analysis/insights` - Deep insights
9. `/api/generate-analysis-report` - Analysis PDF
10. `/api/generate-pdf` - Resume PDF

## Implementation Status

### ✅ Completed
- [x] Upload & extraction
- [x] Quick analysis (free)
- [x] Resume editor
- [x] Template selector
- [x] Protected preview
- [x] Pricing options UI
- [x] $1.99 flow (download only)
- [x] $4.99 flow (triggers analysis)
- [x] Analysis dashboard UI (placeholder)
- [x] State management for both flows

### 🚧 To Implement
- [ ] Full analysis (5 buckets)
- [ ] Analysis dashboard (real data)
- [ ] Analysis report PDF generation
- [ ] Payment gateway integration
- [ ] Apply suggestions functionality
- [ ] Download analysis report

### 📋 Next Steps
1. Implement full analysis buckets (Section, Language, Career, Insights)
2. Create analysis dashboard components
3. Build analysis report PDF generator
4. Integrate payment gateway (Stripe)
5. Add "Apply Suggestion" buttons
6. Test complete flow end-to-end

## User Experience Goals

### For $1.99 Users
- **Fast**: Upload → Edit → Pay → Download (< 2 minutes)
- **Simple**: No complexity, just redesign
- **Value**: Professional resume for $1.99

### For $4.99 Users
- **Comprehensive**: Deep insights and analysis
- **Actionable**: Specific suggestions to apply
- **Educational**: Learn what makes a great resume
- **Value**: Analysis + redesign for $4.99

## Success Metrics

### Conversion Funnel
```
100 uploads (free)
    ↓ 80% complete editing
80 reach preview
    ↓ 50% pay
40 conversions
    ├─ 25 pay $1.99 = $49.75
    └─ 15 pay $4.99 = $74.85
Total Revenue: $124.60
Total Cost: $3.20
Net Profit: $121.40
```

### Key Metrics
- Time to first preview: < 3 minutes
- Quick analysis load time: < 3 seconds
- Full analysis time: < 30 seconds
- PDF generation time: < 5 seconds
- User satisfaction: > 4.5/5 stars

## Error Handling

### Upload Fails
- Show error message
- Allow retry
- Suggest image quality tips

### Analysis Fails
- Show error message
- Offer partial refund
- Allow manual editing

### Download Fails
- Retry automatically
- Show download link
- Email PDF as backup

## Future Enhancements

1. **Real-time Analysis**: Analyze as user types
2. **Comparison Mode**: Before/after comparison
3. **Multiple Versions**: Save different versions
4. **Collaboration**: Share with mentors
5. **Job Matching**: Match resume to jobs
6. **Cover Letter**: Generate matching cover letter
7. **LinkedIn Optimization**: Optimize LinkedIn profile
8. **Interview Prep**: Generate interview questions
