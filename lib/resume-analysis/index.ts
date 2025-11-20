import { runCareerTailoringAnalysis } from './career-tailoring';
import { runDeepInsightsAnalysis } from './deep-insights';
import { runLanguageBrandingAnalysis } from './language-branding';
import { runQuickAnalysis } from './quick-analysis';
import { runSectionAnalysis } from './section-analysis';

// Main orchestrator for resume analysis
export { runQuickAnalysis, type QuickAnalysisResult } from './quick-analysis';
export { runSectionAnalysis, type SectionAnalysisResult } from './section-analysis';
export { runLanguageBrandingAnalysis, type LanguageBrandingResult } from './language-branding';
export { runCareerTailoringAnalysis, type CareerTailoringResult } from './career-tailoring';
export { runDeepInsightsAnalysis, type DeepInsightsResult } from './deep-insights';

// Re-export types from types.ts for convenience
export type {
  QuickAnalysis,
  SectionAnalysis,
  LanguageBrandingAnalysis,
  CareerTailoringAnalysis,
  DeepInsightsAnalysis,
} from './types';

// Helper function to run all analyses in sequence
export async function runFullAnalysis(
  resumeContent: string,
  jobDescription?: string
) {
  // Step 1: Quick Analysis (always first)
  const quickAnalysis = await runQuickAnalysis(resumeContent);
  const inferredJobTarget = quickAnalysis.inferredJobTarget;

  // Step 2: Section Analysis
  const sectionAnalysis = await runSectionAnalysis(resumeContent, inferredJobTarget);

  // Step 3: Language & Branding Analysis
  const languageBrandingAnalysis = await runLanguageBrandingAnalysis(resumeContent, inferredJobTarget);

  // Step 4: Career & Tailoring Analysis
  const careerTailoringAnalysis = await runCareerTailoringAnalysis(
    resumeContent,
    inferredJobTarget,
    jobDescription
  );

  // Step 5: Deep Insights Analysis (uses data from previous analyses)
  const deepInsightsAnalysis = await runDeepInsightsAnalysis(
    resumeContent,
    inferredJobTarget,
    [], // skills from quick analysis if needed
    careerTailoringAnalysis.careerRoadmap.target_roles
  );

  return {
    quick: quickAnalysis,
    section: sectionAnalysis,
    languageBranding: languageBrandingAnalysis,
    careerTailoring: careerTailoringAnalysis,
    deepInsights: deepInsightsAnalysis,
  };
}
