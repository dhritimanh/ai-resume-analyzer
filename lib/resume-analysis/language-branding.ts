import axios from 'axios';
import { retryWithBackoff } from '../kimi-retry';
import { queuedApiCall } from '../request-queue';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export interface LanguageBrandingResult {
  languageAnalysis: {
    grammar_issues: {
      total: number;
      by_type: {
        'Subject-Verb': number;
        Tense: number;
        Punctuation: number;
      };
    };
    word_count: number;
    avg_sentence_length: number;
    unique_word_count: number;
    vocabulary_richness: {
      score: number;
      max: 100;
      reason: string;
    };
    vocabulary_level_appropriateness: {
      score: number;
      max: 100;
      reason: string;
    };
    action_verb_usage: {
      total_percentage: number;
      by_strength: {
        weak: number;
        medium: number;
        strong: number;
      };
      examples: Array<{
        verb: string;
        strength: 'weak' | 'medium' | 'strong';
        context: string;
      }>;
    };
    tone: {
      primary_tone: string;
      score: number;
      max: 100;
      reason: string;
    };
    suggestions: string[];
  };
  personalBrandingAnalysis: {
    metrics: {
      brand_clarity_score: {
        score: number;
        max: 100;
        reason: string;
      };
      brand_consistency_score: {
        score: number;
        max: 100;
        reason: string;
      };
      brand_uniqueness_score: {
        score: number;
        max: 100;
        reason: string;
      };
      visual_branding: {
        score: number;
        max: 100;
        reason: string;
      };
    };
    feedback: string;
    suggestions: string[];
  };
}

export async function runLanguageBrandingAnalysis(
  resumeContent: string,
  inferredJobTarget: string = 'Unknown'
): Promise<LanguageBrandingResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not found');
  }

  const prompt = `Analyze the following resume content and provide a detailed assessment in strict JSON format:
{
  "languageAnalysis": {
    "grammar_issues": {"total": number, "by_type": {"Subject-Verb": number, "Tense": number, "Punctuation": number}},
    "word_count": number,
    "avg_sentence_length": number,
    "unique_word_count": number,
    "vocabulary_richness": {"score": number, "max": 100, "reason": "string"},
    "vocabulary_level_appropriateness": {"score": number, "max": 100, "reason": "string"},
    "action_verb_usage": {"total_percentage": number, "by_strength": {"weak": number, "medium": number, "strong": number}, "examples": [{"verb": "string", "strength": "weak | medium | strong", "context": "string"}]},
    "tone": {"primary_tone": "string", "score": number, "max": 100, "reason": "string"},
    "suggestions": ["string"]
  },
  "personalBrandingAnalysis": {
    "metrics": {
      "brand_clarity_score": {"score": number, "max": 100, "reason": "string"},
      "brand_consistency_score": {"score": number, "max": 100, "reason": "string"},
      "brand_uniqueness_score": {"score": number, "max": 100, "reason": "string"},
      "visual_branding": {"score": number, "max": 100, "reason": "string"}
    },
    "feedback": "string",
    "suggestions": ["string"]
  }
}
Guidelines:
- Optimize for job search success based on the inferred job target: '${inferredJobTarget}'.
- Assess grammar (count issues by type: Subject-Verb, Tense, Punctuation).
- Calculate word_count (total words), avg_sentence_length (words per sentence), and unique_word_count (distinct words).
- Score vocabulary_richness (0-100) based on unique_word_count relative to word_count, penalizing repetition; provide a reason (e.g., 'Low due to repetitive phrasing').
- Score vocabulary_level_appropriateness (0-100) based on complexity and relevance to '${inferredJobTarget}' (e.g., technical terms for a tech role); provide a reason.
- Analyze action_verb_usage: calculate total_percentage (action verbs / total verbs * 100), categorize by strength (weak: 'was, did'; medium: 'managed, developed'; strong: 'spearheaded, optimized'), and list examples with context.
- Assess tone (e.g., confident, passive, tentative) and score its appropriateness (0-100) for '${inferredJobTarget}'; provide a reason.
- Score personal branding metrics (0-100):
  - brand_clarity_score: How well the resume defines the candidate's role and value for '${inferredJobTarget}'; reason required.
  - brand_consistency_score: Consistency across sections in tone and focus; reason required.
  - brand_uniqueness_score: Unique elements (e.g., startup experience, awards); reason required.
  - visual_branding: Impact of formatting (e.g., bold headings, layout clarity) on branding; reason required.
- Provide specific, actionable suggestions tied to the analysis and '${inferredJobTarget}' (e.g., 'For a Project Manager role, replace X with Y to boost action verb strength').
- Include industry benchmarks for scores where applicable (e.g., 'Average brand clarity for Project Managers is 70').
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
            max_tokens: 2500,
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
          console.log(`Language & Branding Analysis: Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/5)`);
        }
      )
    );

    const content = response.data.choices[0].message.content.trim();
    
    // Use robust JSON parser
    const { parseJsonFromLLM } = await import('../json-parser');
    const result: LanguageBrandingResult = parseJsonFromLLM(content);
    
    return result;
  } catch (error: any) {
    console.error('Language & Branding Analysis error:', error.response?.data || error.message);
    
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      console.error('JSON parsing error - AI response may be incomplete. Retry usually works.');
    }
    
    throw new Error('Failed to analyze language and branding. Please try again.');
  }
}
