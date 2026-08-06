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

  // ============================================================================
  // OPTIMIZED LANGUAGE & BRANDING PROMPT (Hybrid Approach)
  // - System message: Scoring methodology cached per session
  // - User message: Clear instructions, compressed by ~20%
  // - Maintains quality while reducing token cost
  // ============================================================================
  
  // System message: Scoring methodology (cached, not repeated)
  const systemMessage = `You are a professional resume language and branding analyst. Output ONLY valid JSON.

SCORING METHODOLOGY (deterministic: same input = same score ±2):

Grammar Analysis:
- Count and classify each issue: Subject-Verb agreement, Tense consistency, Punctuation errors

Vocabulary Metrics:
- vocabulary_richness: (unique_word_count / word_count) × 100
  High (>60) = varied language, Low (<40) = repetitive
- vocabulary_appropriateness: Match to job domain (0-100)
  Technical role = technical terms score high
  Business role = business terminology scores high

Action Verb Strength:
- Weak: was, did, had, helped, worked, responsible for
- Medium: managed, developed, created, led, coordinated
- Strong: spearheaded, optimized, architected, transformed, pioneered
- total_percentage: (action verbs / total verbs) × 100

Tone Assessment:
- confident: Strong verbs, active voice, quantified results
- passive: Weak verbs, passive constructions, vague language
- tentative: Hedging words (maybe, tried, helped)
- Score: 100 - (passive constructions × 10) - (weak verbs × 5)

Personal Branding Scores (0-100):
- brand_clarity: How clearly resume defines role and value
  Clear value prop = 80-100, Vague = 40-60, Unclear = 0-40
- brand_consistency: Tone and focus consistency across sections
  Fully consistent = 80-100, Mostly = 60-80, Mixed = 40-60
- brand_uniqueness: Unique differentiators (awards, rare skills, unique experience)
  Highly unique = 80-100, Some = 60-80, Generic = 40-60
- visual_branding: Formatting impact (headers, layout, whitespace)
  Professional = 80-100, Adequate = 60-80, Poor = 40-60

CRITICAL: Base all analysis ONLY on resume content. Never reference:
- Industry averages, benchmarks, or "typical" scores
- Salary figures or compensation ranges
- Job market trends or growth percentages
- External data not present in the resume

Instead, provide observable patterns from THEIR resume (e.g., "Your scope grew from $200K to $2M budget" not "typical for your level").`;

  // User message: Analysis request
  const prompt = `Analyze language and branding for job target: "${inferredJobTarget}"

Return ONLY this JSON:
{
  "languageAnalysis": {
    "grammar_issues": {"total": number, "by_type": {"Subject-Verb": number, "Tense": number, "Punctuation": number}},
    "word_count": number,
    "avg_sentence_length": number,
    "unique_word_count": number,
    "vocabulary_richness": {"score": 0-100, "max": 100, "reason": "1-2 sentences"},
    "vocabulary_level_appropriateness": {"score": 0-100, "max": 100, "reason": "1-2 sentences on match to ${inferredJobTarget}"},
    "action_verb_usage": {
      "total_percentage": number (0-100),
      "by_strength": {"weak": number, "medium": number, "strong": number},
      "examples": [{"verb": "string", "strength": "weak|medium|strong", "context": "10-word snippet"}]
    },
    "tone": {"primary_tone": "confident|neutral|passive|tentative", "score": 0-100, "max": 100, "reason": "1-2 sentences"},
    "suggestions": ["specific actionable suggestion (max 4)"]
  },
  "personalBrandingAnalysis": {
    "metrics": {
      "brand_clarity_score": {"score": 0-100, "max": 100, "reason": "1-2 sentences on role/value clarity for ${inferredJobTarget}"},
      "brand_consistency_score": {"score": 0-100, "max": 100, "reason": "1-2 sentences on consistency"},
      "brand_uniqueness_score": {"score": 0-100, "max": 100, "reason": "1-2 sentences on differentiators"},
      "visual_branding": {"score": 0-100, "max": 100, "reason": "1-2 sentences on formatting impact"}
    },
    "feedback": "1-2 sentences overall branding assessment",
    "suggestions": ["specific actionable suggestion (max 4)"]
  }
}

INSTRUCTIONS:
- Count grammar issues by type
- Calculate word_count, avg_sentence_length, unique_word_count
- Categorize action verbs: weak (was/did), medium (managed/developed), strong (spearheaded/optimized)
- Provide 3-5 verb examples with 10-word context snippets
- Assess tone appropriateness for ${inferredJobTarget}
- Score all branding metrics (0-100) with clear reasons
- Max 4 suggestions per section, specific and actionable

Resume:
${resumeContent}`;

  try {
    // Generate deterministic seed from content hash for reproducibility
    const crypto = await import('crypto');
    const contentHash = crypto.createHash('sha256').update(resumeContent + inferredJobTarget).digest('hex');
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
            seed: seed,          // Same content → same analysis
            max_tokens: 2500,    // Safe for detailed response
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
    
    // ============================================================================
    // POST-PROCESSING: Validate all scores are 0-100
    // ============================================================================
    if (result.languageAnalysis) {
      const la = result.languageAnalysis;
      
      if (la.vocabulary_richness) {
        la.vocabulary_richness.score = Math.min(100, Math.max(0, la.vocabulary_richness.score || 0));
      }
      if (la.vocabulary_level_appropriateness) {
        la.vocabulary_level_appropriateness.score = Math.min(100, Math.max(0, la.vocabulary_level_appropriateness.score || 0));
      }
      if (la.action_verb_usage) {
        la.action_verb_usage.total_percentage = Math.min(100, Math.max(0, la.action_verb_usage.total_percentage || 0));
      }
      if (la.tone) {
        la.tone.score = Math.min(100, Math.max(0, la.tone.score || 0));
      }
    }
    
    if (result.personalBrandingAnalysis?.metrics) {
      const metrics = result.personalBrandingAnalysis.metrics;
      
      if (metrics.brand_clarity_score) {
        metrics.brand_clarity_score.score = Math.min(100, Math.max(0, metrics.brand_clarity_score.score || 0));
      }
      if (metrics.brand_consistency_score) {
        metrics.brand_consistency_score.score = Math.min(100, Math.max(0, metrics.brand_consistency_score.score || 0));
      }
      if (metrics.brand_uniqueness_score) {
        metrics.brand_uniqueness_score.score = Math.min(100, Math.max(0, metrics.brand_uniqueness_score.score || 0));
      }
      if (metrics.visual_branding) {
        metrics.visual_branding.score = Math.min(100, Math.max(0, metrics.visual_branding.score || 0));
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('Language & Branding Analysis error:', error.response?.data || error.message);
    
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      console.error('JSON parsing error - AI response may be incomplete. Retry usually works.');
    }
    
    throw new Error('Failed to analyze language and branding. Please try again.');
  }
}
