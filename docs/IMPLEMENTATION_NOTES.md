# Landing Page Update - Implementation Notes

## Changes Made

### 1. Unified Landing Page with Two CTAs
- Created a new landing page that presents two clear options:
  - **Analyze My Resume** ($3.99) - Analysis-first flow
  - **Redesign Resume** ($1.99) - Building-first flow
- Both CTAs are prominently displayed with clear value propositions

### 2. Flow Management
- Added `flowType` state to track which flow the user selected ('analyze' or 'build')
- Flow selection happens before file upload
- Each flow has its own optimized path and upsell strategy

### 3. Analysis Flow (analyze)
- User uploads resume
- Gets free quick analysis preview (existing QuickAnalysis component)
- Can purchase full analysis for $3.99
- After analysis, can add redesign for +$1.99 (upsell)

### 4. Building Flow (build)
- User uploads resume
- Chooses template and edits content
- Gets free quick analysis in sidebar
- Can purchase just redesign for $1.99
- Can add full analysis for +$3.99 (upsell to $5.98 total)

### 5. Pricing Strategy
- **Analysis-first**: $3.99 → +$1.99 for redesign
- **Build-first**: $1.99 → +$3.99 for analysis
- Both paths lead to same total if user wants both features

### 6. Existing Components Preserved
- All existing components remain functional:
  - FileUpload
  - ResumeEditor
  - TemplateSelector
  - ResumePreview
  - QuickAnalysis
  - FullAnalysisDashboard
- No duplicate code created
- All API routes remain unchanged

### 7. User Experience Improvements
- Clear value proposition on landing page
- Separate flows reduce decision fatigue
- Free previews in both flows (quick analysis)
- Natural upsell paths based on initial choice
- Easy navigation with "Start Over" button

## Routes Structure
- `/` - Unified landing page with two CTAs
- After flow selection, same page shows file upload
- After upload, shows editor with analysis sidebar
- Payment and download flows remain the same

## Next Steps for Full Implementation
1. Integrate payment gateway (Stripe)
2. Add analytics tracking for conversion optimization
3. Consider A/B testing different pricing strategies
4. Add testimonials and social proof to landing page
5. Create separate landing pages for ads:
   - `/analyze` - Analysis-focused landing
   - `/build` - Building-focused landing

## Technical Notes
- No breaking changes to existing functionality
- TypeScript types maintained
- All existing API endpoints work as before
- Responsive design maintained
- Accessibility preserved
