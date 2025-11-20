# Draftr - Architecture & Technical Documentation

## Overview

Draftr is a Next.js application that uses AI to extract resume data from PDFs (converted to images client-side), allows editing, provides AI-powered analysis, and generates professional PDF resumes with multiple templates.

**Key Features:**
- 📄 PDF/Image upload with client-side conversion (max 5 pages)
- 🤖 AI-powered data extraction (Kimi Vision API)
- ✏️ Resume editing with AI rewriting
- 📊 FREE tier: Quick analysis (2-3 insights)
- 💎 PAID tier: Full analysis (50+ insights across 5 categories)
- 🎨 3 professional templates (Modern, Classic, Minimal)
- 💰 Flexible pricing: $1.99 (redesign), $3.99 (analysis), $5.98 (both)

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Kimi AI API, @react-pdf/renderer, pdfjs-dist

---

## 🔑 Critical Architecture Insight

**Images are used ONLY ONCE for extraction, then everything works with TEXT:**

1. **Upload** → PDF converted to images (client-side)
2. **Extraction** → Images sent to Kimi Vision API → Returns `ResumeData` object
3. **Conversion** → `ResumeData` converted to `resumeContent` (text string)
4. **All subsequent operations** → Use `resumeContent` text, NOT images:
   - Free analysis
   - Paid analysis (all 5 buckets)
   - AI rewriting
   - Career insights
   - Language analysis

**Why this matters:**
- Vision API is expensive (~$0.01/page)
- Text API is cheap (~$0.0008-0.015 per analysis)
- Images are never stored or re-sent
- All analysis works with structured text representation

---

## Quick Navigation

- **[User Journey & Screen States](#user-journey--screen-states)** - What users see at each step
- **[Application Flow](#application-flow)** - Detailed flow diagrams for each feature
- **[Complete Data Flow Diagram](#complete-data-flow-diagram)** - Visual system architecture
- **[Function Call Map](#function-call-map)** - Which files invoke which functions
- **[File Structure](#file-structure)** - Project organization
- **[API Endpoints](#api-endpoints)** - All API routes with inputs/outputs
- **[Pricing & Monetization](#pricing--monetization-strategy)** - Business model and margins
- **[Data Structure](#data-structure)** - TypeScript interfaces
- **[Templates](#templates)** - How to create and customize templates
- **[Performance Considerations](#performance-considerations)** - Optimization tips
- **[Troubleshooting](#troubleshooting)** - Common issues and solutions

---

## Tech Stack

### Core Framework
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Key Dependencies

#### AI & Data Extraction
- **Moonshot Kimi Vision API** (`moonshot-v1-32k-vision-preview`)
  - **ONE-TIME USE**: Reads resume images and extracts ALL data on initial upload
  - Understands layout, sections, dates, bullet points
  - Returns structured ResumeData JSON
  - **Images are NEVER sent to API again after this**
  - Used in: `/lib/kimi-vision.ts`

- **Moonshot Kimi Text API** (`kimi-k2-turbo-preview`)
  - **Used for ALL subsequent operations**:
    - Resume content rewriting
    - All analysis (free and paid tiers)
    - Career insights, language analysis, etc.
  - Works with TEXT representation of resume (resumeContent string)
  - 256k context window, high-speed (60-100 tokens/sec)
  - Automatic retry with exponential backoff for rate limits
  - Used in: `/lib/kimi-api.ts`, `/lib/resume-analysis/*.ts`

#### PDF Processing & Generation
- **pdfjs-dist** (v5.4.394)
  - **Client-side PDF to Image conversion**: Converts uploaded PDF pages to PNG images before sending to server
  - **Preview rendering**: Renders generated PDF to canvas for protected preview
  - Worker loaded from unpkg CDN
  - Used in: `/lib/pdf-to-image.ts`, `/components/ResumePreview.tsx`

- **@react-pdf/renderer** (v4.3.1)
  - Generates PDF from React components
  - Templates are React components that render to PDF
  - Used in: `/templates/*.tsx`, `/app/api/generate-pdf/route.ts`

#### HTTP Client
- **axios** (v1.13.2)
  - Makes API calls to Kimi
  - Better error handling than fetch
  - Used in: `/lib/kimi-api.ts`, `/lib/kimi-vision.ts`

## Application Flow

### 1. Upload & Extraction & Quick Analysis (FREE)
```
User uploads PDF or image (PNG/JPG)
    ↓
/components/FileUpload.tsx
    ↓
IF PDF:
  ↓
  /lib/pdf-to-image.ts → pdfToMultipleImages()
  ↓
  Converts PDF pages to PNG images (max 5 pages, scale 2.0)
  ↓
  Returns array of File objects (one per page)
    ↓
ELSE (already image):
  ↓
  Use image directly
    ↓
/app/page.tsx → handleFileUpload()
    ↓
Creates FormData with file(s) + fileCount
    ↓
POST /app/api/parse-resume/route.ts
    ↓
Converts each image to base64
    ↓
/lib/kimi-vision.ts → extractResumeWithVision(imageUrls[])
    ↓
Kimi Vision API (moonshot-v1-32k-vision-preview)
    ↓
Reads all pages, extracts & merges data
    ↓
parseJsonFromLLM() → Returns ResumeData object
    ↓
route.ts → NextResponse.json(resumeData)
    ↓
/app/page.tsx receives JSON and updates state:
  - setResumeData(parsed) → Structured object for editing/templates
  - setResumeContent(formatted text) → Text string for ALL analysis calls
    ↓
**IMPORTANT: Images are ONLY used for initial extraction**
**All subsequent analysis uses resumeContent (text), NOT images**
    ↓
Displays TeaserDashboard component
    ↓
TeaserDashboard shows QuickAnalysisFree component
    ↓
POST /app/api/analysis/quick-free/route.ts
    ↓
Sends resumeContent (text string, NOT images)
    ↓
/lib/resume-analysis/quick-analysis-free.ts
    ↓
Kimi Text API (kimi-k2-turbo-preview, 800 tokens)
    ↓
Analyzes the TEXT representation of resume
    ↓
Returns: scores, 2-3 quick wins, strengths, issues
    ↓
Displays in sidebar with upsell CTA
```

### 2. Editing (Optional)
```
User clicks through to editor (from TeaserDashboard)
    ↓
/components/ResumeEditor.tsx displays
    ↓
User edits data (personal info, experience, education, skills)
    ↓
State updates in page.tsx → setResumeData()
    ↓
Optional: Click "AI Rewrite" button
    ↓
POST /app/api/rewrite/route.ts
    ↓
/lib/kimi-api.ts → rewriteContent()
    ↓
Kimi Text API (kimi-k2-turbo-preview) improves content
    ↓
Returns rewritten text
    ↓
Updates state in ResumeEditor
```

### 3. Preview & Payment ($1.99 for redesign)
```
User clicks "Unlock Redesign" from TeaserDashboard
    ↓
Shows preview + payment screen
    ↓
/components/ResumePreview.tsx
    ↓
POST /app/api/generate-preview/route.ts
    ↓
Selects template component (Modern/Classic/Minimal)
    ↓
@react-pdf/renderer → renderToBuffer()
    ↓
Returns PDF blob
    ↓
pdfjs-dist converts PDF to canvas
    ↓
Canvas to PNG image
    ↓
Displays protected image preview (watermarked)
    ↓
User clicks "Pay $1.99 & Download" (or $5.98 with analysis)
    ↓
Payment gateway (TODO: Stripe integration)
    ↓
setHasPaid(true)
    ↓
Download button enabled
```

### 4. Full Analysis (Optional - $3.99 standalone or +$3.99 with redesign)
```
User clicks "Unlock Analysis" from TeaserDashboard
    ↓
Shows payment modal (if not paid)
    ↓
User pays $3.99 (or $5.98 for analysis + redesign)
    ↓
setHasPaid(true), setShowFullAnalysis(true)
    ↓
/components/FullAnalysisDashboard.tsx displays
    ↓
5 analysis tabs (lazy loaded on click):
    ├─ Tab 0: Quick Analysis (uses cached free tier data)
    ├─ Tab 1: Section Analysis → POST /app/api/analysis/section/route.ts
    ├─ Tab 2: Language & Branding → POST /app/api/analysis/language/route.ts
    ├─ Tab 3: Career & Tailoring → POST /app/api/analysis/career/route.ts
    └─ Tab 4: Deep Insights → POST /app/api/analysis/insights/route.ts
    ↓
Each API route calls respective module:
    ├─ /lib/resume-analysis/quick-analysis.ts (paid version, more detailed)
    ├─ /lib/resume-analysis/section-analysis.ts
    ├─ /lib/resume-analysis/language-branding.ts
    ├─ /lib/resume-analysis/career-tailoring.ts
    └─ /lib/resume-analysis/deep-insights.ts
    ↓
Each module calls Kimi API with detailed prompts
    ↓
Results cached in FullAnalysisDashboard state
    ↓
User can switch tabs instantly (no re-run)
    ↓
Optional: Download analysis report PDF
```

### 5. Download
```
After payment (hasPaid = true)
    ↓
User clicks "Download Resume PDF"
    ↓
/app/page.tsx → handleDownload()
    ↓
POST /app/api/generate-pdf/route.ts
    ↓
Selects template component based on selectedTemplate
    ↓
@react-pdf/renderer → renderToBuffer()
    ↓
Returns PDF blob with download headers
    ↓
Creates download link with filename: resume-{template}.pdf
    ↓
Triggers browser download
    ↓
Cleans up blob URL
```

## File Structure

```
draftr/
├── app/
│   ├── api/
│   │   ├── parse-resume/route.ts    # Extracts data from images using Kimi Vision
│   │   ├── rewrite/route.ts         # Rewrites content using Kimi Text
│   │   ├── generate-preview/route.ts # Generates preview PDF (watermarked)
│   │   ├── generate-pdf/route.ts    # Generates final downloadable PDF
│   │   ├── generate-analysis-report/route.ts # Generates analysis report PDF
│   │   └── analysis/                # Resume analysis API routes
│   │       ├── quick-free/route.ts  # FREE tier quick analysis (2-3 wins)
│   │       ├── quick/route.ts       # PAID tier quick analysis (4-5 wins)
│   │       ├── section/route.ts     # Section-by-section analysis
│   │       ├── language/route.ts    # Language & branding analysis
│   │       ├── career/route.ts      # Career roadmap & tailoring
│   │       └── insights/route.ts    # Deep psychological insights
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Main app page with state & flow management
│
├── components/
│   ├── FileUpload.tsx              # Drag & drop PDF/image upload (converts PDF→images)
│   ├── ResumeEditor.tsx            # Edit all resume sections
│   ├── ResumePreview.tsx           # Protected PDF preview (PDF→Image)
│   ├── TemplateSelector.tsx        # Choose template with visual previews
│   ├── ProcessingAnimation.tsx     # Loading animation during extraction
│   ├── TeaserDashboard.tsx         # Post-upload dashboard with free analysis
│   ├── QuickAnalysisFree.tsx       # FREE tier quick analysis (2-3 wins)
│   ├── QuickAnalysis.tsx           # PAID tier quick analysis (4-5 wins)
│   └── FullAnalysisDashboard.tsx   # Full analysis with 5 tabs (paid)
│
├── lib/
│   ├── pdf-to-image.ts             # Client-side PDF→PNG conversion (pdfjs-dist)
│   ├── kimi-vision.ts              # Kimi Vision API client (image→JSON)
│   ├── kimi-api.ts                 # Kimi Text API client (rewriting)
│   ├── kimi-retry.ts               # Retry logic for rate limit handling
│   ├── json-parser.ts              # JSON parsing with error recovery
│   ├── request-queue.ts            # API request queuing
│   ├── resume-parser.ts            # Helper functions
│   ├── sample-data.ts              # Sample resume data
│   └── resume-analysis/            # Resume intelligence modules
│       ├── types.ts                # TypeScript interfaces for all analyses
│       ├── quick-analysis-free.ts  # FREE tier: Quick scan (2-3 wins, basic scores)
│       ├── quick-analysis.ts       # PAID tier: Detailed quick scan (4-5 wins)
│       ├── section-analysis.ts     # Bucket 1: Section breakdown
│       ├── language-branding.ts    # Bucket 2: Language & branding
│       ├── career-tailoring.ts     # Bucket 3: Career roadmap
│       ├── deep-insights.ts        # Bucket 4: Psychological insights
│       └── index.ts                # Main orchestrator
│
├── templates/
│   ├── ModernTemplate.tsx          # 2-column blue sidebar template
│   ├── ClassicTemplate.tsx         # 1-column traditional template
│   └── MinimalTemplate.tsx         # 1-column clean template
│
├── types/
│   └── resume.ts                   # TypeScript interfaces
│
└── .env.local                      # API keys (not in git)
```

## User Journey & Screen States

### 1. Landing Page (flowType = 'none', resumeData = null)
**Displayed:**
- Hero headline: "95% resumes are rejected by ATS Bots"
- FileUpload component (drag & drop)
- Social proof: "Used by 10k+ Students"
- Company logos (Google, Netflix, Spotify, Tesla)
- Link to "Use templates to build one quickly"

**User Actions:**
- Upload PDF/image → Sets flowType = 'analyze'
- Click "build" link → Sets flowType = 'build'

---

### 2. Processing State (isProcessing = true, resumeData = null)
**Displayed:**
- ProcessingAnimation component
- Full-screen loading animation
- "Extracting with AI..." message

**Background:**
- PDF converted to images (if PDF)
- Images sent to Kimi Vision API
- Resume data extracted and parsed

---

### 3. Teaser Dashboard (resumeData exists, showPreview = false, showFullAnalysis = false)
**Displayed:**
- **Left side**: Resume preview card (blurred/locked)
- **Right side**: QuickAnalysisFree component
  - Overall score (0-100) with color coding
  - ATS, Clarity, Impact scores with progress bars
  - 2-3 Quick Wins with priority badges
  - Key Strengths (2 items)
  - Top Issues (2 items)
  - Upsell CTA: "Want 50+ More Insights?"

**User Actions:**
- Click "Unlock Analysis" → Payment modal for $3.99
- Click "Unlock Redesign" → Shows preview + payment for $1.99
- Click "Edit Resume" → Shows ResumeEditor

---

### 4. Editor View (Alternative to Teaser)
**Displayed:**
- **Sticky header**: Template selector + action buttons
- **Left (2/3)**: ResumeEditor component
  - Personal info fields
  - Experience entries (add/edit/delete)
  - Education entries
  - Skills list
  - Custom sections
  - "AI Rewrite" buttons per section
- **Right (1/3)**: QuickAnalysisFree sidebar (sticky)
  - Same as teaser dashboard analysis
  - Upsell CTA

**User Actions:**
- Edit any field → Updates resumeData state
- Click "AI Rewrite" → Calls /api/rewrite
- Click "Get Full Analysis" → Payment modal
- Click "Preview & Download" → Shows preview screen

---

### 5. Preview & Payment Screen (showPreview = true)
**Displayed:**
- **Left side**: ResumePreview component
  - Watermarked PDF preview (converted to image)
  - "Back to Edit" button
- **Right side**: Payment card
  - **If flowType = 'build'**:
    - Option 1: Just Redesign ($1.99)
    - Option 2: Redesign + Full Analysis ($5.98)
  - **If flowType = 'analyze'**:
    - Full Analysis ($3.99)
    - Upsell: Add redesign for +$1.99
  - Payment button
  - Template selector below

**User Actions:**
- Select pricing option
- Click "Pay & Download" → Payment gateway (TODO)
- After payment: setHasPaid(true)
- Download button appears

---

### 6. Full Analysis Dashboard (showFullAnalysis = true, hasPaid = true)
**Displayed:**
- **Tab navigation**: 5 tabs
  - Tab 0: Quick Analysis (cached from free tier)
  - Tab 1: Section Analysis (lazy loaded)
  - Tab 2: Language & Branding (lazy loaded)
  - Tab 3: Career & Tailoring (lazy loaded)
  - Tab 4: Deep Insights (lazy loaded)
- **Active tab content**: Detailed analysis results
  - Scores, metrics, charts
  - Prioritized suggestions with examples
  - "Apply Suggestion" buttons (TODO)
- **Bottom**: "Download Analysis Report" button
- **If flowType = 'analyze'**: Upsell card for redesign (+$1.99)

**User Actions:**
- Switch tabs → Loads analysis if not cached
- Click "Download Analysis Report" → Generates PDF (TODO)
- Click "Back" → Returns to editor/teaser
- Click "Add Redesign" → Shows preview + payment

---

### 7. Post-Payment Download (hasPaid = true)
**Displayed:**
- Success message: "🎉 Payment Successful!"
- "⬇ Download Resume PDF" button (green)
- "📄 Download Analysis Report" button (if analysis purchased)
- "Make More Changes" button (returns to editor)

**User Actions:**
- Click download → Calls handleDownload()
- PDF generated and downloaded to computer

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS PDF/IMAGE                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  FileUpload.tsx      │
                  │  - Accepts PDF/image │
                  │  - If PDF: converts  │
                  │    to images (max 5) │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ page.tsx             │
                  │ handleFileUpload()   │
                  │ - Creates FormData   │
                  │ - Adds fileCount     │
                  └──────────┬───────────┘
                             │
                             ▼ POST /api/parse-resume
                  ┌──────────────────────┐
                  │ parse-resume/route.ts│
                  │ - Converts to base64 │
                  │ - Calls Kimi Vision  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ kimi-vision.ts       │
                  │ extractResumeWith    │
                  │ Vision(imageUrls[])  │
                  │ - Sends to Kimi API  │
                  │ - Merges multi-page  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Returns ResumeData   │
                  │ {personalInfo,       │
                  │  experience,         │
                  │  education, skills}  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ page.tsx             │
                  │ - setResumeData()    │
                  │ - setResumeContent() │
                  │ - Shows Teaser       │
                  └──────────┬───────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────┐    ┌───────────────────┐
    │ TeaserDashboard   │    │ User can edit     │
    │ - Shows FREE      │    │ in ResumeEditor   │
    │   quick analysis  │    │ - AI rewrite      │
    └─────────┬─────────┘    └───────────────────┘
              │
              ▼ POST /api/analysis/quick-free
    ┌───────────────────┐
    │ quick-analysis-   │
    │ free.ts           │
    │ - Kimi API call   │
    │ - 800 tokens      │
    │ - 2-3 quick wins  │
    └─────────┬─────────┘
              │
              ▼
    ┌───────────────────┐
    │ QuickAnalysisFree │
    │ - Shows scores    │
    │ - Shows 2-3 wins  │
    │ - Upsell CTA      │
    └─────────┬─────────┘
              │
    ┌─────────┴──────────────────────────────┐
    │                                        │
    ▼                                        ▼
┌─────────────────┐              ┌─────────────────┐
│ Unlock Analysis │              │ Unlock Redesign │
│ ($3.99)         │              │ ($1.99)         │
└────────┬────────┘              └────────┬────────┘
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│ Payment Modal   │              │ ResumePreview   │
│ - Stripe/Dodo   │              │ + Payment       │
│ - setHasPaid()  │              │ - Shows preview │
└────────┬────────┘              │ - Template      │
         │                       │   selector      │
         ▼                       └────────┬────────┘
┌─────────────────┐                      │
│FullAnalysis     │                      ▼
│Dashboard        │              ┌─────────────────┐
│ - 5 tabs        │              │ After payment:  │
│ - Lazy load     │              │ handleDownload()│
│ - Cache results │              │ - Generates PDF │
└─────────────────┘              │ - Downloads     │
                                 └─────────────────┘
```

## Data Structure

### ResumeData Interface
```typescript
{
  personalInfo: {
    name, email, phone, location,
    linkedin?, website?, github?, portfolio?
  },
  summary: string,
  experience: [{
    id, company, position, location,
    startDate, endDate, description[]
  }],
  education: [{
    id, school, degree, field,
    location, graduationDate
  }],
  skills: string[],
  customSections?: [{
    id, title, type: 'list'|'text'|'items',
    content: string | string[] | CustomSectionItem[]
  }]
}
```

### Custom Sections
Handles ANY additional resume sections:
- **list**: Simple bullet lists (e.g., Certifications)
- **text**: Paragraph content (e.g., Professional Summary)
- **items**: Detailed entries (e.g., Projects with title/date/description)

## API Endpoints

### Resume Processing

#### POST /api/parse-resume
- **Input**: FormData with `file0`, `file1`, ... `fileN` (images) + `fileCount`
- **Process**: 
  1. Accepts PDF or image files (PDFs already converted to images on client)
  2. Converts each image to base64 with proper MIME type
  3. Passes array of base64 image URLs to Kimi Vision API
  4. Kimi Vision extracts and merges data from all pages
- **Output**: ResumeData JSON (merged from all pages)
- **Error**: 400 if invalid file type, 500 if extraction fails
- **Note**: Multi-page PDFs are converted to multiple images client-side (max 5 pages)

#### POST /api/rewrite
- **Input**: `{ content: string, sectionType: string }`
- **Process**: Kimi Text API rewrites content
- **Output**: `{ rewrittenContent: string }`
- **Error**: 500 if API fails

#### POST /api/generate-preview
- **Input**: `{ resumeData: ResumeData, template: TemplateType }`
- **Process**: Renders template to PDF
- **Output**: PDF blob (application/pdf)
- **Error**: 400 if invalid template, 500 if generation fails

#### POST /api/generate-pdf
- **Input**: `{ resumeData: ResumeData, template: TemplateType }`
- **Process**: Same as preview but for final download
- **Output**: PDF blob with download headers
- **Error**: 400 if invalid template, 500 if generation fails

### Resume Analysis (AI Intelligence)

#### POST /api/analysis/quick-free (FREE TIER - Auto-runs on upload)
- **Input**: `{ resumeContent: string }`
- **Process**: Runs free tier quick analysis
- **Output**: QuickAnalysisFreeResult with scores, quick wins, strengths, issues
- **Features**: 
  - Overall, ATS, clarity, impact scores (0-100, snapped to 5-point grid)
  - 2-3 prioritized quick wins (80% insight, holds back exact solutions)
  - Inferred job target
  - 2 key strengths and 2 top issues
- **Strategy**: Shows real issues with user's actual data, but doesn't give complete rewrites
- **Used in**: TeaserDashboard (shown immediately after upload, no payment needed)
- **Cost**: ~600 tokens (~$0.0006)
- **Time**: 2-4 seconds (with auto-retry)
- **Model**: kimi-k2-turbo-preview
- **Optimizations**: System message caching, top_p=0.01, score snapping, consistent sorting

#### POST /api/analysis/quick (PAID TIER - Full Analysis Tab 0)
- **Input**: `{ resumeContent: string }`
- **Process**: Runs paid tier quick analysis (more detailed than free)
- **Output**: QuickAnalysisResult with enhanced scores, quick wins, strengths, issues
- **Features**: 
  - Overall, ATS, clarity, impact scores (0-100, snapped to 5-point grid)
  - 4-5 prioritized quick wins with COMPLETE solutions and exact rewrites
  - Detailed scoring breakdown with percentages
  - Inferred job target with seniority level
  - 3 key strengths (vs 2 in free) with evidence
  - 3 top issues (vs 2 in free) with specific locations
  - Additional metrics: keyword count, quantification %, verb strength %
- **Strategy**: Delivers full value - specific, measurable, actionable suggestions
- **Used in**: FullAnalysisDashboard Tab 0 (after user pays for full analysis)
- **Why separate from free**: Shows clear upgrade value, justifies $3.99 cost
- **Cost**: ~1,050 tokens (~$0.001)
- **Time**: 2-5 seconds (with auto-retry)
- **Model**: kimi-k2-turbo-preview
- **Optimizations**: System message caching, top_p=0.01, seed-based determinism, score snapping

#### POST /api/analysis/section
- **Input**: `{ resumeContent: string, inferredJobTarget: string }`
- **Process**: Runs section analysis (Bucket 1)
- **Output**: SectionAnalysisResult with per-section metrics
- **Features**:
  - Word count, readability, keyword density per section
  - Formatting & ATS compatibility analysis
  - Quantification analysis with examples
  - Priority-based suggestions with examples
- **Cost**: ~3,000 tokens (~$0.003)
- **Time**: 3-6 seconds (with auto-retry)

#### POST /api/analysis/language
- **Input**: `{ resumeContent: string, inferredJobTarget: string }`
- **Process**: Runs language & branding analysis (Bucket 2)
- **Output**: LanguageBrandingResult
- **Features**:
  - Grammar issues breakdown (subject-verb, tense, punctuation)
  - Vocabulary richness and appropriateness scores
  - Action verb usage (weak/medium/strong) with examples
  - Tone assessment
  - Personal branding scores (clarity, consistency, uniqueness, visual)
- **Cost**: ~2,500 tokens (~$0.0025)
- **Time**: 3-5 seconds (with auto-retry)

#### POST /api/analysis/career
- **Input**: `{ resumeContent: string, inferredJobTarget: string, jobDescription?: string }`
- **Process**: Runs career & tailoring analysis (Bucket 3)
- **Output**: CareerTailoringResult
- **Features**:
  - 2-6 target roles based on career stage
  - Career paths and timeframes
  - Skill gaps, missing experience, certifications
  - Job alignment scores (keyword match, skill alignment, experience relevance)
  - Action goals with status tracking
  - Life integration insights
- **Cost**: ~3,500 tokens (~$0.0035)
- **Time**: 4-7 seconds (with auto-retry)

#### POST /api/analysis/insights
- **Input**: `{ resumeContent: string, inferredJobTarget: string, skills: any[], roles: any[] }`
- **Process**: Runs deep insights analysis (Bucket 4)
- **Output**: DeepInsightsResult
- **Features**:
  - Psychological profile (work style, communication, motivation, learning)
  - Industry analysis (alignment, competitive position, trends)
  - Cultural fit assessment (values, org type alignment, adaptability)
  - Learning & development profile (education pattern, skill acquisition, gaps)
  - Network analysis (collaboration patterns, connectivity, growth strategies)
- **Cost**: ~4,000 tokens (~$0.004)
- **Time**: 5-8 seconds (with auto-retry)

**Total Full Analysis Cost**: ~15,000 tokens (~$0.015 per resume)

## Pricing & Monetization Strategy

### Free Tier (Always Available)
**What's Included:**
- Resume upload (PDF/image)
- AI data extraction (Kimi Vision)
- Resume editing
- Quick Analysis (FREE version)
  - Overall, ATS, Clarity, Impact scores
  - 2-3 Quick Wins (80% insight, no complete solutions)
  - 2 Key Strengths
  - 2 Top Issues
  - Inferred job target

**Strategy:**
- Show real value using user's actual data
- Point out specific problems
- Hold back exact solutions/rewrites
- Create desire for paid tiers

---

### Paid Tier 1: Redesign Only ($1.99)
**What's Included:**
- Everything in Free Tier
- Professional template selection (3 options)
- High-quality PDF download
- No watermark

**Target Users:**
- Users who already have good content
- Just need professional formatting
- Budget-conscious students

---

### Paid Tier 2: Full Analysis Only ($3.99)
**What's Included:**
- Everything in Free Tier
- Detailed Quick Analysis (4-5 wins)
- Section-by-section analysis
- Language & branding analysis
- Career roadmap & tailoring
- Deep psychological insights
- 50+ actionable suggestions
- Analysis report PDF (TODO)

**Target Users:**
- Users who want to improve content
- Career changers
- Job seekers targeting specific roles

---

### Paid Tier 3: Analysis + Redesign ($5.98)
**What's Included:**
- Everything from Tier 1 + Tier 2
- Complete package

**Target Users:**
- Users who want everything
- Most popular option (highest value)

---

### Upsell Strategy
**Build Flow (flowType = 'build'):**
1. User uploads → Free analysis
2. User edits → Sees preview (locked)
3. Payment screen shows:
   - Default: Just Redesign ($1.99)
   - Upsell: Add Analysis (+$3.99) = $5.98 total

**Analyze Flow (flowType = 'analyze'):**
1. User uploads → Free analysis
2. User wants more → Payment for Analysis ($3.99)
3. After analysis → Upsell: Add Redesign (+$1.99)

**Conversion Tactics:**
- Show real value in free tier (not generic advice)
- Use user's actual data in suggestions
- Create FOMO with "142 students upgraded in last hour"
- No subscription BS (one-time payment)
- Secure payment via Stripe/Dodo Payments

---

### Cost Analysis (Per Resume)
**Costs:**
- PDF extraction: ~$0.05 (5 pages × $0.01)
- Free analysis: ~$0.0008
- Full analysis: ~$0.015
- Total cost: ~$0.066 per user

**Revenue:**
- Tier 1: $1.99 → Profit: $1.92
- Tier 2: $3.99 → Profit: $3.92
- Tier 3: $5.98 → Profit: $5.91

**Margins:**
- Tier 1: 96.7%
- Tier 2: 98.3%
- Tier 3: 98.9%

---

## Environment Variables

```bash
KIMI_API_KEY=sk-your-key-here
```

Get your key from: https://platform.moonshot.cn/

## Templates

### How Templates Work
1. Templates are React components using `@react-pdf/renderer`
2. They receive `ResumeData` as props
3. Return a `<Document>` with `<Page>` components
4. Use StyleSheet for PDF-specific styling
5. Rendered to PDF buffer by `renderToBuffer()`

### Creating New Templates
1. Create new file in `/templates/YourTemplate.tsx`
2. Import from `@react-pdf/renderer`
3. Define styles with `StyleSheet.create()`
4. Export component: `export const YourTemplate: React.FC<{ data: ResumeData }>`
5. Add to switch statement in `/app/api/generate-pdf/route.ts`
6. Add to template selector in `/app/page.tsx`

### Template Styling
- Use flexbox for layout
- Colors: hex codes or named colors
- Fonts: Helvetica, Times-Roman, Courier
- Units: numbers (points), percentages (strings)
- No CSS classes - use inline styles or StyleSheet

## Resume Analysis System

### Architecture Overview
The analysis system uses 5 "buckets" of intelligence, each providing different insights:

**Bucket 0: Quick Analysis** (Always runs automatically)
- Fast overview for immediate feedback
- Runs on upload, displays in sidebar
- Provides overall scores and quick wins

**Buckets 1-4: Detailed Analysis** (Optional, $4.99)
- Lazy loaded when user clicks each tab
- Results cached in component state
- No re-run when switching tabs

### Analysis Flow
```
1. User uploads resume
   ↓
2. Quick Analysis runs automatically (Bucket 0)
   ↓
3. Sidebar shows scores & quick wins
   ↓
4. User continues editing OR clicks "Full Analysis"
   ↓
5. FullAnalysisDashboard opens with 5 tabs
   ↓
6. Quick Analysis tab shows cached results
   ↓
7. User clicks "Section Analysis" tab
   ↓
8. API call to /api/analysis/section
   ↓
9. Results displayed, cached in state
   ↓
10. User clicks other tabs → same pattern
```

### Rate Limit Handling
All analysis modules include automatic retry logic:

- **Max retries**: 5 attempts
- **Backoff strategy**: Exponential (2s → 3s → 4.5s → 6.75s → 10s)
- **User messaging**: "High demand detected. Retrying in X seconds..."
- **Auto-retry**: Completely transparent to user
- **Fallback**: Manual retry button if all attempts fail

**Why rate limits occur:**
- Kimi API has 3 concurrent request limit per organization
- Multiple users or multiple analyses can hit this limit

**How we handle it:**
- Automatic retry with exponential backoff
- User-friendly messaging during retries
- Usually succeeds within 2-6 seconds
- No additional API keys needed

See `RATE_LIMIT_HANDLING.md` for detailed documentation.

### Cost Optimization Strategies

1. **Lazy Loading**: Only runs analysis when user clicks that tab
2. **Result Caching**: Stores results in component state, no re-runs
3. **Incremental Updates**: Only re-analyze if resume content changes
4. **Automatic Retry**: Handles rate limits without user intervention

### Analysis Prompts
All prompts are preserved from the original FastAPI implementation:
- Identical scoring methodology
- Same JSON response format
- Compatible with Kimi API (model-agnostic)
- Detailed, actionable suggestions

## Security Features

### Preview Protection
1. **PDF to Image**: Preview converts PDF to PNG to prevent download
2. **Right-click disabled**: Context menu blocked
3. **No text selection**: `userSelect: 'none'`
4. **No dragging**: `draggable={false}`
5. **Watermark**: Subtle "PREVIEW" overlay
6. **Payment gate**: Only paid users get actual PDF

### API Security
- API keys stored in `.env.local` (not committed)
- Server-side only (never exposed to client)
- Rate limiting recommended for production

## Customization Guide

### Change AI Model
Edit `/lib/kimi-vision.ts` or `/lib/kimi-api.ts`:
```typescript
model: 'moonshot-v1-32k-vision-preview' // Use larger context
```

### Adjust Extraction Prompt
Edit `/lib/kimi-vision.ts` - modify the `prompt` variable to:
- Extract different sections
- Change output format
- Add specific instructions

### Modify Template Colors
Edit template files in `/templates/`:
```typescript
const styles = StyleSheet.create({
  leftColumn: {
    backgroundColor: '#your-color', // Change sidebar color
  }
});
```

### Add New Section Types
1. Update `/types/resume.ts` - add to ResumeData
2. Update `/lib/kimi-vision.ts` - add to extraction prompt
3. Update `/components/ResumeEditor.tsx` - add editor UI
4. Update templates - add rendering logic

## Performance Considerations

### PDF Upload & Conversion
- **Client-side conversion**: PDFs converted to images in browser before upload
- **Scale**: 2.0x for high quality (balance between quality and file size)
- **Max pages**: 5 pages (user prompted if more)
- **Time**: ~1-2 seconds per page for conversion
- **Benefit**: Server only receives images, no PDF processing needed server-side

### PDF Generation
- Rendering is CPU-intensive
- Takes 1-3 seconds per PDF
- Consider caching for same data/template combo

### Preview Generation
- Generates PDF + converts to image
- Takes 2-4 seconds
- Only regenerates when data/template changes

### Image Processing
- Max file size: 10MB recommended (Kimi Vision supports up to 100MB)
- Larger images = more tokens = higher cost
- Multi-page PDFs: Each page processed separately, data merged

## Cost Optimization

### Kimi Vision API (ONE-TIME COST)
- **Usage**: ONLY for initial resume extraction from images
- 1024 tokens per image (fixed)
- Cost: ~$0.01 per page
- Multi-page: 5 pages = ~$0.05 per resume extraction
- **Never called again after initial upload**
- Optimize: Convert PDFs to images client-side, limit to 5 pages

### Kimi Text API (ONGOING COSTS)
All subsequent operations use TEXT API with resumeContent string:

**Analysis:**
- **Free tier**: ~800 tokens (~$0.0008 per resume)
- **Paid tier quick**: ~2,000 tokens (~$0.002 per resume)
- **Full analysis**: ~15,000 tokens total (~$0.015 per resume)
- Optimize: Lazy load analysis tabs, cache results

**Rewriting:**
- Variable tokens based on content length
- Cost: ~$0.001 per rewrite
- Optimize: Only rewrite when user clicks button

**Key Insight**: Images are expensive (Vision API), so we extract once and work with text thereafter. This dramatically reduces costs for analysis and rewriting.

## Function Call Map

### File Upload Flow
```
FileUpload.tsx
  └─ handleFileChange() / handleDrop()
      └─ processFile(file)
          ├─ IF PDF:
          │   ├─ getPdfPageCount(file) → lib/pdf-to-image.ts
          │   └─ pdfToMultipleImages(file, 5) → lib/pdf-to-image.ts
          │       └─ Returns File[] (PNG images)
          └─ onUpload(files) → passed to page.tsx
              └─ handleFileUpload(fileOrFiles)
```

### Resume Parsing Flow
```
page.tsx → handleFileUpload(fileOrFiles)
  └─ Creates FormData with file0, file1, ..., fileCount
  └─ POST /api/parse-resume
      └─ parse-resume/route.ts
          ├─ Converts each file to base64
          ├─ Creates imageUrls[] array
          └─ extractResumeWithVision(imageUrls) → lib/kimi-vision.ts
              ├─ Builds prompt with multi-page instructions
              ├─ Calls Kimi Vision API (moonshot-v1-32k-vision-preview)
              ├─ parseJsonFromLLM(response) → lib/json-parser.ts
              └─ Returns ResumeData (typed object)
          └─ NextResponse.json(resumeData)
  └─ page.tsx receives response:
      ├─ setResumeData(parsed) → Stores structured object
      └─ setResumeContent(formatted text) → Converts to text string
          └─ Format: "RESUME CONTENT\n\nPersonal Information:\nName: ...\n\nWork Experience:\n..."
          └─ This text is used by ALL analysis calls (never images again)
```

### Free Analysis Flow
```
TeaserDashboard.tsx
  └─ Renders QuickAnalysisFree component
      └─ QuickAnalysisFree.tsx
          └─ useEffect() → analyzeResume()
              └─ POST /api/analysis/quick-free
                  └─ Body: { resumeContent: string } ← TEXT, not images!
                  └─ quick-free/route.ts
                      └─ runQuickAnalysisFree(resumeContent) → lib/resume-analysis/quick-analysis-free.ts
                          ├─ Builds FREE tier prompt (80% value)
                          ├─ Prompt includes: resumeContent (text string)
                          ├─ queuedApiCall() → lib/request-queue.ts
                          │   └─ retryWithBackoff() → lib/kimi-retry.ts
                          │       └─ Kimi TEXT API call (kimi-k2-turbo-preview, 800 tokens)
                          │           └─ Analyzes TEXT, not images
                          ├─ parseJsonFromLLM(response) → lib/json-parser.ts
                          └─ Returns QuickAnalysisFreeResult
                              └─ Displays: scores, 2-3 wins, strengths, issues
```

### Full Analysis Flow (Paid)
```
FullAnalysisDashboard.tsx
  └─ User clicks tab (e.g., "Section Analysis")
      └─ loadSectionAnalysis()
          └─ POST /api/analysis/section
              └─ Body: { resumeContent: string, inferredJobTarget: string } ← TEXT!
              └─ section/route.ts
                  └─ runSectionAnalysis(resumeContent, jobTarget) → lib/resume-analysis/section-analysis.ts
                      ├─ Builds detailed prompt with resumeContent (text)
                      ├─ queuedApiCall() → retryWithBackoff()
                      │   └─ Kimi TEXT API call (kimi-k2-turbo-preview, ~3000 tokens)
                      │       └─ Analyzes TEXT representation, not images
                      ├─ parseJsonFromLLM(response)
                      └─ Returns SectionAnalysisResult
                          └─ Cached in component state
                          └─ Displays: per-section metrics, suggestions, examples
```

### Preview & Download Flow
```
page.tsx → User clicks "Unlock Redesign"
  └─ setShowPreview(true)
      └─ ResumePreview.tsx
          └─ useEffect() → generatePreview()
              └─ POST /api/generate-preview
                  └─ generate-preview/route.ts
                      ├─ Selects template (Modern/Classic/Minimal)
                      ├─ renderToBuffer(<Template data={resumeData} />)
                      └─ Returns PDF blob
              └─ pdfjs-dist converts PDF to canvas
              └─ canvas.toDataURL() → PNG image
              └─ Displays watermarked preview

page.tsx → User pays → handleDownload()
  └─ POST /api/generate-pdf
      └─ generate-pdf/route.ts
          ├─ Selects template
          ├─ renderToBuffer(<Template data={resumeData} />)
          └─ Returns PDF blob with download headers
  └─ Creates download link
  └─ Triggers browser download
```

### AI Rewrite Flow
```
ResumeEditor.tsx → User clicks "AI Rewrite"
  └─ handleRewrite(content, sectionType)
      └─ POST /api/rewrite
          └─ rewrite/route.ts
              └─ rewriteContent(content, sectionType) → lib/kimi-api.ts
                  ├─ Builds rewrite prompt
                  ├─ Kimi API call (kimi-k2-turbo-preview)
                  └─ Returns rewritten text
      └─ Updates local state
```

## Troubleshooting

### "Invalid Authentication"
- Check KIMI_API_KEY in .env.local
- Restart dev server after adding key
- Verify key is valid at platform.moonshot.cn

### "Failed to extract resume data"
- Ensure image is clear and readable
- Check image format (PNG/JPG only)
- Try with simpler resume layout

### Preview not loading
- Check browser console for errors
- Verify pdfjs-dist worker URL is accessible
- Try clearing browser cache

### PDF download issues
- Check Content-Type headers
- Verify blob creation
- Test in different browser

## Implementation Status

### ✅ Completed Features
- [x] PDF upload with client-side conversion to images (max 5 pages)
- [x] Image upload (PNG/JPG)
- [x] Resume data extraction (Kimi Vision, multi-page support)
- [x] Resume editing with all sections
- [x] AI content rewriting
- [x] 3 professional templates (Modern, Classic, Minimal)
- [x] Protected PDF preview (watermarked)
- [x] PDF download
- [x] FREE tier: Quick Analysis - automatic on upload (2-3 wins)
- [x] PAID tier: Quick Analysis - detailed (4-5 wins)
- [x] Section Analysis (Bucket 1) - detailed section breakdown
- [x] Language & Branding Analysis (Bucket 2) - grammar, vocabulary, branding
- [x] Career & Tailoring Analysis (Bucket 3) - career roadmap, skill gaps
- [x] Deep Insights Analysis (Bucket 4) - psychological, industry, cultural fit
- [x] Full Analysis Dashboard with 5 tabs
- [x] Automatic retry logic for rate limits
- [x] User-friendly error messaging
- [x] Result caching and lazy loading
- [x] TeaserDashboard with free analysis preview
- [x] Two-flow system: "Analyze" vs "Build" paths
- [x] Pricing tiers: $1.99 (redesign), $3.99 (analysis), $5.98 (both)

### 🚧 In Progress
- [ ] Payment integration (Stripe/Dodo Payments) for pricing tiers
- [ ] Analysis report PDF export
- [ ] "Apply Suggestion" buttons to auto-update resume

### 📋 Planned Features
- [ ] Web search for skills suggestions
- [ ] Multiple resume versions
- [ ] Export to DOCX
- [ ] More templates
- [ ] Collaborative editing
- [ ] Historical tracking of improvements
- [ ] Industry benchmarks
- [ ] Job matching based on analysis

### 💡 Potential Improvements
- Cache generated PDFs
- Add undo/redo for editing
- Real-time collaboration
- Template marketplace
- A/B testing for templates
- Real-time analysis as user types
- Comparison mode (before/after)

## Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Add New Dependency
```bash
npm install package-name
```

### Environment Setup
1. Copy `.env.local.example` to `.env.local`
2. Add your KIMI_API_KEY
3. Restart dev server

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in console
3. Check Kimi API status
4. Verify environment variables
