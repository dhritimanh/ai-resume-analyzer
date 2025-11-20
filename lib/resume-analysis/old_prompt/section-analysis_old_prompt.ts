import axios from 'axios';
import { retryWithBackoff } from '../../kimi-retry';
import { queuedApiCall } from '../../request-queue';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export interface SectionAnalysisResult {
  sectionAnalysis: Array<{
    name: string;
    feedback: {
      content_relevance: string;
      structure_clarity: string;
      impact_assessment: string;
      branding_potential: string;
    };
    suggestions: Array<{
      type: string;
      text: string;
      priority: 'High' | 'Medium' | 'Low';
      impact_level: number;
      example: string;
    }>;
    metrics: {
      word_count: number;
      avg_sentence_length: number;
      keyword_density: number;
      keyword_context_relevance: number;
      readability_score: number;
      sentiment_score: number;
      quantification_ratio: number;
      sentence_complexity: number;
      passive_voice_ratio: number;
      skill_categories: {
        'Technical Skills': number;
        'Soft Skills': number;
        Tools: number;
        Languages: number;
      };
    };
    tone: string;
    jobTargetRelevance: string;
  }>;
  formattingAnalysis: {
    metrics: {
      font_consistency_score: number;
      whitespace_usage_score: number;
      visual_hierarchy_score: number;
      readability_formatting_score: number;
    };
    feedback: string;
    suggestions: string[];
    atsCompatibility: string;
  };
  quantificationAnalysis: {
    metrics: {
      quantification_impact_score: number;
      quantification_clarity_score: number;
    };
    feedback: string;
    suggestions: string[];
    examples: string[];
  };
}

export async function runSectionAnalysis(
  resumeContent: string,
  inferredJobTarget: string = 'Unknown'
): Promise<SectionAnalysisResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not found');
  }

  const prompt = `Analyze the following resume content and provide a detailed assessment in strict JSON format:
{
  "sectionAnalysis": [{
    "name": "string",
    "feedback": {"content_relevance": "string", "structure_clarity": "string", "impact_assessment": "string", "branding_potential": "string"},
    "suggestions": [{"type": "Content Enhancement | Clarity Improvement | Formatting | Metric Addition | Action Verb Usage | Branding", "text": "string", "priority": "High | Medium | Low", "impact_level": number, "example": "string"}],
    "metrics": {"word_count": number, "avg_sentence_length": number, "keyword_density": number, "keyword_context_relevance": number, "readability_score": number, "sentiment_score": number, "quantification_ratio": number, "sentence_complexity": number, "passive_voice_ratio": number, "skill_categories": {"Technical Skills": number, "Soft Skills": number, "Tools": number, "Languages": number}},
    "tone": "string",
    "jobTargetRelevance": "string"
  }],
  "formattingAnalysis": {
    "metrics": {"font_consistency_score": number, "whitespace_usage_score": number, "visual_hierarchy_score": number, "readability_formatting_score": number},
    "feedback": "string",
    "suggestions": ["string"],
    "atsCompatibility": "string"
  },
  "quantificationAnalysis": {
    "metrics": {"quantification_impact_score": number, "quantification_clarity_score": number},
    "feedback": "string",
    "suggestions": ["string"],
    "examples": ["string"]
  }
}
Guidelines:
- Optimize for job search success based on the inferred job target: '${inferredJobTarget}'.
- Analyze ONLY the main sections (max 5 sections: Summary, Experience, Education, Skills, and one custom section if present).
- Provide numerical metrics (0-100 scale) for each section.
- Assess 'jobTargetRelevance' per section relative to '${inferredJobTarget}'.
- Offer 2-3 specific suggestions per section with examples.
- Keep feedback concise (1-2 sentences per field).
- Ensure 'skill_categories' are always populated based on resume content.
- For formatting and quantification, provide brief feedback and 2-3 suggestions max.
Resume content:
${resumeContent}`;

  try {
    // Use queue to prevent concurrent requests from overwhelming rate limits
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
            temperature: 0,
            max_tokens: 3500, // Reduced to prevent truncation
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
          console.log(`Section Analysis: Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/5)`);
        }
      )
    );

    const content = response.data.choices[0].message.content.trim();
    
    // Use robust JSON parser
    const { parseJsonFromLLM } = await import('../../json-parser');
    const result: SectionAnalysisResult = parseJsonFromLLM(content);
    
    return result;
  } catch (error: any) {
    console.error('Section Analysis error:', error.response?.data || error.message);
    
    // If it's a JSON parsing error, provide helpful context
    if (error.message?.includes('JSON') || error.message?.includes('parse') || error.message?.includes('truncated')) {
      console.error('JSON parsing error detected. The AI response was likely truncated.');
      console.error('This usually resolves on retry as the AI generates a more concise response.');
      throw new Error('AI response was incomplete. Please try again - it usually works on the second attempt.');
    }
    
    throw new Error('Failed to analyze resume sections. Please try again.');
  }
}
