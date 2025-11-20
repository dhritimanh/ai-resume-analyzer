# Draftr - AI Resume Redesigner

Upload your resume, redesign it with professional templates, and rewrite content using AI.

## Features

- 📄 Upload PDF or image resumes (PNG, JPG)
- 🤖 AI Vision automatically extracts ALL data (no manual entry!)
- ✏️ Edit any extracted information
- 🎨 3 professional templates (Modern, Classic, Minimal)
- ✨ AI-powered content rewriting with Moonshot Kimi
- 📥 Download redesigned resume as PDF
- 🚫 No database - everything in memory

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Add your Moonshot Kimi API key to `.env.local`:
```
KIMI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## How to Use

1. Upload your resume (PDF or image)
2. AI Vision automatically extracts ALL data
3. Review and edit any information
4. Click "AI Rewrite" to improve sections
5. Choose a template (Modern, Classic, or Minimal)
6. Download your redesigned resume

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **@react-pdf/renderer** - PDF generation from React components
- **pdfjs-dist** - PDF to image conversion for protected preview
- **Moonshot Kimi Vision API** - AI extracts data from resume images
- **Moonshot Kimi Text API** - AI rewrites content professionally
- **axios** - HTTP client for API calls

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## Templates

- **Modern**: 2-column layout with blue sidebar, skills and education on left, experience on right
- **Classic**: 1-column traditional layout, serif font, centered header
- **Minimal**: 1-column clean design, lots of whitespace, modern sans-serif

Each template is a React component that renders to PDF. See [ARCHITECTURE.md](./ARCHITECTURE.md#templates) to create custom templates.

## API Routes

- `/api/parse-resume` - Extract resume data using Kimi Vision AI (image → JSON)
- `/api/rewrite` - Rewrite content using Kimi Text AI (text → improved text)
- `/api/generate-preview` - Generate protected preview (PDF → image)
- `/api/generate-pdf` - Generate final downloadable PDF

## Key Modules

- **kimi-vision.ts** - Extracts ALL data from resume images using AI vision
- **kimi-api.ts** - Rewrites content to be professional and ATS-friendly
- **ResumeEditor.tsx** - Full editing interface with add/remove/reorder
- **ResumePreview.tsx** - Protected preview (converts PDF to image to prevent download)
- **Templates** - React components that render to PDF using @react-pdf/renderer

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete technical documentation.
