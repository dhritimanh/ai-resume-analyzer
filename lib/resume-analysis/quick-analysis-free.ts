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

  // FREE TIER PROMPT - Give 80% value, hold back 20% for paid
  const prompt = `You are an expert resume analyst. Analyze this resume and provide a FREE quick assessment that demonstrates your expertise while leaving room for the paid deep-dive.

STRATEGY: Show them you found REAL issues in THEIR resume using THEIR data. Be specific enough to prove value, but hold back the complete solution.

Return ONLY this JSON structure (no markdown, no explanations):
{
  "scores": {
    "overall": number (0-100, weighted: ats*0.4 + clarity*0.3 + impact*0.3),
    "ats": number (0-100, ATS compatibility score),
    "clarity": number (0-100, readability and structure),
    "impact": number (0-100, achievement strength)
  },
  "quickWins": [
    {
      "text": "specific observation pointing to the issue with their actual data",
      "section": "exact section name from resume",
      "priority": "High | Medium | Low"
    }
  ],
  "inferredJobTarget": "specific job title inferred from experience and skills",
  "keyStrengths": ["specific strength with evidence from their resume", "strength 2"],
  "topIssues": ["specific issue with their actual data", "issue 2"]
}

SCORING (same methodology as full version):
- ATS Score: Keywords, quantification, structure, formatting, action verbs
- Clarity Score: Readability, conciseness, flow, grammar
- Impact Score: Quantified results, verb strength, achievement focus, business impact

QUICK WINS (provide exactly 2-3, ordered by priority):
- Use THEIR actual text/data from the resume
- Point out the PROBLEM clearly
- Give 80% of the insight (enough to be helpful)
- Hold back 20% (the exact rewrite/solution)

EXAMPLES OF GOOD FREE-TIER SUGGESTIONS:

✓ "Experience bullet 2 says 'Led team' - no team size or outcome mentioned"
  → Shows the problem, references their text, but doesn't give the full rewrite

✓ "'Managed projects' in Experience section - lacks numbers (how many? what results?)"
  → Points to vague language, asks the right questions, but doesn't solve it

✓ "Skills section missing key tools for [job target]: no mention of [specific tools]"
  → Identifies the gap with specifics, but doesn't list all missing keywords

✓ "3 out of 5 experience bullets start with weak verbs ('Responsible for', 'Helped with')"
  → Quantifies the issue, shows you analyzed it, but doesn't rewrite them all

BAD EXAMPLES (too generic or too complete):

✗ "Add more metrics to your experience" (generic, no proof you read it)
✗ "Replace 'Led team' with 'Led team of 8 engineers, delivering 3 products worth $2.3M'" (gave away the full solution)
✗ "Improve your resume" (useless)

KEY STRENGTHS (exactly 2, with evidence):
- Reference THEIR actual content
- Be specific: "5 out of 6 bullets in Experience include metrics"
- Show you analyzed their unique profile

TOP ISSUES (exactly 2, with specific data):
- Use THEIR text: "No metrics in Experience bullets 1, 3, 5"
- Quantify when possible: "Weak action verbs appear 4 times"
- Be precise enough to verify immediately

JOB TARGET INFERENCE:
- Analyze their experience titles, skills, industry
- Be SPECIFIC: "Senior Product Manager" not just "Manager"
- Consider career level based on years

Resume Content:
${resumeContent}

REMEMBER: Give them 80% - enough to see you're legit and get some value, but make them want the remaining 20% (exact fixes, more insights, detailed rewrites).`;

  try {
    const response = await queuedApiCall(() =>
      retryWithBackoff(
        () => axios.post(
          KIMI_API_URL,
          {
            model: 'kimi-k2-turbo-preview',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 800, // Reduced from 1500 - shorter response
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
    
    // Validate scores are in range
    result.scores.overall = Math.min(100, Math.max(0, result.scores.overall));
    result.scores.ats = Math.min(100, Math.max(0, result.scores.ats));
    result.scores.clarity = Math.min(100, Math.max(0, result.scores.clarity));
    result.scores.impact = Math.min(100, Math.max(0, result.scores.impact));
    
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
