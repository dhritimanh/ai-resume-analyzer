'use client';

import { useEffect, useState } from 'react';
import { QuickAnalysisResult, getScoreColor, getScoreLabel } from '@/lib/resume-analysis/quick-analysis';

interface QuickAnalysisProps {
  resumeContent: string;
  onUpgrade?: () => void;
}

export default function QuickAnalysis({ resumeContent, onUpgrade }: QuickAnalysisProps) {
  const [analysis, setAnalysis] = useState<QuickAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (resumeContent) {
      analyzeResume();
    }
  }, [resumeContent]);

  const analyzeResume = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analysis/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error('Quick analysis error:', err);
      
      // Check if it's a rate limit error
      const isRateLimit = 
        err.message?.includes('rate_limit') ||
        err.message?.includes('concurrency') ||
        err.message?.includes('429');
      
      if (isRateLimit && retryCount < 3) {
        // Auto-retry after delay
        const delay = 3000 * (retryCount + 1); // 3s, 6s, 9s
        setError(`High demand detected. Retrying in ${delay / 1000} seconds...`);
        setRetryCount(prev => prev + 1);
        
        setTimeout(() => {
          analyzeResume();
        }, delay);
      } else {
        setError(isRateLimit 
          ? 'Service is experiencing high demand. Please try again in a moment.'
          : 'Failed to analyze resume. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#2a2a2a] rounded w-3/4"></div>
          <div className="h-4 bg-[#2a2a2a] rounded w-1/2"></div>
          <div className="h-4 bg-[#2a2a2a] rounded w-5/6"></div>
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">Analyzing your resume...</p>
      </div>
    );
  }

  if (error) {
    const isRetrying = error.includes('Retrying');
    return (
      <div className={`border rounded-xl p-6 ${
        isRetrying ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-start gap-3">
          {isRetrying && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mt-0.5"></div>
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${isRetrying ? 'text-yellow-800' : 'text-red-800'}`}>
              {error}
            </p>
            {!isRetrying && (
              <button
                onClick={() => {
                  setRetryCount(0);
                  analyzeResume();
                }}
                className="mt-3 text-sm text-red-600 hover:text-red-800 underline font-medium"
              >
                Retry Analysis
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
        
        <p className="text-sm text-white"><b className='font-semibold'>Target Role</b>: {analysis.inferredJobTarget}</p>
      </div>

      {/* Scores */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(analysis.scores.overall)} mb-2`}>
              {analysis.scores.overall}
            </div>
            <div className="text-sm font-semibold text-white">Overall Score</div>
            <div className={`text-xs font-medium mt-1 ${getScoreColor(analysis.scores.overall)}`}>
              {getScoreLabel(analysis.scores.overall)}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">ATS Compatibility</span>
                <span className={`text-sm font-bold ${getScoreColor(analysis.scores.ats)}`}>
                  {analysis.scores.ats}
                </span>
              </div>
              <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    analysis.scores.ats >= 80 ? 'bg-emerald-400/60' :
                    analysis.scores.ats >= 60 ? 'bg-amber-400/60' : 'bg-rose-400/60'
                  }`}
                  style={{ width: `${analysis.scores.ats}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Clarity</span>
                <span className={`text-sm font-bold ${getScoreColor(analysis.scores.clarity)}`}>
                  {analysis.scores.clarity}
                </span>
              </div>
              <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    analysis.scores.clarity >= 80 ? 'bg-emerald-400/60' :
                    analysis.scores.clarity >= 60 ? 'bg-amber-400/60' : 'bg-rose-400/60'
                  }`}
                  style={{ width: `${analysis.scores.clarity}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Impact</span>
                <span className={`text-sm font-bold ${getScoreColor(analysis.scores.impact)}`}>
                  {analysis.scores.impact}
                </span>
              </div>
              <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    analysis.scores.impact >= 80 ? 'bg-emerald-400/60' :
                    analysis.scores.impact >= 60 ? 'bg-amber-400/60' : 'bg-rose-400/60'
                  }`}
                  style={{ width: `${analysis.scores.impact}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Wins */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white">⚡ Quick Wins</h4>
          <span className="text-xs text-gray-500">{analysis.quickWins.length} actions</span>
        </div>
        <div className="space-y-3">
          {analysis.quickWins.map((win, idx) => (
            <div key={idx} className={`rounded-lg p-3 border-l-2 ${
              win.priority === 'High' ? 'bg-[#1a1a1a]/80 border-red-500/30' :
              win.priority === 'Medium' ? 'bg-[#1a1a1a]/80 border-yellow-500/30' :
              'bg-[#1a1a1a]/80 border-blue-500/30'
            }`}>
              <div className="flex items-start gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  win.priority === 'High' ? 'text-red-400/80' :
                  win.priority === 'Medium' ? 'text-yellow-400/80' :
                  'text-blue-400/80'
                }`}>
                  {win.priority === 'High' ? '🔥' : win.priority === 'Medium' ? '⚡' : '💡'} {win.priority}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-normal text-gray-400 leading-relaxed">{win.text}</p>
                  <p className="text-xs text-gray-600 mt-1">📍 {win.section}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Issues */}
      <div className="p-6 grid grid-cols-2 gap-4 border-b border-[#2a2a2a]">
        <div>
          <h4 className="text-xs font-semibold text-green-400 mb-2">✓ Strengths</h4>
          <ul className="space-y-1">
            {analysis.keyStrengths.map((strength, idx) => (
              <li key={idx} className="text-xs text-gray-400">• {strength}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-red-400 mb-2">⚠ Top Issues</h4>
          <ul className="space-y-1">
            {analysis.topIssues.map((issue, idx) => (
              <li key={idx} className="text-xs text-gray-400">• {issue}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
