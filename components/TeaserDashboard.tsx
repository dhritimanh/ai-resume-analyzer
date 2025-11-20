'use client';

import { ResumeData, TemplateType } from '@/types/resume';
import QuickAnalysisFree from './QuickAnalysisFree';
import ResumePreview from './ResumePreview';

interface TeaserDashboardProps {
  resumeContent: string;
  resumeData: ResumeData;
  selectedTemplate: TemplateType;
  onUnlockAnalysis: () => void;
  onUnlockRedesign: () => void;
}

export default function TeaserDashboard({
  resumeContent,
  resumeData,
  selectedTemplate,
  onUnlockAnalysis,
  onUnlockRedesign,
}: TeaserDashboardProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Score */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl text-white 200 mb-4">
            Your Free Analysis
          </h1>
          
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: Free Quick Analysis + Upsell */}
          <div className="space-y-6">
            {/* Free Quick Analysis */}
            <QuickAnalysisFree
              resumeContent={resumeContent}
              onUpgrade={onUnlockAnalysis}
            />

            {/* Blurred "Locked" Content Preview */}
            <div className="relative h-[150px]">
              <div className="absolute inset-0 backdrop-blur-md bg-[#1a1a1a]/50 z-10 rounded-xl flex items-center justify-center">
                <div className="text-center p-4">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <span className="text-2xl">🔒</span>
                    50+ Insights Locked
                  </h3>
                  <p className="text-gray-400 text-xs mb-4">
                    Section-by-section breakdown, career roadmap, and detailed fixes
                  </p>
                  <button
                    onClick={onUnlockAnalysis}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-5 rounded-lg font-semibold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    Unlock Full Analysis - $3.99
                  </button>
                </div>
              </div>
              
              {/* Blurred Preview Content */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] opacity-40 h-full overflow-hidden">
                <div className="space-y-3">
                  <div className="h-5 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-4/5"></div>
                  <div className="mt-4 space-y-2">
                    <div className="h-16 bg-gray-700 rounded"></div>
                    <div className="h-16 bg-gray-700 rounded"></div>
                    <div className="h-16 bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Resume Redesign Preview + Upsell */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
              <h2 className="text-2xl font-bold text-white mb-4">
                ✨ Your Resume, Redesigned
              </h2>
              <p className="text-gray-400 mb-6">
                See how your resume looks in a professional, ATS-friendly template
              </p>

              {/* Before/After Preview */}
              <div className="relative mb-6">
                <div className="absolute inset-0 backdrop-blur-sm bg-[#0a0a0a]/60 z-10 rounded-xl flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-4xl mb-3">🎨</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Preview Locked
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Unlock to see your redesigned resume
                    </p>
                    <button
                      onClick={onUnlockRedesign}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all"
                    >
                      Unlock Redesign - $1.99
                    </button>
                  </div>
                </div>

                {/* Blurred Resume Preview */}
                <div className="opacity-30">
                  <ResumePreview
                    resumeData={resumeData}
                    template={selectedTemplate}
                  />
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">3 professional templates to choose from</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">ATS-friendly formatting</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Instant PDF download</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Edit before downloading</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={onUnlockRedesign}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
              >
                Get Redesigned Resume - $1.99
              </button>
            </div>

            {/* Bundle Offer - TODO: Implement bundle purchase flow */}
            {/* <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                    SAVE $1
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Get Both for $4.99
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Full analysis + redesigned resume
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 line-through text-sm">$5.98</div>
                  <div className="text-2xl font-bold text-white">$4.99</div>
                </div>
              </div>
              <button
                onClick={() => {
                  // TODO: Handle bundle purchase
                  alert('Bundle purchase coming soon!');
                }}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-all"
              >
                Get Complete Package
              </button>
            </div> */}
          </div>
        </div>

        {/* Bottom Trust Signals */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secure payment via Dodo Payments • No subscription</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>142 students upgraded their resume in the last hour.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
