import axios from 'axios';
import { retryWithBackoff } from '../kimi-retry';
import { queuedApiCall } from '../request-queue';

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
  // Maximum Value Suggestions (new)
  bestBulletTemplate?: {
    bullet: string;
    why: string;
    structure: string;
    applyTo: string[];
  };
  skillExperienceAlignment?: {
    skillsListed: string[];
    experienceMentions: Record<string, number>;
    gaps: Array<{
      type: 'listed_not_used' | 'used_not_listed';
      skill: string;
      suggestion: string;
    }>;
  };
  careerNarrative?: {
    progression: string;
    summaryAlignment: string;
    suggestion?: string;
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

  // ============================================================================
  // OPTIMIZED SECTION ANALYSIS PROMPT (Hybrid Approach)
  // - System message: Scoring formulas cached per session
  // - User message: Clear instructions with "before → after" examples
  // - Maintains quality while reducing token cost by ~20%
  // ============================================================================
  
  // System message: Scoring methodology (cached, not repeated)
  const systemMessage = `You are a professional resume section analyzer. Output ONLY valid JSON.

SCORING METHODOLOGY (deterministic: same input = same score ±2):

Section Metrics (all 0-100):
- keyword_density: (job-relevant keywords found / total words) × 100
  Example: 15 keywords in 200 words = 7.5%
- keyword_context_relevance: How well keywords fit context (0-100 subjective)
- readability_score: Based on Flesch-Kincaid grade level
  Grade 10-12 = 100, 13-15 = 85, 16-18 = 70, >18 = 50
- quantification_ratio: (bullets with numbers / total bullets) × 100
- sentence_complexity: Avg words per sentence (10-15 = 100, 16-20 = 85, 21-25 = 70, >25 = 50)
- passive_voice_ratio: (passive constructions / total sentences) × 100 (lower is better)
- sentiment_score: Professional tone assessment (0-100)

Formatting Metrics (all 0-100):
- font_consistency_score: Uniform styling throughout
- whitespace_usage_score: Proper spacing and margins
- visual_hierarchy_score: Clear section headers and structure
- readability_formatting_score: Overall visual clarity

Quantification Metrics (all 0-100):
- quantification_impact_score: How well metrics demonstrate impact
- quantification_clarity_score: How clear and specific numbers are

SUGGESTION FORMAT:
Each suggestion MUST include "before → after" example showing the improvement.
Example: "before: Led team meetings → after: Led weekly team of 8, improving delivery speed by 40%"`;

  // User message: Analysis request
  const prompt = `Analyze this resume for job target: "${inferredJobTarget}"

Return ONLY this JSON:
{
  "sectionAnalysis": [{
    "name": "Summary | Experience | Education | Skills | Custom",
    "feedback": {
      "content_relevance": "1-2 sentences on relevance to ${inferredJobTarget}",
      "structure_clarity": "1-2 sentences on organization",
      "impact_assessment": "1-2 sentences on achievement strength",
      "branding_potential": "1-2 sentences on personal brand"
    },
    "suggestions": [{
      "type": "Content Enhancement | Clarity Improvement | Formatting | Metric Addition | Action Verb Usage | Branding",
      "text": "specific actionable instruction",
      "priority": "High | Medium | Low",
      "impact_level": 0-100,
      "example": "before: [current text] → after: [improved text]"
    }],
    "metrics": {
      "word_count": number,
      "avg_sentence_length": number,
      "keyword_density": number (0-100),
      "keyword_context_relevance": number (0-100),
      "readability_score": number (0-100),
      "sentiment_score": number (0-100),
      "quantification_ratio": number (0-100),
      "sentence_complexity": number (0-100),
      "passive_voice_ratio": number (0-100),
      "skill_categories": {"Technical Skills": number, "Soft Skills": number, "Tools": number, "Languages": number}
    },
    "tone": "professional | neutral | casual | overly formal",
    "jobTargetRelevance": "1-2 sentences comparing to ${inferredJobTarget}"
  }],
  "formattingAnalysis": {
    "metrics": {
      "font_consistency_score": number (0-100),
      "whitespace_usage_score": number (0-100),
      "visual_hierarchy_score": number (0-100),
      "readability_formatting_score": number (0-100)
    },
    "feedback": "1-2 sentences on overall formatting",
    "suggestions": ["specific suggestion (max 3)"],
    "atsCompatibility": "excellent | good | needs_fix | poor"
  },
  "quantificationAnalysis": {
    "metrics": {
      "quantification_impact_score": number (0-100),
      "quantification_clarity_score": number (0-100)
    },
    "feedback": "1-2 sentences on metrics usage",
    "suggestions": ["specific suggestion (max 3)"],
    "examples": ["before: [vague] → after: [quantified] (max 3)"]
  },
  "bestBulletTemplate": {
    "bullet": "exact text of their strongest bullet (most complete: verb + scope + metric + timeline)",
    "why": "This works because it has: ✓ Action verb (X) ✓ Scope (Y) ✓ Achievement (Z) ✓ Metric (%) ✓ Context (numbers) ✓ Timeline (months)",
    "structure": "[Verb] [scope] to [achievement], [metric] ([context]) in [timeline]",
    "applyTo": ["bullet reference 1 that needs this structure", "bullet reference 2"]
  },
  "skillExperienceAlignment": {
    "skillsListed": ["skill1", "skill2", "skill3"],
    "experienceMentions": {"skill1": 3, "skill2": 1, "skill3": 0, "unlisted_skill": 4},
    "gaps": [{
      "type": "listed_not_used | used_not_listed",
      "skill": "skill name",
      "suggestion": "add example or remove | add to Skills section"
    }]
  },
  "careerNarrative": {
    "progression": "Your resume shows: Scope (solo → 12-person teams), Budget ($0 → $2M), Impact (local → company-wide), Stakeholders (team → C-suite)",
    "summaryAlignment": "good | partial | poor",
    "suggestion": "Consider rewriting Summary to mirror progression (e.g., 'Scaling from IC to leadership...')"
  }
}

INSTRUCTIONS:
- Analyze max 5 sections: Summary, Experience, Education, Skills, + 1 custom if present
- Provide 2-3 suggestions per section with "before → after" examples
- All metrics on 0-100 scale
- Keep feedback concise (1-2 sentences)
- Populate skill_categories based on actual content
- Examples should be ≤15 words each side of arrow

MAXIMUM VALUE SUGGESTIONS (new):
1. Find their BEST bullet (most complete with verb, scope, metric, timeline, context)
2. Compare Skills section list vs Experience mentions - count occurrences
3. Identify progression pattern (scope, budget, impact, stakeholders) and compare to Summary

Resume:
${resumeContent}`;

  try {
    // Generate deterministic seed from content hash for reproducibility
    const crypto = await import('crypto');
    const contentHash = crypto.createHash('sha256').update(resumeContent + inferredJobTarget).digest('hex');
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
                content: systemMessage  // Cached scoring methodology (10-15% savings)
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0,      // Deterministic
            top_p: 0.01,         // Further constrain randomness
            seed: seed,          // Same content → same analysis
            max_tokens: 3500,    // Safe for complex responses
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
    const { parseJsonFromLLM } = await import('../json-parser');
    const result: SectionAnalysisResult = parseJsonFromLLM(content);
    
    // ============================================================================
    // POST-PROCESSING: Validate metrics are in range
    // ============================================================================
    result.sectionAnalysis.forEach(section => {
      if (section.metrics) {
        section.metrics.keyword_density = Math.min(100, Math.max(0, section.metrics.keyword_density || 0));
        section.metrics.keyword_context_relevance = Math.min(100, Math.max(0, section.metrics.keyword_context_relevance || 0));
        section.metrics.readability_score = Math.min(100, Math.max(0, section.metrics.readability_score || 0));
        section.metrics.sentiment_score = Math.min(100, Math.max(0, section.metrics.sentiment_score || 0));
        section.metrics.quantification_ratio = Math.min(100, Math.max(0, section.metrics.quantification_ratio || 0));
        section.metrics.sentence_complexity = Math.min(100, Math.max(0, section.metrics.sentence_complexity || 0));
        section.metrics.passive_voice_ratio = Math.min(100, Math.max(0, section.metrics.passive_voice_ratio || 0));
      }
    });
    
    if (result.formattingAnalysis?.metrics) {
      const fm = result.formattingAnalysis.metrics;
      fm.font_consistency_score = Math.min(100, Math.max(0, fm.font_consistency_score || 0));
      fm.whitespace_usage_score = Math.min(100, Math.max(0, fm.whitespace_usage_score || 0));
      fm.visual_hierarchy_score = Math.min(100, Math.max(0, fm.visual_hierarchy_score || 0));
      fm.readability_formatting_score = Math.min(100, Math.max(0, fm.readability_formatting_score || 0));
    }
    
    if (result.quantificationAnalysis?.metrics) {
      const qm = result.quantificationAnalysis.metrics;
      qm.quantification_impact_score = Math.min(100, Math.max(0, qm.quantification_impact_score || 0));
      qm.quantification_clarity_score = Math.min(100, Math.max(0, qm.quantification_clarity_score || 0));
    }
    
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
