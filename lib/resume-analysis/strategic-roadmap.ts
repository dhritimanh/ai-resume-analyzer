import axios from 'axios';
import { retryWithBackoff } from '../kimi-retry';
import { queuedApiCall } from '../request-queue';
import { parseJsonFromLLM } from '../json-parser';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export interface StrategicRoadmapResult {
  market_positioning: {
    detected_seniority: 'Entry' | 'Mid' | 'Senior' | 'Executive';
    target_role_alignment_score: number;
    alignment_gap_analysis: {
      missing_hard_skills: string[];
      missing_soft_skills: string[];
      experience_gap?: string;
    };
  };
  career_progression: {
    scope_growth: string;
    budget_growth?: string;
    impact_growth: string;
    stakeholder_growth: string;
    summary_alignment: 'strong' | 'partial' | 'weak';
    summary_suggestion?: string;
  };
  industry_fit: {
    primary_industry_detected: string;
    transferable_skills: string[];
    industry_keywords_missing?: string[];
  };
  perception_signals: {
    leadership_style: 'Collaborative' | 'Directive' | 'Mixed';
    adaptability_evidence: 'High' | 'Medium' | 'Low';
  };
  recommended_next_steps: Array<{
    action: string;
    reason: string;
    timeframe: 'Immediate' | '3-6 months' | '6-12 months' | '12+ months';
    impact: 'High' | 'Medium' | 'Low';
  }>;
}

export async function runStrategicRoadmap(
  resumeContent: string,
  inferredJobTarget: string = 'Unknown',
  jobDescription?: string
): Promise<StrategicRoadmapResult> {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error('KIMI_API_KEY not found');

  const systemMessage = `You are a Fortune 500 Talent Acquisition Director with 20+ years screening resumes.

You give candid, evidence-based feedback on market positioning and next career steps.

Output ONLY valid JSON. Never moralize or add fluff.`;

  const prompt = `Candidate applied to: "${inferredJobTarget}"
${jobDescription ? `\nJob Description:\n${jobDescription}\n` : ''}

Return ONLY this JSON:
{
  "market_positioning": {
    "detected_seniority": "Entry | Mid | Senior | Executive",
    "target_role_alignment_score": 0-100,
    "alignment_gap_analysis": {
      "missing_hard_skills": ["Docker", "Kubernetes"],
      "missing_soft_skills": ["Stakeholder Management", "Budget Ownership"],
      "experience_gap": "You show 2 years PM experience; target role typically wants 5+"
    }
  },
  "career_progression": {
    "scope_growth": "From individual contributor to managing 12-person teams",
    "budget_growth": "From $0 to $2.3M budget responsibility",
    "impact_growth": "From feature-level to company-wide platform impact",
    "stakeholder_growth": "From team leads to C-suite reporting",
    "summary_alignment": "strong | partial | weak",
    "summary_suggestion": "Optional one-sentence rewrite if weak"
  },
  "industry_fit": {
    "primary_industry_detected": "FinTech | SaaS | Healthcare | etc.",
    "transferable_skills": ["Agile", "SQL", "Stakeholder Management"],
    "industry_keywords_missing": ["Compliance", "SOC 2"]   // only if JD provided
  },
  "perception_signals": {
    "leadership_style": "Collaborative | Directive | Mixed",
    "adaptability_evidence": "High | Medium | Low"
  },
  "recommended_next_steps": [
    {
      "action": "Obtain PMP or PSM certification",
      "reason": "Appears in 78% of Senior PM postings at your level",
      "timeframe": "3-6 months",
      "impact": "High"
    }
  ]
}

Resume Content:
${resumeContent}`;

  const crypto = await import('crypto');
  const seed = parseInt(
    crypto.createHash('sha256')
      .update(resumeContent + inferredJobTarget + (jobDescription || ''))
      .digest('hex')
      .slice(0, 8),
    16
  ) % 10000;

  const response = await queuedApiCall(() =>
    retryWithBackoff(() =>
      axios.post(
        KIMI_API_URL,
        {
          model: 'kimi-k2-turbo-preview',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          temperature: 0,
          top_p: 0.01,
          seed,
          max_tokens: 2400,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` }
        }
      )
    )
  );

  const result: StrategicRoadmapResult = parseJsonFromLLM(
    response.data.choices[0].message.content.trim()
  );

  // Clamp score
  result.market_positioning.target_role_alignment_score = Math.min(
    100,
    Math.max(0, result.market_positioning.target_role_alignment_score)
  );

  return result;
}
