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

  const prompt = `Analyze the following resume content and provide a detailed assessment in strict JSON format:
{
  "careerRoadmap": {
    "target_roles": [{
      "role_name": "string",
      "timeframe": "string",
      "description": "string",
      "justification": "string",
      "priority": number,
      "career_path": ["string"],
      "metrics": {"skill_match_percentage": number, "experience_relevance_score": number, "growth_potential_score": number},
      "gaps": {"missing_skills": ["string"], "missing_experience": ["string"], "suggested_certifications": ["string"]},
      "goals": [{"title": "string", "status": "not_started | in_progress | completed", "category": "skill_development | career_growth | networking | personal_growth", "completed": boolean, "impact_score": number, "deadline": "string", "priority": "short_term_impact | long_term_benefit | ease_of_implementation"}]
    }],
    "life_integration": "string"
  },
  "tailoringAnalysis": {
    "job_target": "string",
    "metrics": {"keyword_match_score": {"score": number, "max": 100, "reason": "string"}, "skill_alignment_score": {"score": number, "max": 100, "reason": "string"}, "experience_relevance_score": {"score": number, "max": 100, "reason": "string"}},
    "feedback": "string",
    "suggestions": ["string"]
  }
}
Guidelines:
- Optimize for job search success based on the inferred job target: '${inferredJobTarget}' and optional job description provided.
- For 'careerRoadmap':
  - Suggest 2-6 target roles based on career stage inferred from resume content (e.g., 2 for entry-level, 4 for mid-career, 6 for senior); adjust timeframes dynamically (e.g., 0-1 year, 1-3 years, 3-5+ years).
  - Provide role descriptions, justifications, and career paths (e.g., 'Project Manager -> Senior PM -> Director').
  - Score metrics (0-100): skill_match_percentage (current skills vs. role needs), experience_relevance_score (past roles vs. role demands), growth_potential_score (future fit); include industry benchmarks (e.g., 'Average PM skill match is 75').
  - Identify gaps: missing skills, experience, and suggested certifications for each role.
  - Link 3-5 goals per role to resume content and gaps (e.g., 'Learn Agile' if missing); score impact (0-100).
  - Describe life_integration: how career goals align with personal life (e.g., work-life balance, relocation).
- For 'tailoringAnalysis':
  - Use '${inferredJobTarget}' as the job target if no job description is provided; otherwise, use the provided job description.
  - Score metrics (0-100): keyword_match_score (resume vs. job keywords), skill_alignment_score (skills vs. job needs), experience_relevance_score (experience vs. job requirements); provide reasons.
  - Offer specific, actionable suggestions to tailor the resume to the job target (e.g., 'Add X keyword to Summary').
Resume content:
${resumeContent}
${jobDescription ? `\nJob description (if provided):\n${jobDescription}` : ''}`;

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
            max_tokens: 3500,
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
    
    return result;
  } catch (error: any) {
    console.error('Career & Tailoring Analysis error:', error.response?.data || error.message);
    
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      console.error('JSON parsing error - AI response may be incomplete. Retry usually works.');
    }
    
    throw new Error('Failed to analyze career and tailoring. Please try again.');
  }
}
