import axios from 'axios';
import { retryWithBackoff } from '../kimi-retry';
import { queuedApiCall } from '../request-queue';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export interface QuickAnalysisResult {
  scores: {
    overall: number;
    ats: number;
    clarity: number;
    impact: number;
  };
  // Additional data pointers for paid tier
  metrics?: {
    keywordCount?: number;
    quantificationRate?: number; // % of bullets with numbers
    strongVerbRate?: number; // % of bullets with strong action verbs
    avgBulletLength?: number; // Average words per bullet
    metricsCount?: number; // Total number of metrics found
  };
  quickWins: Array<{
    text: string;
    section: string;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  inferredJobTarget: string;
  keyStrengths: string[];
  topIssues: string[];
  // Maximum value suggestion
  bestBulletTemplate?: {
    bullet: string;
    structure: string;
    applyTo: string;
  };
}

export async function runQuickAnalysis(resumeContent: string): Promise<QuickAnalysisResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not found');
  }

  // ============================================================================
  // OPTIMIZED PAID TIER PROMPT (Hybrid Approach)
  // - System message: Detailed rubric cached per session
  // - User message: Compressed by 30%, kept critical examples
  // - Emphasizes COMPLETE solutions (vs 80/20 in free tier)
  // - Adds data pointers: keyword count, quantification %, verb strength %
  // ============================================================================
  
  // System message: Comprehensive scoring rubric (cached, not repeated)
  const systemMessage = `You are a professional resume analyst. Output ONLY valid JSON.

PAID TIER STRATEGY: Deliver COMPLETE value - give exact rewrites, specific numbers, actionable solutions. This is the FULL analysis users paid for.

SCORING RUBRIC (deterministic: same input = same score ±2):

ATS Score (0-100):
- Keywords: Job-relevant terms found in resume (15+ = 100, 10-14 = 85, 5-9 = 70, <5 = 40)
- Quantification: % bullets with numbers (>60% = 100, 40-60% = 80, 20-40% = 60, <20% = 40)
- Structure: Standard section names (all standard = 100, mostly = 80, mixed = 60, confusing = 40)
- Format: ATS-friendly (no tables/columns = 100, minor issues = 80, complex = 50)
- Action Verbs: Strong verbs at bullet starts (>70% = 100, 50-70% = 80, 30-50% = 60, <30% = 40)
Formula: keywords×0.3 + quantification×0.25 + structure×0.2 + format×0.15 + verbs×0.1

Clarity Score (0-100):
- Readability: Flesch-Kincaid grade level (10-12 = 100, 8-9 or 13-14 = 85, 15-16 = 70, >16 = 50)
- Conciseness: Avg bullet length (10-15 words = 100, 16-20 = 85, 21-25 = 70, >25 = 50)
- Flow: Logical order, consistency (perfect = 100, minor gaps = 80, some confusion = 60, poor = 40)
- Grammar: Error count (0 = 100, 1-2 = 90, 3-5 = 75, 6-10 = 60, >10 = 40)
Formula: readability×0.3 + conciseness×0.25 + flow×0.25 + grammar×0.2

Impact Score (0-100):
- Quantified Results: % bullets with metrics (>70% = 100, 50-70% = 85, 30-50% = 70, <30% = 50)
- Verb Strength: Strong (spearheaded, optimized) vs weak (did, was) (>80% = 100, 60-80% = 85, 40-60% = 70, <40% = 50)
- Achievement Focus: Results vs responsibilities (>70% = 100, 50-70% = 85, 30-50% = 70, <30% = 50)
- Business Impact: Revenue, savings, efficiency mentioned (extensive = 100, some = 80, minimal = 60, none = 40)
Formula: quantified×0.35 + verb_strength×0.25 + achievement_focus×0.25 + business_impact×0.15

Overall Score: ATS×0.4 + Clarity×0.3 + Impact×0.3`;

  // User message: Analysis request with examples
  const prompt = `Analyze this resume and return ONLY this JSON:
{
  "scores": {"overall": 0-100, "ats": 0-100, "clarity": 0-100, "impact": 0-100},
  "metrics": {
    "keywordCount": number (job-relevant keywords found in resume),
    "quantificationRate": number (% of bullets with numbers, 0-100),
    "strongVerbRate": number (% of bullets with strong action verbs, 0-100),
    "avgBulletLength": number (average words per bullet),
    "metricsCount": number (total metrics/numbers found)
  },
  "quickWins": [
    {"text": "COMPLETE solution with exact rewrite", "section": "exact section", "priority": "High|Medium|Low"}
  ],
  "inferredJobTarget": "[Seniority] [Role] (e.g., Senior Software Engineer)",
  "keyStrengths": ["strength with evidence", "strength 2", "strength 3"],
  "topIssues": ["issue with location/count", "issue 2", "issue 3"],
  "bestBulletTemplate": {
    "bullet": "exact text of their strongest bullet",
    "structure": "[Verb] [scope] to [achievement], [metric] ([context]) in [timeline]",
    "applyTo": "Apply this structure to weaker bullets like: 'Worked on improving user retention' or 'Managed product roadmap'"
  }
}

QUICK WINS (exactly 4-5, High priority first):
- Give COMPLETE solutions with EXACT rewrites
- Quote their text (10-15 words) + provide full fix
- Be measurable and specific

GOOD examples (PAID tier - complete solutions):
✓ "Experience bullet 2: Change 'Led team' to 'Led team of 8 engineers, delivering 3 products worth $2.3M in 6 months'"
✓ "Experience bullet 1: Replace 'Responsible for managing' with 'Spearheaded 12-person initiative, reducing costs by 35%'"
✓ "Skills section: Add 'Python, AWS, Docker, Kubernetes, CI/CD, Git' - critical for DevOps Engineer roles"

BAD examples:
✗ "Add more metrics" (not specific, no exact fix)
✗ "Improve experience section" (vague, not actionable)

KEY STRENGTHS (exactly 3, with evidence):
- Reference THEIR content: "Strong quantification: 8 out of 10 bullets include metrics (80%)"
- Be specific: "Clear technical depth: Python, React, AWS, Docker all listed with years of experience"

TOP ISSUES (exactly 3, with location/count):
- Be precise: "No metrics in Experience bullets 1, 3, 5, 7 (4 out of 10 bullets)"
- Quantify: "Weak verbs: 'was responsible for' (3×), 'helped with' (2×), 'worked on' (4×)"

BEST BULLET TEMPLATE (new):
- Find their STRONGEST bullet (most complete: verb + scope + achievement + metric + context + timeline)
- Show WHY it works (break down the structure)
- Suggest applying this structure to 1-2 weaker bullets

JOB TARGET: Infer from last 2 titles + skills + years. Format: "[Seniority] [Role]" (e.g., "Senior Product Manager", "Mid-Level Software Engineer")

Resume Content:
${resumeContent}`;

  try {
    // Generate deterministic seed from content hash for reproducibility
    const crypto = await import('crypto');
    const contentHash = crypto.createHash('sha256').update(resumeContent).digest('hex');
    const seed = parseInt(contentHash.slice(0, 8), 16) % 10000;
    
    // Use queue to prevent concurrent requests from overwhelming rate limits
    const response = await queuedApiCall(() =>
      retryWithBackoff(
        () => axios.post(
          KIMI_API_URL,
          {
            model: 'kimi-k2-turbo-preview',
            messages: [
              {
                role: 'system',
                content: systemMessage  // Cached rubric (10-15% token savings)
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0,      // Deterministic
            top_p: 0.01,         // Further constrain randomness
            seed: seed,          // Same content → same seed → same analysis
            max_tokens: 1200,    // Reduced from 1500 (empirically 900-1100 needed)
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        ),
        5, // max retries
        3000, // initial delay (3 seconds)
        (attempt, delay) => {
          console.log(`Quick Analysis: Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/5)`);
        }
      )
    );

    const content = response.data.choices[0].message.content.trim();
    
    // Use robust JSON parser
    const { parseJsonFromLLM } = await import('../json-parser');
    const result: QuickAnalysisResult = parseJsonFromLLM(content);
    
    // ============================================================================
    // POST-PROCESSING FOR CONSISTENCY (same as free tier)
    // ============================================================================
    
    // Snap scores to 5-point grid
    const snapToGrid = (score: number): number => {
      const clamped = Math.min(100, Math.max(0, score));
      return Math.round(clamped / 5) * 5;
    };
    
    result.scores.ats = snapToGrid(result.scores.ats);
    result.scores.clarity = snapToGrid(result.scores.clarity);
    result.scores.impact = snapToGrid(result.scores.impact);
    
    // Recalculate overall with weighted formula
    const calculatedOverall = 
      result.scores.ats * 0.4 + 
      result.scores.clarity * 0.3 + 
      result.scores.impact * 0.3;
    result.scores.overall = snapToGrid(calculatedOverall);
    
    // Sort quickWins by priority for consistent order
    const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    result.quickWins.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Ensure exact counts: 4-5 quickWins, 3 strengths, 3 issues
    result.quickWins = result.quickWins.slice(0, 5);
    result.keyStrengths = result.keyStrengths.slice(0, 3);
    result.topIssues = result.topIssues.slice(0, 3);
    
    // Validate metrics if present
    if (result.metrics) {
      result.metrics.quantificationRate = Math.min(100, Math.max(0, result.metrics.quantificationRate || 0));
      result.metrics.strongVerbRate = Math.min(100, Math.max(0, result.metrics.strongVerbRate || 0));
    }
    
    return result;
  } catch (error: any) {
    console.error('Quick Analysis error:', error.response?.data || error.message);
    
    // If it's a JSON parsing error, provide helpful message
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      console.error('JSON parsing error detected. The AI response may be incomplete.');
      console.error('This is usually temporary - try again.');
    }
    
    throw new Error('Failed to analyze resume. Please try again.');
  }
}

// Helper to format score with color
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

// Helper to get score label
export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}
