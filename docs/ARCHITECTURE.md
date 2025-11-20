# Draftr - Architecture & Technical Documentation

## Overview

Draftr is a Next.js application that uses AI to extract resume data from images, allows editing, and generates professional PDF resumes with multiple templates.

## Tech Stack

### Core Framework
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Key Dependencies

#### AI & Data Extraction
- **Moonshot Kimi Vision API** (`moonshot-v1-8k-vision-preview`)
  - Reads resume images and extracts ALL data
  - Understands layout, sections, dates, bullet points
  - Returns structured JSON
  - Used in: `/lib/kimi-vision.ts`

- **Moonshot Kimi Text API** (`kimi-k2-turbo-preview`)
  - Rewrites resume content to be more professional
  - Makes content ATS-friendly
  - Used in: `/lib/kimi-api.ts`
  
- **Moonshot Kimi Analysis API** (`kimi-k2-turbo-preview`)
  - 5 comprehensive analysis buckets for resume intelligence
  - 256k context window, high-speed (60-100 tokens/sec)
  - Automatic retry with exponential backoff for rate limits
  - Used in: `/lib/resume-analysis/*.ts`

#### PDF Generation & Preview
- **@react-pdf/renderer** (v4.3.1)
  - Generates PDF from React components
  - Templates are React components that render to PDF
  - Used in: `/templates/*.tsx`, `/app/api/generate-pdf/route.ts`

- **pdfjs-dist** (v5.4.394)
  - Renders PDF to canvas for preview
  - Converts PDF to image to prevent downloading
  - Worker loaded from unpkg CDN
  - Used in: `/components/ResumePreview.tsx`

#### HTTP Client
- **axios** (v1.13.2)
  - Makes API calls to Kimi
  - Better error handling than fetch
  - Used in: `/lib/kimi-api.ts`, `/lib/kimi-vision.ts`

## Application Flow

### 1. Upload & Extraction & Quick Analysis
```
User uploads image (PNG/JPG)
    ↓
/app/api/parse-resume/route.ts
    ↓
Converts to base64
    ↓
/lib/kimi-vision.ts
    ↓
Kimi Vision API reads image
    ↓
Returns structured JSON with ALL resume data
    ↓
Displays in ResumeEditor
    ↓
Automatically runs Quick Analysis
    ↓
/app/api/analysis/quick/route.ts
    ↓
/lib/resume-analysis/quick-analysis.ts
    ↓
Displays scores & quick wins in sidebar
```

### 2. Editing
```
User edits data in ResumeEditor
    ↓
State updates in page.tsx
    ↓
Optional: Click "AI Rewrite"
    ↓
/app/api/rewrite/route.ts
    ↓
/lib/kimi-api.ts
    ↓
Kimi Text API improves content
    ↓
Updates state
```

### 3. Preview
```
User clicks "Preview & Download"
    ↓
/components/ResumePreview.tsx
    ↓
Calls /app/api/generate-preview/route.ts
    ↓
Generates PDF using @react-pdf/renderer
    ↓
Returns PDF blob
    ↓
pdfjs-dist converts PDF to canvas
    ↓
Canvas to PNG image
    ↓
Displays protected image preview
```

### 4. Full Analysis (Optional - $4.99)
```
User clicks "Full Analysis + Redesign"
    ↓
Shows FullAnalysisDashboard component
    ↓
5 analysis tabs (lazy loaded):
    ├─ Quick Analysis (already loaded)
    ├─ Section Analysis → /app/api/analysis/section/route.ts
    ├─ Language & Branding → /app/api/analysis/language/route.ts
    ├─ Career & Tailoring → /app/api/analysis/career/route.ts
    └─ Deep Insights → /app/api/analysis/insights/route.ts
    ↓
Each tab calls respective analysis module:
    ├─ /lib/resume-analysis/section-analysis.ts
    ├─ /lib/resume-analysis/language-branding.ts
    ├─ /lib/resume-analysis/career-tailoring.ts
    └─ /lib/resume-analysis/deep-insights.ts
    ↓
Results cached in component state
    ↓
User can switch tabs instantly (no re-run)
```

### 5. Payment & Download
```
User sees preview + payment screen
    ↓
Clicks "Pay & Download" (payment integration pending)
    ↓
After payment success
    ↓
Calls /app/api/generate-pdf/route.ts
    ↓
Generates final PDF
    ↓
Downloads to user's computer
```

## File Structure

```
draftr/
├── app/
│   ├── api/
│   │   ├── parse-resume/route.ts    # Extracts data from image using Kimi Vision
│   │   ├── rewrite/route.ts         # Rewrites content using Kimi Text
│   │   ├── generate-preview/route.ts # Generates preview PDF
│   │   ├── generate-pdf/route.ts    # Generates final downloadable PDF
│   │   └── analysis/                # Resume analysis API routes
│   │       ├── quick/route.ts       # Quick analysis (scores, quick wins)
│   │       ├── section/route.ts     # Section-by-section analysis
│   │       ├── language/route.ts    # Language & branding analysis
│   │       ├── career/route.ts      # Career roadmap & tailoring
│   │       └── insights/route.ts    # Deep psychological insights
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Main app page with state management
│
├── components/
│   ├── FileUpload.tsx              # Drag & drop file upload
│   ├── ResumeEditor.tsx            # Edit all resume sections
│   ├── ResumePreview.tsx           # Protected PDF preview (PDF→Image)
│   ├── TemplateSelector.tsx        # Choose template with visual previews
│   ├── QuickAnalysis.tsx           # Sidebar quick analysis display
│   └── FullAnalysisDashboard.tsx   # Full analysis with 5 tabs
│
├── lib/
│   ├── kimi-vision.ts              # Kimi Vision API client (image→JSON)
│   ├── kimi-api.ts                 # Kimi Text API client (rewriting)
│   ├── kimi-retry.ts               # Retry logic for rate limit handling
│   ├── resume-parser.ts            # Helper functions
│   └── resume-analysis/            # Resume intelligence modules
│       ├── types.ts                # TypeScript interfaces for all analyses
│       ├── quick-analysis.ts       # Bucket 0: Quick scan (scores, wins)
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
- **Input**: FormData with image file
- **Process**: Converts to base64 → Kimi Vision API
- **Output**: ResumeData JSON
- **Error**: 400 if not image, 500 if extraction fails

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

#### POST /api/analysis/quick
- **Input**: `{ resumeContent: string }`
- **Process**: Runs quick analysis (Bucket 0)
- **Output**: QuickAnalysisResult with scores, quick wins, strengths, issues
- **Features**: 
  - Overall, ATS, clarity, impact scores (0-100)
  - 4-5 prioritized quick wins
  - Inferred job target
  - Key strengths and top issues
- **Cost**: ~2,000 tokens (~$0.002)
- **Time**: 2-5 seconds (with auto-retry)

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

### PDF Generation
- Rendering is CPU-intensive
- Takes 1-3 seconds per PDF
- Consider caching for same data/template combo

### Preview Generation
- Generates PDF + converts to image
- Takes 2-4 seconds
- Only regenerates when data/template changes

### Image Upload
- Max file size: 100MB (Kimi Vision limit)
- Larger images = more tokens = higher cost
- Consider resizing images before upload

## Cost Optimization

### Kimi Vision API
- 1024 tokens per image (fixed)
- Cost: ~$0.01 per resume extraction
- Optimize: Compress images before upload

### Kimi Text API
- Variable tokens based on content length
- Cost: ~$0.001 per rewrite
- Optimize: Only rewrite when user clicks button

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
- [x] Resume image extraction (Kimi Vision)
- [x] Resume editing with all sections
- [x] AI content rewriting
- [x] 3 professional templates (Modern, Classic, Minimal)
- [x] Protected PDF preview
- [x] PDF download
- [x] Quick Analysis (Bucket 0) - automatic on upload
- [x] Section Analysis (Bucket 1) - detailed section breakdown
- [x] Language & Branding Analysis (Bucket 2) - grammar, vocabulary, branding
- [x] Career & Tailoring Analysis (Bucket 3) - career roadmap, skill gaps
- [x] Deep Insights Analysis (Bucket 4) - psychological, industry, cultural fit
- [x] Full Analysis Dashboard with 5 tabs
- [x] Automatic retry logic for rate limits
- [x] User-friendly error messaging
- [x] Result caching and lazy loading

### 🚧 In Progress
- [ ] Payment integration (Stripe) for $1.99 and $4.99 tiers
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
