'use client';

import { useEffect, useState } from 'react';

const processingSteps = [
  { icon: '📄', text: 'Parsing document structure...' },
  { icon: '🔍', text: 'Extracting text and formatting...' },
  { icon: '⚠️', text: 'Scanning for 50+ common red flags...' },
  { icon: '🤖', text: 'Running ATS compatibility check...' },
  { icon: '📊', text: 'Analyzing keyword density...' },
  { icon: '✍️', text: 'Evaluating action verb strength...' },
  { icon: '🎯', text: 'Comparing against job description keywords...' },
  { icon: '📈', text: 'Measuring quantification impact...' },
  { icon: '🏆', text: 'Benchmarking against top 1% resumes...' },
  { icon: '💼', text: 'Checking professional tone consistency...' },
  { icon: '🔤', text: 'Detecting grammar and spelling issues...' },
  { icon: '📐', text: 'Analyzing whitespace and layout...' },
  { icon: '🎨', text: 'Evaluating visual hierarchy...' },
  { icon: '⏱️', text: 'Calculating readability score...' },
  { icon: '🔗', text: 'Validating contact information...' },
  { icon: '📝', text: 'Assessing bullet point effectiveness...' },
  { icon: '🎓', text: 'Reviewing education formatting...' },
  { icon: '💡', text: 'Identifying missing keywords...' },
  { icon: '🚀', text: 'Generating improvement suggestions...' },
  { icon: '🧮', text: 'Calculating final impact score...' },
  { icon: '✨', text: 'Preparing your personalized report...' },
  { icon: '🎯', text: 'Cross-referencing industry standards...' },
  { icon: '📋', text: 'Analyzing section completeness...' },
  { icon: '🔍', text: 'Detecting formatting inconsistencies...' },
  { icon: '💪', text: 'Measuring achievement impact...' },
  { icon: '🎪', text: 'Evaluating personal branding...' },
  { icon: '📊', text: 'Comparing length and density...' },
  { icon: '🎯', text: 'Finalizing your resume score...' },
];

export default function ProcessingAnimation() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % processingSteps.length);
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const step = processingSteps[currentStep];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-20 animate-pulse blur-xl"></div>
          <div className="relative bg-[#1a1a1a] rounded-2xl p-8 md:p-12 border-2 border-[#2a2a2a] text-center">
            
            {/* Animated Icon */}
            <div className="text-6xl md:text-7xl mb-6 animate-bounce">
              {step.icon}
            </div>

            {/* Status Text */}
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Analyzing Your Resume
            </h2>
            
            <p className="text-lg md:text-xl text-purple-400 mb-8 min-h-[2rem] transition-all duration-300">
              {step.text}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-[#2a2a2a] rounded-full h-2 mb-6 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full transition-all duration-2000 ease-linear"
                style={{ 
                  width: `${((currentStep + 1) / processingSteps.length) * 100}%`,
                }}
              ></div>
            </div>

            {/* Spinning Loader */}
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
              </div>
            </div>

            {/* Sub Text */}
            <p className="text-sm text-gray-500">
              This may take 10-30 seconds • Hang tight, we're being thorough
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-400">
                50+ Checks
              </span>
              <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/30 rounded-full text-xs text-pink-400">
                ATS Analysis
              </span>
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">
                AI-Powered
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <p className="text-center text-gray-600 text-sm mt-6">
          💡 Pro tip: While you wait, think about your top 3 career achievements
        </p>
      </div>
    </div>
  );
}
