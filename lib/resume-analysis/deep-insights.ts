import axios from 'axios';
import { retryWithBackoff } from '../kimi-retry';
import { queuedApiCall } from '../request-queue';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export interface DeepInsightsResult {
  psychologicalInsights: {
    workStylePreferences: {
      team_orientation: number;
      structure_preference: number;
      risk_tolerance: number;
      work_pace: number;
      feedback_style: string;
      decision_making: string;
    };
    communicationStyle: {
      primary_style: string;
      formality_level: number;
      detail_orientation: number;
      assertiveness: number;
    };
    motivationalDrivers: Array<{
      driver: string;
      evidence: string;
      strength: number;
    }>;
    learningStyle: {
      primary_style: string;
      learning_velocity: number;
      adaptability: number;
      knowledge_depth_vs_breadth: number;
    };
  };
  industryAnalysis: {
    industryAlignment: {
      primary_industry: string;
      secondary_industries: string[];
      industry_trajectory: string;
      industry_trends_alignment: {
        score: number;
        trends: string[];
        reason: string;
      };
    };
    competitivePosition: {
      industry_specific_skills_score: number;
      unique_selling_points: string[];
      experience_depth_score: number;
      industry_terminology_usage: number;
    };
    industrySpecificSuggestions: Array<{
      suggestion: string;
      impact: number;
      timeframe: string;
    }>;
  };
  culturalFitAssessment: {
    workValues: Array<{
      value: string;
      evidence: string;
      strength: number;
    }>;
    organizationTypeAlignment: {
      startup: number;
      mid_size: number;
      enterprise: number;
      non_profit: number;
      government: number;
    };
    leadershipStylePreference: string;
    culturalAdaptability: {
      score: number;
      reason: string;
    };
  };
  learningAndDevelopmentProfile: {
    formalEducationPattern: string;
    skillAcquisitionSpeed: number;
    continuousLearningIndicators: number;
    knowledgeGaps: Array<{
      area: string;
      criticality: number;
      suggested_resources: string[];
    }>;
    mentorshipPotential: {
      as_mentor: number;
      as_mentee: number;
    };
  };
  networkAnalysis: {
    collaborationPatterns: {
      cross_functional: number;
      leadership: number;
      individual_contribution: number;
      primary_mode: string;
    };
    industryConnectivity: number;
    networkDiversity: number;
    networkStrengths: string[];
    networkGrowthStrategies: Array<{
      strategy: string;
      impact: number;
      timeframe: string;
    }>;
  };
}

export async function runDeepInsightsAnalysis(
  resumeContent: string,
  inferredJobTarget: string = 'Unknown',
  skills: any[] = [],
  careerRoles: any[] = []
): Promise<DeepInsightsResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not found');
  }

  const skillsStr = JSON.stringify(skills);
  const rolesStr = JSON.stringify(careerRoles.map(r => r.role_name || 'Unknown'));

  const prompt = `Analyze the following resume content and provide a detailed assessment in strict JSON format:
{
  "psychologicalInsights": {
    "workStylePreferences": {"team_orientation": number, "structure_preference": number, "risk_tolerance": number, "work_pace": number, "feedback_style": "Direct | Constructive | Informal | Mixed", "decision_making": "Analytical | Intuitive | Consensus-driven | Mixed"},
    "communicationStyle": {"primary_style": "Direct | Analytical | Collaborative | Expressive", "formality_level": number, "detail_orientation": number, "assertiveness": number},
    "motivationalDrivers": [{"driver": "Achievement | Recognition | Autonomy | Growth | Security | Impact", "evidence": "string", "strength": number}],
    "learningStyle": {"primary_style": "Visual | Auditory | Kinesthetic | Reading/Writing", "learning_velocity": number, "adaptability": number, "knowledge_depth_vs_breadth": number}
  },
  "industryAnalysis": {
    "industryAlignment": {"primary_industry": "string", "secondary_industries": ["string"], "industry_trajectory": "Specializing | Broadening | Transitioning", "industry_trends_alignment": {"score": number, "trends": ["string"], "reason": "string"}},
    "competitivePosition": {"industry_specific_skills_score": number, "unique_selling_points": ["string"], "experience_depth_score": number, "industry_terminology_usage": number},
    "industrySpecificSuggestions": [{"suggestion": "string", "impact": number, "timeframe": "Immediate | Short-term | Long-term"}]
  },
  "culturalFitAssessment": {
    "workValues": [{"value": "Innovation | Structure | Collaboration | Competition | Social Impact", "evidence": "string", "strength": number}],
    "organizationTypeAlignment": {"startup": number, "mid_size": number, "enterprise": number, "non_profit": number, "government": number},
    "leadershipStylePreference": "Directive | Supportive | Coaching | Delegative",
    "culturalAdaptability": {"score": number, "reason": "string"}
  },
  "learningAndDevelopmentProfile": {
    "formalEducationPattern": "Traditional | Non-traditional | Continuous | Specialized",
    "skillAcquisitionSpeed": number,
    "continuousLearningIndicators": number,
    "knowledgeGaps": [{"area": "string", "criticality": number, "suggested_resources": ["string"]}],
    "mentorshipPotential": {"as_mentor": number, "as_mentee": number}
  },
  "networkAnalysis": {
    "collaborationPatterns": {"cross_functional": number, "leadership": number, "individual_contribution": number, "primary_mode": "Leader | Facilitator | Supporter | Independent Contributor"},
    "industryConnectivity": number,
    "networkDiversity": number,
    "networkStrengths": ["string"],
    "networkGrowthStrategies": [{"strategy": "string", "impact": number, "timeframe": "Immediate | Short-term | Long-term"}]
  }
}
Guidelines:
- Optimize for job search success based on the inferred job target: '${inferredJobTarget}' and prior analysis data.
- All numerical scores are on a 0-100 scale; provide detailed evidence from resume content and reasoning for each score, including industry benchmarks (e.g., 'Average PM team_orientation is 70').
- For 'psychologicalInsights': Infer traits from resume evidence (e.g., leadership roles indicate risk_tolerance); align with '${inferredJobTarget}'.
- For 'industryAnalysis': Use skills from ${skillsStr} to assess alignment; include specific industry trends (e.g., 'AI adoption in PM') and tailor suggestions to '${inferredJobTarget}'.
- For 'culturalFitAssessment': Assess adaptability based on diverse experiences; align values with target roles ${rolesStr}.
- For 'learningAndDevelopmentProfile': Identify gaps from prior analyses; suggest resources tied to '${inferredJobTarget}'.
- For 'networkAnalysis': Infer from collaboration evidence; provide actionable growth strategies (e.g., 'Join PMI chapter').
Resume content:
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
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 4000,
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
          console.log(`Deep Insights Analysis: Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/5)`);
        }
      )
    );

    const content = response.data.choices[0].message.content.trim();
    
    // Use robust JSON parser
    const { parseJsonFromLLM } = await import('../json-parser');
    const result: DeepInsightsResult = parseJsonFromLLM(content);
    
    return result;
  } catch (error: any) {
    console.error('Deep Insights Analysis error:', error.response?.data || error.message);
    
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      console.error('JSON parsing error - AI response may be incomplete. Retry usually works.');
    }
    
    throw new Error('Failed to analyze deep insights. Please try again.');
  }
}
