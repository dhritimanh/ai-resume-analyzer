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
  quickWins: Array<{
    text: string;
    section: string;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  inferredJobTarget: string;
  keyStrengths: string[];
  topIssues: string[];
}

export async function runQuickAnalysis(resumeContent: string): Promise<QuickAnalysisResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not found');
  }

  // Enhanced prompt - provides deep, actionable insights quickly
  const prompt = `You are an expert resume analyst and career coach. Analyze this resume and provide a comprehensive quick assessment in strict JSON format.

CRITICAL INSTRUCTIONS:
1. Be SPECIFIC and ACTIONABLE - no generic advice
2. Reference EXACT text from the resume in suggestions
3. Provide MEASURABLE improvements (e.g., "Add '25% increase' to line 3 of Experience")
4. Infer job target from experience, skills, and industry context
5. Score based on industry standards and ATS best practices

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
      "text": "specific actionable suggestion with exact location",
      "section": "exact section name from resume",
      "priority": "High | Medium | Low"
    }
  ],
  "inferredJobTarget": "specific job title inferred from experience and skills",
  "keyStrengths": ["specific strength with evidence", "strength 2", "strength 3"],
  "topIssues": ["specific issue with location", "issue 2", "issue 3"]
}

SCORING METHODOLOGY:

ATS Score (0-100):
- Keywords: Count industry-relevant keywords (10-15 = 100, 5-9 = 70, <5 = 40)
- Quantification: % of bullets with numbers (>60% = 100, 30-60% = 70, <30% = 40)
- Structure: Clear sections with standard names (100 = all standard, 70 = some custom, 40 = confusing)
- Formatting: Simple, parser-friendly (100 = perfect, 70 = minor issues, 40 = complex)
- Action Verbs: Strong verbs at bullet starts (>70% = 100, 40-70% = 70, <40% = 40)
Formula: (keywords*0.3 + quantification*0.25 + structure*0.2 + formatting*0.15 + verbs*0.1)

Clarity Score (0-100):
- Readability: Flesch-Kincaid level (grade 10-12 = 100, 13-15 = 80, >15 = 60)
- Conciseness: Avg bullet length (10-15 words = 100, 16-20 = 80, >20 = 60)
- Flow: Logical section order and consistency (100 = perfect, 70 = minor gaps, 40 = confusing)
- Grammar: Error count (0 = 100, 1-3 = 85, 4-6 = 70, >6 = 50)
Formula: (readability*0.3 + conciseness*0.25 + flow*0.25 + grammar*0.2)

Impact Score (0-100):
- Quantified Results: % bullets with metrics (>70% = 100, 40-70% = 75, <40% = 50)
- Action Verb Strength: Strong verbs (spearheaded, optimized) vs weak (did, was) (>80% strong = 100, 50-80% = 75, <50% = 50)
- Achievement Focus: Results vs responsibilities (>70% results = 100, 40-70% = 75, <40% = 50)
- Business Impact: Revenue, cost savings, efficiency gains mentioned (yes = 100, partial = 70, no = 40)
Formula: (quantified*0.35 + verb_strength*0.25 + achievement_focus*0.25 + business_impact*0.15)

QUICK WINS (provide exactly 4-5, ordered by priority):
Priority HIGH (immediate ATS/visibility boost):
- Add specific metrics to vague statements (e.g., "Change 'Led team' to 'Led team of 8 engineers, delivering 3 products'")
- Replace weak verbs with strong ones (e.g., "Replace 'Responsible for' with 'Spearheaded' in Experience bullet 2")
- Add missing critical keywords for the role (e.g., "Add 'Python, AWS, Docker' to Skills section")
- Fix ATS-blocking formatting (e.g., "Remove tables/columns for ATS compatibility")

Priority MEDIUM (content quality):
- Quantify achievements (e.g., "Add percentage/number to 'Improved performance' in Experience")
- Reframe responsibilities as achievements (e.g., "Change 'Managed projects' to 'Delivered 12 projects on time, under budget'")
- Add missing sections (e.g., "Add Projects section to showcase hands-on work")

Priority LOW (polish):
- Grammar/spelling fixes (e.g., "Fix 'recieve' to 'receive' in Summary")
- Consistency improvements (e.g., "Use consistent date format: 'Jan 2020' not 'January 2020'")

KEY STRENGTHS (exactly 3, with evidence):
- Be SPECIFIC: "Strong quantification in Experience: 5 out of 6 bullets include metrics"
- Reference EXACT content: "Clear technical skills: Python, React, AWS explicitly listed"
- Highlight COMPETITIVE advantages: "Unique combination of PM and technical skills"

TOP ISSUES (exactly 3, with specific locations):
- Be PRECISE: "No metrics in Experience section, bullets 1, 3, 5"
- Provide CONTEXT: "Weak action verbs: 'was responsible for' appears 4 times"
- Show IMPACT: "Missing keywords for Software Engineer role: no mention of Git, CI/CD, or Agile"

JOB TARGET INFERENCE:
- Analyze experience titles, skills, and industry
- Be SPECIFIC: "Senior Software Engineer" not just "Engineer"
- Consider career level: Entry (0-2 yrs), Mid (3-5 yrs), Senior (6-10 yrs), Lead (10+ yrs)
- Match to real job titles in the market

EXAMPLES OF EXCELLENT SUGGESTIONS:
✓ "Add '40% faster' to 'Optimized database queries' in Experience bullet 2"
✓ "Replace 'Helped with' with 'Architected' in Experience bullet 1 for stronger impact"
✓ "Add 'Scrum, Jira, Confluence' to Skills - critical for PM roles"
✗ "Improve your experience section" (too vague)
✗ "Add more details" (not actionable)
✗ "Make it better" (useless)

Resume Content:
${resumeContent}

ANALYZE NOW - Be specific, be actionable, be valuable.`;

  try {
    // Use queue to prevent concurrent requests from overwhelming rate limits
    const response = await queuedApiCall(() =>
      retryWithBackoff(
        () => axios.post(
          KIMI_API_URL,
          {
            model: 'kimi-k2-turbo-preview', // 256k context, high-speed (60-100 tokens/sec), better reasoning
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3, // Lower temperature for consistent scoring
            max_tokens: 1500, // Increased for detailed analysis
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
    
    // Validate scores are in range
    result.scores.overall = Math.min(100, Math.max(0, result.scores.overall));
    result.scores.ats = Math.min(100, Math.max(0, result.scores.ats));
    result.scores.clarity = Math.min(100, Math.max(0, result.scores.clarity));
    result.scores.impact = Math.min(100, Math.max(0, result.scores.impact));
    
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
