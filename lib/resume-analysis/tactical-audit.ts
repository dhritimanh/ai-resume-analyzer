import axios from 'axios';
import { retryWithBackoff } from '../kimi-retry';
import { queuedApiCall } from '../request-queue';
import { parseJsonFromLLM } from '../json-parser';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export interface TacticalAuditResult {
  ats_technical_audit: {
    parseability_score: number;
    contact_info_found: string[];
    formatting_risks: string[];
    missing_critical_keywords?: string[];
  };
  impact_audit: {
    quantification_score: number;
    action_verb_score: number;
    repetition_penalty: string[];
    buzzword_stuffing: string[];
  };
  bullet_lab: {
    best_bullet: {
      text: string;
      why_it_works: string;
    };
    weakest_bullets: Array<{
      original: string;
      fix: string;
      fix_type: string;
    }>;
  };
  section_deep_dive: Array<{
    name: string;
    score: number;
    critical_fix: string;
  }>;
}

export async function runTacticalAudit(
  resumeContent: string,
  inferredJobTarget: string = 'Unknown'
): Promise<TacticalAuditResult> {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error('KIMI_API_KEY not found');

  const systemMessage = `You are an expert Resume Strategist & ATS Auditor. Your goal is to turn passive job descriptions into high-impact achievement records.

Output ONLY valid JSON. Never add explanations.`;

  const prompt = `Analyze this resume for job target: "${inferredJobTarget}"

CRITICAL RULES:
1. Find the single strongest bullet (best verb + metric + result).
2. Provide 5–8 exact before → after rewrites for the weakest bullets.
3. Be brutally specific — quote their original text.
4. Add realistic metrics where none exist (based on typical outcomes for that verb/role).

Return ONLY this JSON structure:
{
  "ats_technical_audit": {
    "parseability_score": 0-100,
    "contact_info_found": ["email", "phone", "linkedin", "location"],
    "formatting_risks": ["Tables in Experience", "Header/Footer text", "none detected"],
    "missing_critical_keywords": ["Docker", "Kubernetes", "AWS"]  // optional if JD not provided
  },
  "impact_audit": {
    "quantification_score": 0-100,
    "action_verb_score": 0-100,
    "repetition_penalty": ["Managed (7×)", "Led (5×)"],
    "buzzword_stuffing": ["Team player", "Hard worker", "Results-driven"]
  },
  "bullet_lab": {
    "best_bullet": {
      "text": "exact original bullet",
      "why_it_works": "Contains strong verb + specific metric + clear business result"
    },
    "weakest_bullets": [
      {
        "original": "exact original weak text",
        "fix": "rewritten with strong verb + metric + result",
        "fix_type": "Added Metric + Strong Verb | Removed Passive Voice | etc."
      }
    ]
  },
  "section_deep_dive": [
    {
      "name": "Experience | Summary | Skills | Education",
      "score": 0-100,
      "critical_fix": "Single most important fix for this section (one sentence)"
    }
  ]
}

Resume Content:
${resumeContent}`;

  const crypto = await import('crypto');
  const seed = parseInt(
    crypto.createHash('sha256')
      .update(resumeContent + inferredJobTarget)
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
          max_tokens: 2800,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` }
        }
      )
    )
  );

  const result: TacticalAuditResult = parseJsonFromLLM(
    response.data.choices[0].message.content.trim()
  );

  // Clamp scores
  result.ats_technical_audit.parseability_score = Math.min(100, Math.max(0, result.ats_technical_audit.parseability_score));
  result.impact_audit.quantification_score = Math.min(100, Math.max(0, result.impact_audit.quantification_score));
  result.impact_audit.action_verb_score = Math.min(100, Math.max(0, result.impact_audit.action_verb_score));
  
  result.section_deep_dive.forEach(section => {
    section.score = Math.min(100, Math.max(0, section.score));
  });

  return result;
}
