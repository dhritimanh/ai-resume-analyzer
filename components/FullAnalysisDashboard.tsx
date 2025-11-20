'use client';

import { useState, useEffect } from 'react';
import type {
  QuickAnalysisResult,
  SectionAnalysisResult,
  LanguageBrandingResult,
  CareerTailoringResult,
  DeepInsightsResult,
} from '@/lib/resume-analysis';

interface FullAnalysisDashboardProps {
  resumeContent: string;
  resumeData?: any;
  onBack?: () => void;
}

type AnalysisTab = 'quick' | 'section' | 'language' | 'career' | 'insights';

export default function FullAnalysisDashboard({ resumeContent, resumeData, onBack }: FullAnalysisDashboardProps) {
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('quick');
  const [loading, setLoading] = useState<Record<AnalysisTab, boolean>>({
    quick: false,
    section: false,
    language: false,
    career: false,
    insights: false,
  });
  
  const [retryMessage, setRetryMessage] = useState<string>('');
  
  const [results, setResults] = useState<{
    quick: QuickAnalysisResult | null;
    section: SectionAnalysisResult | null;
    language: LanguageBrandingResult | null;
    career: CareerTailoringResult | null;
    insights: DeepInsightsResult | null;
  }>({
    quick: null,
    section: null,
    language: null,
    career: null,
    insights: null,
  });

  // Auto-run quick analysis on mount
  useEffect(() => {
    runAnalysis('quick');
  }, []);

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    
    try {
      const response = await fetch('/api/generate-analysis-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickAnalysis: results.quick,
          sectionAnalysis: results.section,
          languageAnalysis: results.language,
          careerAnalysis: results.career,
          insightsAnalysis: results.insights,
          resumeData: resumeData,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume-analysis-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download analysis report. Please try again.');
    } finally {
      setDownloadingReport(false);
    }
  };

  const runAnalysis = async (tab: AnalysisTab) => {
    if (results[tab]) return; // Already have results
    
    setLoading(prev => ({ ...prev, [tab]: true }));
    setRetryMessage('');
    
    try {
      const inferredJobTarget = results.quick?.inferredJobTarget || 'Unknown';
      
      switch (tab) {
        case 'quick':
          const quickResponse = await fetch('/api/analysis/quick', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeContent }),
          });
          if (!quickResponse.ok) throw new Error('Quick analysis failed');
          const quickResult = await quickResponse.json();
          setResults(prev => ({ ...prev, quick: quickResult }));
          break;
          
        case 'section':
          const sectionResponse = await fetch('/api/analysis/section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeContent, inferredJobTarget }),
          });
          if (!sectionResponse.ok) {
            const errorData = await sectionResponse.json();
            throw new Error(errorData.error || 'Section analysis failed');
          }
          const sectionResult = await sectionResponse.json();
          setResults(prev => ({ ...prev, section: sectionResult }));
          break;
          
        case 'language':
          const languageResponse = await fetch('/api/analysis/language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeContent, inferredJobTarget }),
          });
          if (!languageResponse.ok) throw new Error('Language analysis failed');
          const languageResult = await languageResponse.json();
          setResults(prev => ({ ...prev, language: languageResult }));
          break;
          
        case 'career':
          const careerResponse = await fetch('/api/analysis/career', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeContent, inferredJobTarget }),
          });
          if (!careerResponse.ok) throw new Error('Career analysis failed');
          const careerResult = await careerResponse.json();
          setResults(prev => ({ ...prev, career: careerResult }));
          break;
          
        case 'insights':
          const skills = results.quick?.keyStrengths || [];
          const roles = results.career?.careerRoadmap.target_roles || [];
          const insightsResponse = await fetch('/api/analysis/insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeContent, inferredJobTarget, skills, roles }),
          });
          if (!insightsResponse.ok) throw new Error('Insights analysis failed');
          const insightsResult = await insightsResponse.json();
          setResults(prev => ({ ...prev, insights: insightsResult }));
          break;
      }
    } catch (error: any) {
      console.error(`${tab} analysis error:`, error);
      
      // Check if it's a rate limit error
      const isRateLimit = 
        error.response?.data?.error?.type === 'rate_limit_reached_error' ||
        error.response?.status === 429 ||
        error.message?.includes('rate_limit') ||
        error.message?.includes('concurrency');
      
      // Check if it's a JSON parsing error
      const isJsonError = 
        error.message?.includes('JSON') ||
        error.message?.includes('parse') ||
        error.message?.includes('truncated') ||
        error.message?.includes('incomplete') ||
        error.message?.includes('Unterminated');
      
      if (isRateLimit) {
        setRetryMessage('⏳ High demand detected. Automatically retrying in a few seconds...');
        // Auto-retry after 4 seconds for rate limits
        setTimeout(() => {
          setRetryMessage('');
          runAnalysis(tab);
        }, 4000);
      } else if (isJsonError) {
        setRetryMessage('🔄 AI response was incomplete. Retrying with optimized settings...');
        // Auto-retry after 2 seconds for JSON errors
        setTimeout(() => {
          setRetryMessage('');
          runAnalysis(tab);
        }, 2000);
      } else {
        setRetryMessage('');
        alert(`Failed to run ${tab} analysis: ${error.message || 'Unknown error'}. Please try again.`);
      }
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
            <h1 className="text-3xl text-white font-bold text-gray-900">Full Resume Analysis</h1>
            <p className="text-white mt-1">Comprehensive insights across 5 categories</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Overall Score */}
        {results.quick && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Overall Resume Score</div>
                <div className="text-5xl font-bold">{results.quick.scores.overall}/100</div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{results.quick.scores.ats}</div>
                  <div className="text-xs opacity-90">ATS</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{results.quick.scores.clarity}</div>
                  <div className="text-xs opacity-90">Clarity</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{results.quick.scores.impact}</div>
                  <div className="text-xs opacity-90">Impact</div>
                </div>
              </div>
            </div>
            
            {/* Download Report Button */}
            <button
              onClick={handleDownloadReport}
              disabled={downloadingReport}
              className="w-full bg-white text-purple-600 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {downloadingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  📄 Download Analysis Report PDF
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'quick', label: '⚡ Quick Analysis', color: 'purple' },
            { id: 'section', label: '📝 Sections', color: 'blue' },
            { id: 'language', label: '✍️ Language', color: 'green' },
            { id: 'career', label: '🎯 Career', color: 'yellow' },
            { id: 'insights', label: '🧠 Insights', color: 'pink' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id as AnalysisTab)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
              {loading[tab.id as AnalysisTab] && ' ⏳'}
              {results[tab.id as AnalysisTab] && !loading[tab.id as AnalysisTab] && ' ✓'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {retryMessage && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <p className="text-sm text-yellow-800 font-medium">{retryMessage}</p>
            </div>
          </div>
        )}
        
        {loading[activeTab] ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing your resume...</p>
            <p className="text-sm text-gray-500 mt-2">This may take 5-10 seconds</p>
          </div>
        ) : (
          <>
            {activeTab === 'quick' && results.quick && (
              <QuickAnalysisView data={results.quick} />
            )}
            {activeTab === 'section' && results.section && (
              <SectionAnalysisView data={results.section} />
            )}
            {activeTab === 'language' && results.language && (
              <LanguageAnalysisView data={results.language} />
            )}
            {activeTab === 'career' && results.career && (
              <CareerAnalysisView data={results.career} />
            )}
            {activeTab === 'insights' && results.insights && (
              <InsightsAnalysisView data={results.insights} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Individual view components (placeholders - you'll expand these)
function QuickAnalysisView({ data }: { data: QuickAnalysisResult }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Quick Analysis</h2>
      
      {/* Quick Wins */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Wins</h3>
        <div className="space-y-2">
          {data.quickWins.map((win, idx) => (
            <div key={idx} className={`p-4 rounded-lg border-l-4 ${
              win.priority === 'High' ? 'border-red-500 bg-red-50' :
              win.priority === 'Medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-green-500 bg-green-50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{win.text}</div>
                  <div className="text-xs text-gray-600 mt-1">Section: {win.section}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                  win.priority === 'High' ? 'bg-red-100 text-red-700' :
                  win.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {win.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Issues */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Strengths</h3>
          <ul className="space-y-2">
            {data.keyStrengths.map((strength, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Issues</h3>
          <ul className="space-y-2">
            {data.topIssues.map((issue, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SectionAnalysisView({ data }: { data: SectionAnalysisResult }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Section-by-Section Analysis</h2>
        <p className="text-gray-600">Detailed breakdown of each resume section</p>
      </div>

      {/* Section Cards */}
      <div className="space-y-6">
        {data.sectionAnalysis.map((section, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{section.name}</h3>
              <div className="text-right">
                <div className="text-sm text-gray-600">Relevance</div>
                <div className="text-lg font-bold text-indigo-600">{section.jobTargetRelevance}</div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{section.metrics.word_count}</div>
                <div className="text-xs text-gray-600">Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{section.metrics.readability_score}</div>
                <div className="text-xs text-gray-600">Readability</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{Math.round(section.metrics.quantification_ratio * 100)}%</div>
                <div className="text-xs text-gray-600">Quantified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{section.metrics.keyword_density}</div>
                <div className="text-xs text-gray-600">Keywords</div>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-3 mb-4">
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Content: </span>
                <span className="text-gray-600">{section.feedback.content_relevance}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Structure: </span>
                <span className="text-gray-600">{section.feedback.structure_clarity}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Impact: </span>
                <span className="text-gray-600">{section.feedback.impact_assessment}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Branding: </span>
                <span className="text-gray-600">{section.feedback.branding_potential}</span>
              </div>
            </div>

            {/* Suggestions */}
            {section.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Suggestions</h4>
                <div className="space-y-2">
                  {section.suggestions.map((suggestion, sIdx) => (
                    <div key={sIdx} className={`p-3 rounded-lg text-sm border-l-4 ${
                      suggestion.priority === 'High' ? 'border-red-500 bg-red-50' :
                      suggestion.priority === 'Medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-green-500 bg-green-50'
                    }`}>
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-gray-900">{suggestion.text}</span>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ml-2 ${
                          suggestion.priority === 'High' ? 'bg-red-100 text-red-700' :
                          suggestion.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      {suggestion.example && (
                        <div className="text-xs text-gray-600 mt-1 italic">Example: {suggestion.example}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Formatting Analysis */}
      <div className="border border-gray-200 rounded-lg p-6 bg-blue-50">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📄 Formatting & ATS Compatibility</h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.formattingAnalysis.metrics.font_consistency_score}</div>
            <div className="text-xs text-gray-600">Font Consistency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.formattingAnalysis.metrics.whitespace_usage_score}</div>
            <div className="text-xs text-gray-600">Whitespace</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.formattingAnalysis.metrics.visual_hierarchy_score}</div>
            <div className="text-xs text-gray-600">Visual Hierarchy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.formattingAnalysis.metrics.readability_formatting_score}</div>
            <div className="text-xs text-gray-600">Readability</div>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-3">{data.formattingAnalysis.feedback}</p>
        <div className="text-sm">
          <span className="font-semibold text-gray-900">ATS Compatibility: </span>
          <span className="text-gray-700">{data.formattingAnalysis.atsCompatibility}</span>
        </div>
      </div>

      {/* Quantification Analysis */}
      <div className="border border-gray-200 rounded-lg p-6 bg-green-50">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Quantification Analysis</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.quantificationAnalysis.metrics.quantification_impact_score}</div>
            <div className="text-xs text-gray-600">Impact Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.quantificationAnalysis.metrics.quantification_clarity_score}</div>
            <div className="text-xs text-gray-600">Clarity Score</div>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-3">{data.quantificationAnalysis.feedback}</p>
        {data.quantificationAnalysis.examples.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Examples of Strong Metrics:</h4>
            <ul className="space-y-1">
              {data.quantificationAnalysis.examples.map((example, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="text-green-500 mr-2">→</span>
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function LanguageAnalysisView({ data }: { data: LanguageBrandingResult }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Language & Personal Branding</h2>
        <p className="text-gray-600">Writing quality, vocabulary, and brand assessment</p>
      </div>

      {/* Language Analysis */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">✍️ Language Quality</h3>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.languageAnalysis.word_count}</div>
            <div className="text-xs text-gray-600">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.languageAnalysis.unique_word_count}</div>
            <div className="text-xs text-gray-600">Unique Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.languageAnalysis.avg_sentence_length}</div>
            <div className="text-xs text-gray-600">Avg Sentence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.languageAnalysis.grammar_issues.total}</div>
            <div className="text-xs text-gray-600">Grammar Issues</div>
          </div>
        </div>

        {/* Grammar Issues Breakdown */}
        {data.languageAnalysis.grammar_issues.total > 0 && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-semibold text-gray-900 mb-3">Grammar Issues by Type</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-lg font-bold text-red-600">{data.languageAnalysis.grammar_issues.by_type['Subject-Verb']}</div>
                <div className="text-xs text-gray-600">Subject-Verb</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{data.languageAnalysis.grammar_issues.by_type.Tense}</div>
                <div className="text-xs text-gray-600">Tense</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{data.languageAnalysis.grammar_issues.by_type.Punctuation}</div>
                <div className="text-xs text-gray-600">Punctuation</div>
              </div>
            </div>
          </div>
        )}

        {/* Vocabulary Scores */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Vocabulary Richness</h4>
              <span className="text-2xl font-bold text-blue-600">{data.languageAnalysis.vocabulary_richness.score}/100</span>
            </div>
            <p className="text-sm text-gray-600">{data.languageAnalysis.vocabulary_richness.reason}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Vocabulary Level</h4>
              <span className="text-2xl font-bold text-purple-600">{data.languageAnalysis.vocabulary_level_appropriateness.score}/100</span>
            </div>
            <p className="text-sm text-gray-600">{data.languageAnalysis.vocabulary_level_appropriateness.reason}</p>
          </div>
        </div>

        {/* Action Verbs */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Action Verb Usage ({data.languageAnalysis.action_verb_usage.total_percentage}%)</h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <div className="text-xl font-bold text-red-600">{data.languageAnalysis.action_verb_usage.by_strength.weak}</div>
              <div className="text-xs text-gray-600">Weak Verbs</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-center">
              <div className="text-xl font-bold text-yellow-600">{data.languageAnalysis.action_verb_usage.by_strength.medium}</div>
              <div className="text-xs text-gray-600">Medium Verbs</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-xl font-bold text-green-600">{data.languageAnalysis.action_verb_usage.by_strength.strong}</div>
              <div className="text-xs text-gray-600">Strong Verbs</div>
            </div>
          </div>
          {data.languageAnalysis.action_verb_usage.examples.length > 0 && (
            <div className="space-y-2">
              {data.languageAnalysis.action_verb_usage.examples.slice(0, 5).map((example, idx) => (
                <div key={idx} className={`p-2 rounded text-sm ${
                  example.strength === 'strong' ? 'bg-green-50 border-l-4 border-green-500' :
                  example.strength === 'medium' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                  'bg-red-50 border-l-4 border-red-500'
                }`}>
                  <span className="font-semibold">{example.verb}</span> - {example.context}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tone */}
        <div className="p-4 bg-indigo-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">Tone: {data.languageAnalysis.tone.primary_tone}</h4>
            <span className="text-2xl font-bold text-indigo-600">{data.languageAnalysis.tone.score}/100</span>
          </div>
          <p className="text-sm text-gray-600">{data.languageAnalysis.tone.reason}</p>
        </div>

        {/* Suggestions */}
        {data.languageAnalysis.suggestions.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Suggestions</h4>
            <ul className="space-y-2">
              {data.languageAnalysis.suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start p-3 bg-gray-50 rounded">
                  <span className="text-indigo-500 mr-2">→</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Personal Branding */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🎨 Personal Branding</h3>
        
        {/* Brand Scores */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">Brand Clarity</h4>
              <span className="text-xl font-bold text-purple-600">{data.personalBrandingAnalysis.metrics.brand_clarity_score.score}/100</span>
            </div>
            <p className="text-xs text-gray-600">{data.personalBrandingAnalysis.metrics.brand_clarity_score.reason}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">Brand Consistency</h4>
              <span className="text-xl font-bold text-purple-600">{data.personalBrandingAnalysis.metrics.brand_consistency_score.score}/100</span>
            </div>
            <p className="text-xs text-gray-600">{data.personalBrandingAnalysis.metrics.brand_consistency_score.reason}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">Brand Uniqueness</h4>
              <span className="text-xl font-bold text-purple-600">{data.personalBrandingAnalysis.metrics.brand_uniqueness_score.score}/100</span>
            </div>
            <p className="text-xs text-gray-600">{data.personalBrandingAnalysis.metrics.brand_uniqueness_score.reason}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">Visual Branding</h4>
              <span className="text-xl font-bold text-purple-600">{data.personalBrandingAnalysis.metrics.visual_branding.score}/100</span>
            </div>
            <p className="text-xs text-gray-600">{data.personalBrandingAnalysis.metrics.visual_branding.reason}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Overall Feedback</h4>
          <p className="text-sm text-gray-700">{data.personalBrandingAnalysis.feedback}</p>
        </div>

        {data.personalBrandingAnalysis.suggestions.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Branding Suggestions</h4>
            <ul className="space-y-2">
              {data.personalBrandingAnalysis.suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start p-3 bg-white rounded shadow-sm">
                  <span className="text-purple-500 mr-2">✨</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function CareerAnalysisView({ data }: { data: CareerTailoringResult }) {
  const [selectedRole, setSelectedRole] = useState(0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Career Roadmap & Tailoring</h2>
        <p className="text-gray-600">Target roles, skill gaps, and career progression plan</p>
      </div>

      {/* Tailoring Analysis */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Job Target Alignment</h3>
        <div className="mb-4">
          <span className="text-lg font-semibold text-indigo-600">{data.tailoringAnalysis.job_target}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-white rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-indigo-600">{data.tailoringAnalysis.metrics.keyword_match_score.score}/100</div>
            <div className="text-xs text-gray-600 mb-2">Keyword Match</div>
            <p className="text-xs text-gray-600">{data.tailoringAnalysis.metrics.keyword_match_score.reason}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-indigo-600">{data.tailoringAnalysis.metrics.skill_alignment_score.score}/100</div>
            <div className="text-xs text-gray-600 mb-2">Skill Alignment</div>
            <p className="text-xs text-gray-600">{data.tailoringAnalysis.metrics.skill_alignment_score.reason}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-indigo-600">{data.tailoringAnalysis.metrics.experience_relevance_score.score}/100</div>
            <div className="text-xs text-gray-600 mb-2">Experience Relevance</div>
            <p className="text-xs text-gray-600">{data.tailoringAnalysis.metrics.experience_relevance_score.reason}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm mb-4">
          <p className="text-sm text-gray-700">{data.tailoringAnalysis.feedback}</p>
        </div>

        {data.tailoringAnalysis.suggestions.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Tailoring Suggestions</h4>
            <ul className="space-y-2">
              {data.tailoringAnalysis.suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start p-3 bg-white rounded shadow-sm">
                  <span className="text-indigo-500 mr-2">→</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Career Roadmap */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Career Roadmap</h3>
        
        {/* Role Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {data.careerRoadmap.target_roles.map((role, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedRole(idx)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedRole === idx
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {role.role_name}
            </button>
          ))}
        </div>

        {/* Selected Role Details */}
        {data.careerRoadmap.target_roles[selectedRole] && (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    {data.careerRoadmap.target_roles[selectedRole].role_name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>⏱️ {data.careerRoadmap.target_roles[selectedRole].timeframe}</span>
                    <span>🎯 Priority: {data.careerRoadmap.target_roles[selectedRole].priority}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">{data.careerRoadmap.target_roles[selectedRole].description}</p>
              <p className="text-sm text-gray-600 italic">{data.careerRoadmap.target_roles[selectedRole].justification}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.careerRoadmap.target_roles[selectedRole].metrics.skill_match_percentage}%
                </div>
                <div className="text-xs text-gray-600">Skill Match</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.careerRoadmap.target_roles[selectedRole].metrics.experience_relevance_score}
                </div>
                <div className="text-xs text-gray-600">Experience Relevance</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.careerRoadmap.target_roles[selectedRole].metrics.growth_potential_score}
                </div>
                <div className="text-xs text-gray-600">Growth Potential</div>
              </div>
            </div>

            {/* Career Path */}
            {data.careerRoadmap.target_roles[selectedRole].career_path.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Career Path</h4>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {data.careerRoadmap.target_roles[selectedRole].career_path.map((step, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="px-4 py-2 bg-white rounded-lg shadow-sm whitespace-nowrap text-sm font-medium">
                        {step}
                      </div>
                      {idx < data.careerRoadmap.target_roles[selectedRole].career_path.length - 1 && (
                        <span className="mx-2 text-gray-400">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Missing Skills</h4>
                <ul className="space-y-1">
                  {data.careerRoadmap.target_roles[selectedRole].gaps.missing_skills.map((skill, idx) => (
                    <li key={idx} className="text-xs text-gray-700">• {skill}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Missing Experience</h4>
                <ul className="space-y-1">
                  {data.careerRoadmap.target_roles[selectedRole].gaps.missing_experience.map((exp, idx) => (
                    <li key={idx} className="text-xs text-gray-700">• {exp}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Suggested Certifications</h4>
                <ul className="space-y-1">
                  {data.careerRoadmap.target_roles[selectedRole].gaps.suggested_certifications.map((cert, idx) => (
                    <li key={idx} className="text-xs text-gray-700">• {cert}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Goals */}
            {data.careerRoadmap.target_roles[selectedRole].goals.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Action Goals</h4>
                <div className="space-y-2">
                  {data.careerRoadmap.target_roles[selectedRole].goals.map((goal, idx) => (
                    <div key={idx} className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">{goal.title}</h5>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          goal.status === 'completed' ? 'bg-green-100 text-green-700' :
                          goal.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {goal.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>📁 {goal.category.replace('_', ' ')}</span>
                        <span>💪 Impact: {goal.impact_score}/100</span>
                        <span>📅 {goal.deadline}</span>
                        <span>🎯 {goal.priority.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Life Integration */}
      <div className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-3">🌟 Life Integration</h3>
        <p className="text-sm text-gray-700">{data.careerRoadmap.life_integration}</p>
      </div>
    </div>
  );
}

function InsightsAnalysisView({ data }: { data: DeepInsightsResult }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Deep Insights & Analysis</h2>
        <p className="text-gray-600">Psychological profile, industry fit, and cultural alignment</p>
      </div>

      {/* Psychological Insights */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🧠 Psychological Profile</h3>
        
        {/* Work Style */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Work Style Preferences</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Team Orientation</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${data.psychologicalInsights.workStylePreferences.team_orientation}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.psychologicalInsights.workStylePreferences.team_orientation}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Structure Preference</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${data.psychologicalInsights.workStylePreferences.structure_preference}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.psychologicalInsights.workStylePreferences.structure_preference}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Risk Tolerance</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${data.psychologicalInsights.workStylePreferences.risk_tolerance}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.psychologicalInsights.workStylePreferences.risk_tolerance}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Work Pace</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${data.psychologicalInsights.workStylePreferences.work_pace}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.psychologicalInsights.workStylePreferences.work_pace}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600">Feedback Style</div>
              <div className="text-sm font-semibold text-gray-900">{data.psychologicalInsights.workStylePreferences.feedback_style}</div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600">Decision Making</div>
              <div className="text-sm font-semibold text-gray-900">{data.psychologicalInsights.workStylePreferences.decision_making}</div>
            </div>
          </div>
        </div>

        {/* Communication Style */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Communication Style</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg col-span-2">
              <div className="text-xs text-gray-600">Primary Style</div>
              <div className="text-lg font-semibold text-purple-600">{data.psychologicalInsights.communicationStyle.primary_style}</div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Formality Level</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-pink-600 h-2 rounded-full" style={{ width: `${data.psychologicalInsights.communicationStyle.formality_level}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.psychologicalInsights.communicationStyle.formality_level}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Detail Orientation</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-pink-600 h-2 rounded-full" style={{ width: `${data.psychologicalInsights.communicationStyle.detail_orientation}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.psychologicalInsights.communicationStyle.detail_orientation}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg col-span-2">
              <div className="text-xs text-gray-600 mb-1">Assertiveness</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-pink-600 h-2 rounded-full" style={{ width: `${data.psychologicalInsights.communicationStyle.assertiveness}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.psychologicalInsights.communicationStyle.assertiveness}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Drivers */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Motivational Drivers</h4>
          <div className="space-y-2">
            {data.psychologicalInsights.motivationalDrivers.map((driver, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{driver.driver}</span>
                  <span className="text-sm font-bold text-purple-600">{driver.strength}/100</span>
                </div>
                <p className="text-xs text-gray-600">{driver.evidence}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Style */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Learning Style</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg col-span-2">
              <div className="text-xs text-gray-600">Primary Style</div>
              <div className="text-lg font-semibold text-purple-600">{data.psychologicalInsights.learningStyle.primary_style}</div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Learning Velocity</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${data.psychologicalInsights.learningStyle.learning_velocity}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.psychologicalInsights.learningStyle.learning_velocity}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Adaptability</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${data.psychologicalInsights.learningStyle.adaptability}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.psychologicalInsights.learningStyle.adaptability}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg col-span-2">
              <div className="text-xs text-gray-600 mb-1">Knowledge: Depth vs Breadth</div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Depth</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${data.psychologicalInsights.learningStyle.knowledge_depth_vs_breadth}%` }}></div>
                </div>
                <span className="text-xs">Breadth</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Analysis */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🏢 Industry Analysis</h3>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Industry Alignment</h4>
          <div className="p-4 bg-white rounded-lg mb-3">
            <div className="text-xs text-gray-600">Primary Industry</div>
            <div className="text-xl font-bold text-blue-600">{data.industryAnalysis.industryAlignment.primary_industry}</div>
          </div>
          <div className="p-4 bg-white rounded-lg mb-3">
            <div className="text-xs text-gray-600 mb-2">Secondary Industries</div>
            <div className="flex flex-wrap gap-2">
              {data.industryAnalysis.industryAlignment.secondary_industries.map((industry, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {industry}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg mb-3">
            <div className="text-xs text-gray-600">Industry Trajectory</div>
            <div className="text-lg font-semibold text-gray-900">{data.industryAnalysis.industryAlignment.industry_trajectory}</div>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600">Trends Alignment</div>
              <span className="text-xl font-bold text-blue-600">{data.industryAnalysis.industryAlignment.industry_trends_alignment.score}/100</span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{data.industryAnalysis.industryAlignment.industry_trends_alignment.reason}</p>
            <div className="flex flex-wrap gap-2">
              {data.industryAnalysis.industryAlignment.industry_trends_alignment.trends.map((trend, idx) => (
                <span key={idx} className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">
                  {trend}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Competitive Position</h4>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="p-3 bg-white rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{data.industryAnalysis.competitivePosition.industry_specific_skills_score}</div>
              <div className="text-xs text-gray-600">Industry Skills</div>
            </div>
            <div className="p-3 bg-white rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{data.industryAnalysis.competitivePosition.experience_depth_score}</div>
              <div className="text-xs text-gray-600">Experience Depth</div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <div className="text-xs text-gray-600 mb-2">Unique Selling Points</div>
            <ul className="space-y-1">
              {data.industryAnalysis.competitivePosition.unique_selling_points.map((point, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Industry-Specific Suggestions</h4>
          <div className="space-y-2">
            {data.industryAnalysis.industrySpecificSuggestions.map((suggestion, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm text-gray-900">{suggestion.suggestion}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold ml-2">
                    {suggestion.timeframe}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Impact: {suggestion.impact}/100</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cultural Fit */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-green-50 to-emerald-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🌍 Cultural Fit Assessment</h3>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Work Values</h4>
          <div className="space-y-2">
            {data.culturalFitAssessment.workValues.map((value, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{value.value}</span>
                  <span className="text-sm font-bold text-green-600">{value.strength}/100</span>
                </div>
                <p className="text-xs text-gray-600">{value.evidence}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Organization Type Alignment</h4>
          <div className="space-y-2">
            {Object.entries(data.culturalFitAssessment.organizationTypeAlignment).map(([type, score]) => (
              <div key={type} className="p-3 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 capitalize">{type.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-green-600">{score}/100</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${score}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Leadership Style Preference</div>
            <div className="text-lg font-semibold text-green-600">{data.culturalFitAssessment.leadershipStylePreference}</div>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600">Cultural Adaptability</div>
              <span className="text-lg font-bold text-green-600">{data.culturalFitAssessment.culturalAdaptability.score}/100</span>
            </div>
            <p className="text-xs text-gray-600">{data.culturalFitAssessment.culturalAdaptability.reason}</p>
          </div>
        </div>
      </div>

      {/* Learning & Development */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Learning & Development Profile</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Education Pattern</div>
            <div className="text-sm font-semibold text-gray-900">{data.learningAndDevelopmentProfile.formalEducationPattern}</div>
          </div>
          <div className="p-4 bg-white rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.learningAndDevelopmentProfile.skillAcquisitionSpeed}</div>
            <div className="text-xs text-gray-600">Skill Acquisition Speed</div>
          </div>
          <div className="p-4 bg-white rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.learningAndDevelopmentProfile.continuousLearningIndicators}</div>
            <div className="text-xs text-gray-600">Learning Indicators</div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Knowledge Gaps</h4>
          <div className="space-y-2">
            {data.learningAndDevelopmentProfile.knowledgeGaps.map((gap, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{gap.area}</span>
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-semibold">
                    Criticality: {gap.criticality}/100
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-1">Suggested Resources:</div>
                <div className="flex flex-wrap gap-1">
                  {gap.suggested_resources.map((resource, rIdx) => (
                    <span key={rIdx} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                      {resource}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Mentorship Potential</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{data.learningAndDevelopmentProfile.mentorshipPotential.as_mentor}</div>
              <div className="text-xs text-gray-600">As Mentor</div>
            </div>
            <div className="p-4 bg-white rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{data.learningAndDevelopmentProfile.mentorshipPotential.as_mentee}</div>
              <div className="text-xs text-gray-600">As Mentee</div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Analysis */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🤝 Network Analysis</h3>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Collaboration Patterns</h4>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Cross-Functional</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${data.networkAnalysis.collaborationPatterns.cross_functional}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.networkAnalysis.collaborationPatterns.cross_functional}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Leadership</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${data.networkAnalysis.collaborationPatterns.leadership}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.networkAnalysis.collaborationPatterns.leadership}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg col-span-2">
              <div className="text-xs text-gray-600 mb-1">Individual Contribution</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${data.networkAnalysis.collaborationPatterns.individual_contribution}%` }}></div>
                </div>
                <span className="text-sm font-bold">{data.networkAnalysis.collaborationPatterns.individual_contribution}</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <div className="text-xs text-gray-600">Primary Mode</div>
            <div className="text-lg font-semibold text-indigo-600">{data.networkAnalysis.collaborationPatterns.primary_mode}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">{data.networkAnalysis.industryConnectivity}</div>
            <div className="text-xs text-gray-600">Industry Connectivity</div>
          </div>
          <div className="p-4 bg-white rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">{data.networkAnalysis.networkDiversity}</div>
            <div className="text-xs text-gray-600">Network Diversity</div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Network Strengths</h4>
          <div className="p-4 bg-white rounded-lg">
            <ul className="space-y-1">
              {data.networkAnalysis.networkStrengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Network Growth Strategies</h4>
          <div className="space-y-2">
            {data.networkAnalysis.networkGrowthStrategies.map((strategy, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm text-gray-900">{strategy.strategy}</span>
                  <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-semibold ml-2">
                    {strategy.timeframe}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Impact: {strategy.impact}/100</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
