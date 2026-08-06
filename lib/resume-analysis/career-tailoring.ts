import axios from 'axios';
import { retryWithBackoff } from '../kimi-retry';
import { queuedApiCall } from '../request-queue';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export interface CareerTailoringResult {
  careerRoadmap: {
    target_roles: Array<{
      role_name: string;
      timeframe: string;
      description: string;
      justification: string;
      priority: number;
      career_path: string[];
      metrics: {
        skill_match_percentage: number;
        experience_relevance_score: number;
        growth_potential_score: number;
      };
      gaps: {
        missing_skills: string[];
        missing_experience: string[];
        suggested_certifications: string[];
      };
      goals: Array<{
        title: string;
        status: 'not_started' | 'in_progress' | 'completed';
        category: string;
        completed: boolean;
        impact_score: number;
        deadline: string;
        priority: string;
      }>;
    }>;
    life_integration: string;
  };
  tailoringAnalysis: {
    job_target: string;
    metrics: {
      keyword_match_score: {
        score: number;
        max: 100;
        reason: string;
      };
      skill_alignment_score: {
        score: number;
        max: 100;
        reason: string;
      };
      experience_relevance_score: {
        score: number;
        max: 100;
        reason: string;
      };
    };
    feedback: string;
    suggestions: string[];
  };
  // Career narrative analysis (new)
  careerNarrative?: {
    progression: string;
    summaryAlignment: 'good' | 'partial' | 'poor';
    suggestion?: string;
  };
}

export async function runCareerTailoringAnalysis(
  resumeContent: string,
  inferredJobTarget: string = 'Unknown',
  jobDescription?: string
): Promise<CareerTailoringResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not found');
  }

  // ============================================================================
  // OPTIMIZED CAREER & TAILORING PROMPT (Hybrid Approach)
  // - System message: Scoring methodology cached per session
  // - User message: Clear instructions, compressed by ~25%
  // - Maintains quality while reducing token cost
  // ============================================================================
  
  // System message: Scoring methodology (cached, not repeated)
  const systemMessage = `You are a professional career roadmap and resume tailoring analyst. Output ONLY valid JSON.

SCORING METHODOLOGY (deterministic: same input = same score ±2):

Career Roadmap Rules:
- Role count based on career stage (inferred from years of experience):
  Entry-level (0-2 yrs): 2 roles
  Mid-career (3-5 yrs): 4 roles
  Senior (6-10 yrs): 6 roles
  Lead/Executive (10+ yrs): 6 roles
- Timeframes: 0-1 yr (immediate), 1-3 yr (near-term), 3-5+ yr (long-term)
- Career paths: Show progression (e.g., "PM → Senior PM → Director")

Metrics (all 0-100):
- skill_match_percentage: (matched skills / required skills) × 100
  High match (>80) = ready now, Medium (60-80) = 6-12 months, Low (<60) = 1-2 years
- experience_relevance_score: (relevant experience / total experience) × 100
  Highly relevant (>80), Somewhat (60-80), Limited (<60)
- growth_potential_score: Industry demand + skill transferability
  High growth (>80), Moderate (60-80), Limited (<60)

Gaps Analysis (ONLY if job description provided):
- missing_skills: Skills in job description but not in resume
- missing_experience: Experience types in job description but not in resume
- suggested_certifications: Certs mentioned in job description or directly related to role
- If NO job description: leave gaps arrays EMPTY or focus on natural progression gaps from their career trajectory

Goals (3-5 per role):
- Link to resume gaps (e.g., "Learn Python" if missing)
- impact_score: 0-100 based on career advancement impact
- deadline: Realistic timeframe (3-6 months short-term, 6-12 months long-term)
- priority: short_term_impact | long_term_benefit | ease_of_implementation
- status: not_started (default for new goals)

Tailoring Metrics (all 0-100):
- keyword_match_score: (resume keywords / job keywords) × 100
  Excellent (>80), Good (60-80), Needs work (<60)
- skill_alignment_score: (resume skills / job skills) × 100
- experience_relevance_score: (relevant bullets / total bullets) × 100

CRITICAL: Base all analysis ONLY on resume content. Never reference:
- Industry averages, benchmarks, or "typical" scores
- Salary figures or compensation ranges
- Job market trends, demand, or growth percentages
- Prescriptive role recommendations ("your next role should be X")
- External data not present in the resume

Instead, provide observable patterns from THEIR resume (e.g., "You've progressed one level every 2.1 years" not "typical career path is X").`;

  // User message: Analysis request
  const prompt = `Analyze career roadmap and tailoring for job target: "${inferredJobTarget}"
${jobDescription ? `\nJob Description:\n${jobDescription}` : ''}

Return ONLY this JSON:
{
  "careerRoadmap": {
    "target_roles": [{
      "role_name": "specific role title",
      "timeframe": "0-1 yr | 1-3 yr | 3-5+ yr",
      "description": "1-2 sentences on role responsibilities",
      "justification": "Based on your progression (Associate → PM → Senior → Lead every 2.1 yrs), you have demonstrated upward mobility. Your scope has grown from 0 to 12 team members and $200K to $2M budget, suggesting readiness for expanded responsibility.",
      "priority": 1-10,
      "career_path": ["current role → next role → future role"],
      "metrics": {
        "skill_match_percentage": 0-100,
        "experience_relevance_score": 0-100,
        "growth_potential_score": 0-100
      },
      "gaps": {
        "missing_skills": ["specific skill"],
        "missing_experience": ["specific experience type"],
        "suggested_certifications": ["specific cert"]
      },
      "goals": [{
        "title": "specific actionable goal",
        "status": "not_started",
        "category": "skill_development | career_growth | networking | personal_growth",
        "completed": false,
        "impact_score": 0-100,
        "deadline": "YYYY-MM-DD (3-12 months from now)",
        "priority": "short_term_impact | long_term_benefit | ease_of_implementation"
      }]
    }],
    "life_integration": "1-2 sentences on work-life balance, relocation, or personal considerations"
  },
  "tailoringAnalysis": {
    "job_target": "${inferredJobTarget}",
    "metrics": {
      "keyword_match_score": {"score": 0-100, "max": 100, "reason": "1-2 sentences on keyword coverage"},
      "skill_alignment_score": {"score": 0-100, "max": 100, "reason": "1-2 sentences on skill match"},
      "experience_relevance_score": {"score": 0-100, "max": 100, "reason": "1-2 sentences on experience fit"}
    },
    "feedback": "1-2 sentences overall tailoring assessment",
    "suggestions": ["specific actionable suggestion (max 4)"]
  },
  "careerNarrative": {
    "progression": "Your resume shows clear progression: Scope (solo contributor → 12-person teams), Budget ($0 → $2M), Impact (local features → company-wide platforms), Stakeholders (team leads → C-suite)",
    "summaryAlignment": "good | partial | poor",
    "suggestion": "Consider rewriting Summary to mirror this progression (e.g., 'Scaling from IC to leadership, growing scope from $200K to $2M budgets')"
  }
}

INSTRUCTIONS:
- Suggest 2-6 roles based on career stage (inferred from years of experience in resume)
- Provide career paths showing progression based on their documented trajectory
- Identify gaps ONLY if job description provided; otherwise focus on strengths
- Link 3-5 goals per role to resume gaps or natural next steps from their progression
- Set realistic deadlines (3-12 months)
- Provide 4 tailoring suggestions max
- Use job description if provided, otherwise use job target
- In justification field, cite THEIR progression pattern (e.g., "every 2.1 years", "scope grew from X to Y")

CAREER NARRATIVE (new):
- Analyze progression pattern from Experience section (scope, budget, impact, stakeholders)
- Compare to Summary section - does Summary reflect this growth?
- Suggest rewriting Summary if it doesn't mirror the progression

Resume:
${resumeContent}`;

  try {
    // Generate deterministic seed from content hash for reproducibility
    const crypto = await import('crypto');
    const contentHash = crypto.createHash('sha256')
      .update(resumeContent + inferredJobTarget + (jobDescription || ''))
      .digest('hex');
    const seed = parseInt(contentHash.slice(0, 8), 16) % 10000;
    
    const response = await queuedApiCall(() =>
      retryWithBackoff(
        () => axios.post(
          KIMI_API_URL,
          {
            model: 'kimi-k2-turbo-preview',
            messages: [
              {
                role: 'system',
                content: systemMessage  // Cached methodology (10-15% savings)
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0,      // Deterministic
            top_p: 0.01,         // Further constrain randomness
            seed: seed,          // Same content + job → same analysis
            max_tokens: 3500,    // Safe for complex roadmaps
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
          console.log(`Career & Tailoring Analysis: Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/5)`);
        }
      )
    );

    const content = response.data.choices[0].message.content.trim();
    
    // Use robust JSON parser
    const { parseJsonFromLLM } = await import('../json-parser');
    const result: CareerTailoringResult = parseJsonFromLLM(content);
    
    // ============================================================================
    // POST-PROCESSING: Validate all scores are 0-100
    // ============================================================================
    if (result.careerRoadmap?.target_roles) {
      result.careerRoadmap.target_roles.forEach(role => {
        if (role.metrics) {
          role.metrics.skill_match_percentage = Math.min(100, Math.max(0, role.metrics.skill_match_percentage || 0));
          role.metrics.experience_relevance_score = Math.min(100, Math.max(0, role.metrics.experience_relevance_score || 0));
          role.metrics.growth_potential_score = Math.min(100, Math.max(0, role.metrics.growth_potential_score || 0));
        }
        
        if (role.goals) {
          role.goals.forEach(goal => {
            goal.impact_score = Math.min(100, Math.max(0, goal.impact_score || 0));
          });
        }
      });
    }
    
    if (result.tailoringAnalysis?.metrics) {
      const metrics = result.tailoringAnalysis.metrics;
      
      if (metrics.keyword_match_score) {
        metrics.keyword_match_score.score = Math.min(100, Math.max(0, metrics.keyword_match_score.score || 0));
      }
      if (metrics.skill_alignment_score) {
        metrics.skill_alignment_score.score = Math.min(100, Math.max(0, metrics.skill_alignment_score.score || 0));
      }
      if (metrics.experience_relevance_score) {
        metrics.experience_relevance_score.score = Math.min(100, Math.max(0, metrics.experience_relevance_score.score || 0));
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('Career & Tailoring Analysis error:', error.response?.data || error.message);
    
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      console.error('JSON parsing error - AI response may be incomplete. Retry usually works.');
    }
    
    throw new Error('Failed to analyze career and tailoring. Please try again.');
  }
}
