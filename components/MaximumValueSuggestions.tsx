'use client';

interface BestBulletTemplate {
  bullet: string;
  why?: string;
  structure: string;
  applyTo: string | string[];
}

interface SkillExperienceAlignment {
  skillsListed: string[];
  experienceMentions: Record<string, number>;
  gaps: Array<{
    type: 'listed_not_used' | 'used_not_listed';
    skill: string;
    suggestion: string;
  }>;
}

interface CareerNarrative {
  progression: string;
  summaryAlignment: 'good' | 'partial' | 'poor';
  suggestion?: string;
}

interface MaximumValueSuggestionsProps {
  bestBulletTemplate?: BestBulletTemplate;
  skillExperienceAlignment?: SkillExperienceAlignment;
  careerNarrative?: CareerNarrative;
}

export default function MaximumValueSuggestions({
  bestBulletTemplate,
  skillExperienceAlignment,
  careerNarrative,
}: MaximumValueSuggestionsProps) {
  // Don't render if no data
  if (!bestBulletTemplate && !skillExperienceAlignment && !careerNarrative) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">✨</span>
        <h3 className="text-xl font-bold text-white">Maximum Value Insights</h3>
      </div>

      {/* Best Bullet Template */}
      {bestBulletTemplate && (
        <div className="border border-emerald-500/30 bg-emerald-900/10 rounded-lg p-6">
          <h4 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
            <span>🎯</span>
            <span>Your Strongest Bullet (Use This Template!)</span>
          </h4>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded p-4 mb-4">
            <p className="text-gray-200 italic">"{bestBulletTemplate.bullet}"</p>
          </div>

          {bestBulletTemplate.why && (
            <div className="text-sm text-gray-300 mb-4 space-y-1">
              {bestBulletTemplate.why.split('✓').filter(Boolean).map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>{item.trim()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-gray-900/50 border border-purple-500/30 rounded p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2">Reusable Template:</p>
            <code className="text-purple-300 text-sm font-mono break-words">
              {bestBulletTemplate.structure}
            </code>
          </div>

          <div className="text-sm text-gray-400">
            <p className="font-medium text-gray-300 mb-2">Apply this structure to:</p>
            {Array.isArray(bestBulletTemplate.applyTo) ? (
              <ul className="list-disc list-inside space-y-1">
                {bestBulletTemplate.applyTo.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{bestBulletTemplate.applyTo}</p>
            )}
          </div>
        </div>
      )}

      {/* Skill-Experience Alignment */}
      {skillExperienceAlignment && skillExperienceAlignment.gaps.length > 0 && (
        <div className="border border-blue-500/30 bg-blue-900/10 rounded-lg p-6">
          <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
            <span>🔍</span>
            <span>Skill-Experience Alignment</span>
          </h4>

          <p className="text-sm text-gray-400 mb-4">
            Comparing your Skills section with Experience mentions:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-300">Skill</th>
                  <th className="text-center py-2 px-3 text-gray-300">Listed?</th>
                  <th className="text-center py-2 px-3 text-gray-300">Used</th>
                  <th className="text-left py-2 px-3 text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {skillExperienceAlignment.gaps.map((gap, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-3 px-3 text-gray-200 font-medium">{gap.skill}</td>
                    <td className="text-center py-3 px-3">
                      {gap.type === 'listed_not_used' ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-3 text-gray-300">
                      {skillExperienceAlignment.experienceMentions[gap.skill] || 0}×
                    </td>
                    <td className="py-3 px-3 text-yellow-300 text-xs">
                      {gap.suggestion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-gray-800/50 rounded text-xs text-gray-400">
            <p className="font-medium text-gray-300 mb-1">Why this matters:</p>
            <p>ATS systems scan for keywords. Skills you use but don't list won't be found. Skills you list but never demonstrate look like padding.</p>
          </div>
        </div>
      )}

      {/* Career Narrative */}
      {careerNarrative && (
        <div className="border border-purple-500/30 bg-purple-900/10 rounded-lg p-6">
          <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
            <span>📈</span>
            <span>Your Career Progression Story</span>
          </h4>

          <div className="bg-gray-800/50 border border-gray-700 rounded p-4 mb-4">
            <p className="text-gray-200 text-sm leading-relaxed">
              {careerNarrative.progression}
            </p>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-400">Summary Alignment:</span>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                careerNarrative.summaryAlignment === 'good'
                  ? 'bg-green-900/40 text-green-300 border border-green-500/30'
                  : careerNarrative.summaryAlignment === 'partial'
                  ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/30'
                  : 'bg-red-900/40 text-red-300 border border-red-500/30'
              }`}
            >
              {careerNarrative.summaryAlignment === 'good' && '✓ Good'}
              {careerNarrative.summaryAlignment === 'partial' && '⚠ Partial'}
              {careerNarrative.summaryAlignment === 'poor' && '✗ Poor'}
            </span>
          </div>

          {careerNarrative.suggestion && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-4">
              <p className="text-sm text-gray-300">
                <span className="text-purple-400 font-medium">💡 Suggestion: </span>
                {careerNarrative.suggestion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
