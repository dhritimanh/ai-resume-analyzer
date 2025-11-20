import axios from 'axios';
import { retryWithBackoff } from '../kimi-retry';
import { queuedApiCall } from '../request-queue';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export interface QuickAnalysisFreeResult {
  scores: {
    overall: number;
    ats: number;
    clarity: number;
    impact: number;
  };
  quickWins: Array<{
    text: string;
    section: string;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  inferredJobTarget: string;
  keyStrengths: string[];
  topIssues: string[];
}

export async function runQuickAnalysisFree(resumeContent: string): Promise<QuickAnalysisFreeResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not found');
  }

  // ============================================================================
  // OPTIMIZED FREE TIER PROMPT (Hybrid Approach)
  // - System message: Rubric cached per session (10-15% token savings)
  // - User message: Compressed by 30%, kept critical examples
  // - Maintains 80/20 value strategy while reducing cost
  // ============================================================================
  
  // System message: Scoring rubric (cached, not repeated every call)
  const systemMessage = `You are a deterministic resume scorer. Output ONLY valid JSON.

SCORING RUBRIC (same input = same score ±2):
- ATS (0-100): Quantified bullets (30 pts), action verbs (20 pts), keywords (25 pts), clean format (15 pts), no typos (10 pts)
- Clarity (0-100): Concise bullets 1-2 lines (60 pts), clear headers (20 pts), overall conciseness (20 pts)
- Impact (0-100): Metrics/numbers (50 pts), result-focused language (30 pts), business impact keywords (20 pts)
- Overall: ATS×0.4 + Clarity×0.3 + Impact×0.3

FREE TIER STRATEGY: Show REAL issues using THEIR data. Be specific enough to prove value, but hold back complete solutions (80% insight, 20% held for paid).`;

  // User message: Analysis request with examples
  const prompt = `Analyze this resume and return ONLY this JSON structure:

{
  "scores": {"overall": 0-100, "ats": 0-100, "clarity": 0-100, "impact": 0-100},
  "quickWins": [{"text": "observation with their actual data", "section": "exact section name", "priority": "High|Medium|Low"}],
  "inferredJobTarget": "specific job title from experience + skills",
  "keyStrengths": ["strength with evidence", "strength 2"],
  "topIssues": ["issue with their data", "issue 2"]
}

QUICK WINS (exactly 2-3, High priority first):
- Quote THEIR actual text (10-15 words)
- Point out PROBLEM clearly
- Give 80% insight, hold back exact solution

GOOD examples:
✓ "Experience bullet 2 says 'Led team' - no team size or outcome mentioned"
✓ "'Managed projects' in Experience - lacks numbers (how many? what results?)"
✓ "3 out of 5 bullets start with weak verbs ('Responsible for', 'Helped with')"

BAD examples:
✗ "Add more metrics" (generic, no proof you read it)
✗ "Replace 'Led team' with 'Led team of 8 engineers...'" (gave full solution)

KEY STRENGTHS (exactly 2, with evidence):
- Reference THEIR content: "5 out of 6 bullets include metrics"

TOP ISSUES (exactly 2, with specific data):
- Use THEIR text: "No metrics in bullets 1, 3, 5"
- Quantify: "Weak verbs appear 4 times"

JOB TARGET: Infer from last 2 titles + skills + years. Be SPECIFIC: "Senior Product Manager" not "Manager"

Resume Content:
${resumeContent}`;

  try {
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
            max_tokens: 600,     // Reduced from 800 (empirically 430-500 needed)
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        ),
        5,
        3000,
        (attempt, delay) => {
          console.log(`Quick Analysis Free: Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/5)`);
        }
      )
    );

    const content = response.data.choices[0].message.content.trim();
    
    const { parseJsonFromLLM } = await import('../json-parser');
    const result: QuickAnalysisFreeResult = parseJsonFromLLM(content);
    
    // ============================================================================
    // POST-PROCESSING FOR CONSISTENCY
    // ============================================================================
    
    // Snap scores to 5-point grid (hides noise, users can't perceive 1-point deltas)
    const snapToGrid = (score: number): number => {
      const clamped = Math.min(100, Math.max(0, score));
      return Math.round(clamped / 5) * 5;
    };
    
    result.scores.ats = snapToGrid(result.scores.ats);
    result.scores.clarity = snapToGrid(result.scores.clarity);
    result.scores.impact = snapToGrid(result.scores.impact);
    
    // Recalculate overall with weighted formula, then snap
    const calculatedOverall = 
      result.scores.ats * 0.4 + 
      result.scores.clarity * 0.3 + 
      result.scores.impact * 0.3;
    result.scores.overall = snapToGrid(calculatedOverall);
    
    // Sort quickWins by priority for consistent order (prevents UI jitter)
    const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    result.quickWins.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Ensure exactly 2-3 quickWins, 2 strengths, 2 issues
    result.quickWins = result.quickWins.slice(0, 3);
    result.keyStrengths = result.keyStrengths.slice(0, 2);
    result.topIssues = result.topIssues.slice(0, 2);
    
    return result;
  } catch (error: any) {
    console.error('Quick Analysis Free error:', error.response?.data || error.message);
    
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
