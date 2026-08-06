'use client';

import { useState, useEffect } from 'react';
import type { TacticalAuditResult } from '@/lib/resume-analysis/tactical-audit';
import type { StrategicRoadmapResult } from '@/lib/resume-analysis/strategic-roadmap';

interface FullAnalysisDashboardV2Props {
  resumeContent: string;
  resumeData?: any;
  onBack?: () => void;
}

type AnalysisTab = 'tactical' | 'strategic';

export default function FullAnalysisDashboardV2({ resumeContent, resumeData, onBack }: FullAnalysisDashboardV2Props) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('tactical');
  const [loading, setLoading] = useState<Record<AnalysisTab, boolean>>({
    tactical: false,
    strategic: false,
  });
  
  const [results, setResults] = useState<{
    tactical: TacticalAuditResult | null;
    strategic: StrategicRoadmapResult | null;
  }>({
    tactical: null,
    strategic: null,
  });

  // Auto-run tactical analysis on mount
  useEffect(() => {
    runAnalysis('tactical');
  }, []);

  const runAnalysis = async (tab: AnalysisTab) => {
    if (results[tab]) return;
    
    setLoading(prev => ({ ...prev, [tab]: true }));
    
    try {
      const inferredJobTarget = 'Unknown'; // You can pass this from props if needed
      
      if (tab === 'tactical') {
        const response = await fetch('/api/analysis/tactical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeContent, inferredJobTarget }),
        });
        if (!response.ok) throw new Error('Tactical audit failed');
        const result = await response.json();
        setResults(prev => ({ ...prev, tactical: result }));
      } else {
        const response = await fetch('/api/analysis/strategic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeContent, inferredJobTarget }),
        });
        if (!response.ok) throw new Error('Strategic roadmap failed');
        const result = await response.json();
        setResults(prev => ({ ...prev, strategic: result }));
      }
    } catch (error: any) {
      console.error(`${tab} analysis error:`, error);
      alert(`Failed to run ${tab} analysis: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  const handleTabClick = (tab: AnalysisTab) => {
    setActiveTab(tab);
    if (!results[tab] && !loading[tab]) {
      runAnalysis(tab);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Resume Analysis V2</h1>
            <p className="text-gray-400 mt-1">Tactical fixes + Strategic roadmap</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => handleTabClick('tactical')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'tactical'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            🔧 Tactical Audit
            {loading.tactical && ' ⏳'}
            {results.tactical && !loading.tactical && ' ✓'}
          </button>
          <button
            onClick={() => handleTabClick('strategic')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'strategic'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            🎯 Strategic Roadmap
            {loading.strategic && ' ⏳'}
            {results.strategic && !loading.strategic && ' ✓'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-black border border-gray-700 rounded-xl shadow-lg p-8">
        {loading[activeTab] ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Analyzing your resume...</p>
          </div>
        ) : (
          <>
            {activeTab === 'tactical' && results.tactical && (
              <TacticalAuditView data={results.tactical} />
            )}
            {activeTab === 'strategic' && results.strategic && (
              <StrategicRoadmapView data={results.strategic} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TacticalAuditView({ data }: { data: TacticalAuditResult }) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">🔧 Tactical Audit</h2>

      {/* ATS Technical Audit */}
      <div className="border border-gray-700 rounded-lg p-6 bg-blue-900/20">
        <h3 className="text-xl font-bold text-white mb-4">🤖 ATS Technical Audit</h3>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Parseability Score</span>
            <span className="text-3xl font-bold text-blue-400">{data.ats_technical_audit.parseability_score}/100</span>
          </div>
          <div className="bg-gray-700 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full" 
              style={{ width: `${data.ats_technical_audit.parseability_score}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-2">Contact Info Found</h4>
            <div className="flex flex-wrap gap-2">
              {data.ats_technical_audit.contact_info_found.map((info, i) => (
                <span key={i} className="px-3 py-1 bg-green-900/40 text-green-300 rounded-full text-sm">
                  ✓ {info}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-2">Formatting Risks</h4>
            <ul className="space-y-1">
              {data.ats_technical_audit.formatting_risks.map((risk, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start">
                  <span className={risk === 'none detected' ? 'text-green-400' : 'text-yellow-400'}>
                    {risk === 'none detected' ? '✓' : '⚠'}
                  </span>
                  <span className="ml-2">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {data.ats_technical_audit.missing_critical_keywords && data.ats_technical_audit.missing_critical_keywords.length > 0 && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded">
            <h4 className="font-semibold text-red-400 mb-2">Missing Critical Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {data.ats_technical_audit.missing_critical_keywords.map((keyword, i) => (
                <span key={i} className="px-3 py-1 bg-red-900/40 text-red-300 rounded text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Impact Audit */}
      <div className="border border-gray-700 rounded-lg p-6 bg-purple-900/20">
        <h3 className="text-xl font-bold text-white mb-4">💥 Impact Audit</h3>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <div className="text-3xl font-bold text-purple-400">{data.impact_audit.quantification_score}/100</div>
            <div className="text-sm text-gray-400">Quantification Score</div>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <div className="text-3xl font-bold text-purple-400">{data.impact_audit.action_verb_score}/100</div>
            <div className="text-sm text-gray-400">Action Verb Score</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-2">Repetition Penalty</h4>
            <ul className="space-y-1">
              {data.impact_audit.repetition_penalty.map((item, i) => (
                <li key={i} className="text-sm text-yellow-300">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Buzzword Stuffing</h4>
            <ul className="space-y-1">
              {data.impact_audit.buzzword_stuffing.map((item, i) => (
                <li key={i} className="text-sm text-red-300">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bullet Lab */}
      <div className="border border-gray-700 rounded-lg p-6 bg-emerald-900/20">
        <h3 className="text-xl font-bold text-white mb-4">🧪 Bullet Lab</h3>
        
        {/* Best Bullet */}
        <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <h4 className="font-semibold text-green-400 mb-2">✨ Your Best Bullet</h4>
          <p className="text-gray-200 italic mb-2">"{data.bullet_lab.best_bullet.text}"</p>
          <p className="text-sm text-gray-400">{data.bullet_lab.best_bullet.why_it_works}</p>
        </div>

        {/* Weakest Bullets */}
        <h4 className="font-semibold text-white mb-3">🔧 Fixes for Weakest Bullets</h4>
        <div className="space-y-4">
          {data.bullet_lab.weakest_bullets.map((bullet, i) => (
            <div key={i} className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
              <div className="mb-2">
                <span className="text-xs px-2 py-1 bg-yellow-900/40 text-yellow-300 rounded">
                  {bullet.fix_type}
                </span>
              </div>
              <div className="mb-2">
                <span className="text-xs text-gray-500">Before:</span>
                <p className="text-sm text-red-300 line-through">{bullet.original}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">After:</span>
                <p className="text-sm text-green-300">{bullet.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Deep Dive */}
      <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
        <h3 className="text-xl font-bold text-white mb-4">📊 Section Deep Dive</h3>
        <div className="space-y-4">
          {data.section_deep_dive.map((section, i) => (
            <div key={i} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">{section.name}</h4>
                <span className="text-2xl font-bold text-indigo-400">{section.score}/100</span>
              </div>
              <p className="text-sm text-gray-300">
                <span className="text-yellow-400">💡 Critical Fix: </span>
                {section.critical_fix}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StrategicRoadmapView({ data }: { data: StrategicRoadmapResult }) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white">🎯 Strategic Roadmap</h2>

      {/* Market Positioning */}
      <div className="border border-gray-700 rounded-lg p-6 bg-blue-900/20">
        <h3 className="text-xl font-bold text-white mb-4">📍 Market Positioning</h3>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Detected Seniority</div>
            <div className="text-2xl font-bold text-blue-400">{data.market_positioning.detected_seniority}</div>
          </div>
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Target Role Alignment</div>
            <div className="text-2xl font-bold text-blue-400">{data.market_positioning.target_role_alignment_score}/100</div>
          </div>
        </div>

        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <h4 className="font-semibold text-red-400 mb-3">Gap Analysis</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-400 mb-2">Missing Hard Skills</div>
              <div className="flex flex-wrap gap-2">
                {data.market_positioning.alignment_gap_analysis.missing_hard_skills.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-2">Missing Soft Skills</div>
              <div className="flex flex-wrap gap-2">
                {data.market_positioning.alignment_gap_analysis.missing_soft_skills.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {data.market_positioning.alignment_gap_analysis.experience_gap && (
            <p className="text-sm text-gray-300">
              <span className="text-yellow-400">⚠ </span>
              {data.market_positioning.alignment_gap_analysis.experience_gap}
            </p>
          )}
        </div>
      </div>

      {/* Career Progression */}
      <div className="border border-gray-700 rounded-lg p-6 bg-purple-900/20">
        <h3 className="text-xl font-bold text-white mb-4">📈 Career Progression</h3>
        
        <div className="space-y-3 mb-4">
          <div className="p-3 bg-gray-900/50 rounded">
            <div className="text-xs text-gray-400">Scope Growth</div>
            <div className="text-sm text-gray-200">{data.career_progression.scope_growth}</div>
          </div>
          {data.career_progression.budget_growth && (
            <div className="p-3 bg-gray-900/50 rounded">
              <div className="text-xs text-gray-400">Budget Growth</div>
              <div className="text-sm text-gray-200">{data.career_progression.budget_growth}</div>
            </div>
          )}
          <div className="p-3 bg-gray-900/50 rounded">
            <div className="text-xs text-gray-400">Impact Growth</div>
            <div className="text-sm text-gray-200">{data.career_progression.impact_growth}</div>
          </div>
          <div className="p-3 bg-gray-900/50 rounded">
            <div className="text-xs text-gray-400">Stakeholder Growth</div>
            <div className="text-sm text-gray-200">{data.career_progression.stakeholder_growth}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-gray-400">Summary Alignment:</span>
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            data.career_progression.summary_alignment === 'strong'
              ? 'bg-green-900/40 text-green-300 border border-green-500/30'
              : data.career_progression.summary_alignment === 'partial'
              ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/30'
              : 'bg-red-900/40 text-red-300 border border-red-500/30'
          }`}>
            {data.career_progression.summary_alignment}
          </span>
        </div>

        {data.career_progression.summary_suggestion && (
          <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded">
            <p className="text-sm text-gray-300">
              <span className="text-purple-400 font-medium">💡 Suggestion: </span>
              {data.career_progression.summary_suggestion}
            </p>
          </div>
        )}
      </div>

      {/* Industry Fit */}
      <div className="border border-gray-700 rounded-lg p-6 bg-green-900/20">
        <h3 className="text-xl font-bold text-white mb-4">🏢 Industry Fit</h3>
        
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Primary Industry Detected</div>
          <div className="text-2xl font-bold text-green-400">{data.industry_fit.primary_industry_detected}</div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Transferable Skills</div>
          <div className="flex flex-wrap gap-2">
            {data.industry_fit.transferable_skills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-green-900/40 text-green-300 rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {data.industry_fit.industry_keywords_missing && data.industry_fit.industry_keywords_missing.length > 0 && (
          <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded">
            <div className="text-sm text-gray-400 mb-2">Industry Keywords Missing</div>
            <div className="flex flex-wrap gap-2">
              {data.industry_fit.industry_keywords_missing.map((keyword, i) => (
                <span key={i} className="px-2 py-1 bg-yellow-900/40 text-yellow-300 rounded text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Perception Signals */}
      <div className="border border-gray-700 rounded-lg p-6 bg-indigo-900/20">
        <h3 className="text-xl font-bold text-white mb-4">👁️ Perception Signals</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Leadership Style</div>
            <div className="text-xl font-bold text-indigo-400">{data.perception_signals.leadership_style}</div>
          </div>
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Adaptability Evidence</div>
            <div className="text-xl font-bold text-indigo-400">{data.perception_signals.adaptability_evidence}</div>
          </div>
        </div>
      </div>

      {/* Recommended Next Steps */}
      <div className="border border-gray-700 rounded-lg p-6 bg-yellow-900/20">
        <h3 className="text-xl font-bold text-white mb-4">🚀 Recommended Next Steps</h3>
        
        <div className="space-y-4">
          {data.recommended_next_steps.map((step, i) => (
            <div key={i} className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-white flex-1">{step.action}</h4>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    step.impact === 'High' ? 'bg-red-900/40 text-red-300' :
                    step.impact === 'Medium' ? 'bg-yellow-900/40 text-yellow-300' :
                    'bg-green-900/40 text-green-300'
                  }`}>
                    {step.impact}
                  </span>
                  <span className="px-2 py-1 bg-blue-900/40 text-blue-300 rounded text-xs">
                    {step.timeframe}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400">{step.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
