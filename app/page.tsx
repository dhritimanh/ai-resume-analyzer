'use client';

import { useState } from 'react';
import { ResumeData, TemplateType } from '@/types/resume';
import ResumeEditor from '@/components/ResumeEditor';
import TemplateSelector from '@/components/TemplateSelector';
import FileUpload from '@/components/FileUpload';
import ResumePreview from '@/components/ResumePreview';
import QuickAnalysis from '@/components/QuickAnalysis';
import FullAnalysisDashboard from '@/components/FullAnalysisDashboard';
import ProcessingAnimation from '@/components/ProcessingAnimation';
import TeaserDashboard from '@/components/TeaserDashboard';

type FlowType = 'none' | 'analyze' | 'build';

export default function Home() {
  const [flowType, setFlowType] = useState<FlowType>('none');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeContent, setResumeContent] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [hasFullAnalysis, setHasFullAnalysis] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [fullAnalysisData, setFullAnalysisData] = useState<any>(null);

  const handleFileUpload = async (fileOrFiles: File | File[]) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();

      // Handle both single file and multiple files (for multi-page PDFs)
      const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      formData.append('fileCount', files.length.toString());

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse resume');
      }

      const parsed = await response.json();
      setResumeData(parsed);

      // Store resume content for analysis (convert to structured text)
      const content = `
RESUME CONTENT

Personal Information:
Name: ${parsed.personalInfo.name}
Email: ${parsed.personalInfo.email}
Phone: ${parsed.personalInfo.phone}
Location: ${parsed.personalInfo.location}
${parsed.personalInfo.linkedin ? `LinkedIn: ${parsed.personalInfo.linkedin}` : ''}
${parsed.personalInfo.website ? `Website: ${parsed.personalInfo.website}` : ''}
${parsed.personalInfo.github ? `GitHub: ${parsed.personalInfo.github}` : ''}

Professional Summary:
${parsed.summary || 'No summary provided'}

Work Experience:
${parsed.experience.map((exp: any, idx: number) => `
[Experience ${idx + 1}]
Position: ${exp.position}
Company: ${exp.company}
Location: ${exp.location}
Duration: ${exp.startDate} - ${exp.endDate}
Responsibilities & Achievements:
${exp.description.map((desc: string, i: number) => `  ${i + 1}. ${desc}`).join('\n')}
`).join('\n')}

Education:
${parsed.education.map((edu: any, idx: number) => `
[Education ${idx + 1}]
Degree: ${edu.degree}
Field: ${edu.field}
School: ${edu.school}
Location: ${edu.location}
Graduation: ${edu.graduationDate}
`).join('\n')}

Skills:
${parsed.skills.join(', ')}

${parsed.customSections && parsed.customSections.length > 0 ? `
Additional Sections:
${parsed.customSections.map((section: any) => `
[${section.title}]
${typeof section.content === 'string' ? section.content :
          Array.isArray(section.content) ? section.content.join(', ') :
            JSON.stringify(section.content)}
`).join('\n')}
` : ''}
      `.trim();

      setResumeContent(content);
    } catch (error: any) {
      console.error('Upload error:', error);

      // Check if it's a JSON parsing error
      const isJsonError = error.message?.includes('parse') || error.message?.includes('JSON');

      if (isJsonError) {
        const retry = confirm(
          'The AI had trouble reading your resume (incomplete response). This usually works on retry.\n\n' +
          'Click OK to try again, or Cancel to upload a different file.'
        );
        if (retry) {
          // Retry automatically with the same file(s)
          handleFileUpload(fileOrFiles);
          return;
        }
      } else {
        alert(error.message || 'Failed to parse resume. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resumeData) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData,
          template: selectedTemplate,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download resume. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Processing Animation */}
      {isProcessing && !resumeData && <ProcessingAnimation />}

      {/* Main Content */}
      {!isProcessing && (
      <div className="max-w-7xl mx-auto">
        {/* Unified Landing Page */}
        {flowType === 'none' && !resumeData && (
          <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12">
            <div className="max-w-4xl w-full">
              {/* Social Proof Badge */}
              <div className="text-center mb-8 md:mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] mb-6 md:mb-8">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-400 text-xs md:text-sm">Used by 10k+ Students</span>
                </div>

                {/* Hero Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 leading-tight px-2">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-pink-500 bg-clip-text text-transparent">
                    95% resumes are rejected
                  </span>
                  <br />
                   by ATS Bots
                </h1>
                <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 md:mb-8 px-4">
                  Drop your resume below to check if yours is trash too - <i>for free</i>, in 60 seconds.
                </p>

                {/* Company Logos */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 opacity-40 mb-8 md:mb-12 flex-wrap">
                  <span className="text-gray-500 font-semibold text-xs sm:text-sm">Google</span>
                  <span className="text-gray-500 font-semibold text-xs sm:text-sm">Netflix</span>
                  <span className="text-gray-500 font-semibold text-xs sm:text-sm">Spotify</span>
                  <span className="text-gray-500 font-semibold text-xs sm:text-sm">Tesla</span>
                </div>
              </div>

              {/* Main Free CTA */}
              <div className="max-w-2xl mx-auto mb-12">
                <FileUpload 
                  onUpload={(file) => {
                    setFlowType('analyze');
                    handleFileUpload(file);
                  }} 
                  isProcessing={isProcessing} 
                />
                <p className="text-center text-gray-500 text-xs mt-4">
                  Don't have a well-designed resume? <button onClick={() => setFlowType('build')} className="text-purple-400 hover:text-purple-300 underline">Use templates to build one quickly</button>
                </p>
              </div>

              {/* Footer */}
              <div className="text-center px-4">
                <div className="flex items-center justify-center gap-2 text-green-400 text-xs md:text-sm flex-wrap mb-6">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <span className="text-center">142 students upgraded their resume in the last hour.</span>
                </div>

                {/* App Name & Links */}
                <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
                  <p className="text-gray-600 text-sm font-semibold mb-3">Tars</p>
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                    <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</a>
                    <span className="text-gray-700">•</span>
                    <a href="/terms" className="hover:text-gray-400 transition-colors">Terms</a>
                    <span className="text-gray-700">•</span>
                    <a href="/contact" className="hover:text-gray-400 transition-colors">Contact</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teaser Dashboard - Show after upload */}
        {resumeData && !showPreview && !showFullAnalysis && flowType !== 'none' ? (
          <TeaserDashboard
            resumeContent={resumeContent}
            resumeData={resumeData}
            selectedTemplate={selectedTemplate}
            onUnlockAnalysis={() => setShowFullAnalysis(true)}
            onUnlockRedesign={() => setShowPreview(true)}
          />
        ) : resumeData && !showPreview && !showFullAnalysis && flowType !== 'none' ? (
          <>
            {/* Sticky Header with Template Selector and Actions */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-[#2a2a2a] shadow-sm mb-8">
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Template Selector */}
                  <div className="flex-1 max-w-2xl">
                    <label className="text-xs font-semibold text-gray-400 mb-2 block">
                      CHOOSE TEMPLATE
                    </label>
                    <div className="flex gap-3">
                      {/* Modern Template */}
                      <button
                        onClick={() => setSelectedTemplate('modern')}
                        className={`flex-1 rounded-lg border-2 transition-all ${selectedTemplate === 'modern'
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-md'
                            : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]'
                          }`}
                      >
                        <div className="p-3">
                          {/* Mini Preview */}
                          <div className="flex gap-1 mb-2 h-12">
                            <div className="w-1/3 bg-gradient-to-b from-blue-900 to-blue-700 rounded-sm"></div>
                            <div className="w-2/3 bg-gray-800 rounded-sm flex flex-col gap-1 p-1">
                              <div className="h-1 bg-blue-600 rounded w-3/4"></div>
                              <div className="h-1 bg-gray-600 rounded w-full"></div>
                              <div className="h-1 bg-gray-600 rounded w-5/6"></div>
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-white">Modern</div>
                          <div className="text-xs text-gray-400 mt-1">2-column • Blue sidebar</div>
                        </div>
                      </button>

                      {/* Classic Template */}
                      <button
                        onClick={() => setSelectedTemplate('classic')}
                        className={`flex-1 rounded-lg border-2 transition-all ${selectedTemplate === 'classic'
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-md'
                            : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]'
                          }`}
                      >
                        <div className="p-3">
                          {/* Mini Preview */}
                          <div className="flex gap-1 mb-2 h-12">
                            <div className="w-full bg-gray-800 rounded-sm flex flex-col gap-1 p-1">
                              <div className="h-1 bg-gray-300 rounded w-1/2 mx-auto"></div>
                              <div className="h-px bg-gray-600 w-full my-1"></div>
                              <div className="h-1 bg-gray-500 rounded w-3/4"></div>
                              <div className="h-1 bg-gray-600 rounded w-full"></div>
                              <div className="h-1 bg-gray-600 rounded w-5/6"></div>
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-white">Classic</div>
                          <div className="text-xs text-gray-400 mt-1">1-column • Traditional</div>
                        </div>
                      </button>

                      {/* Minimal Template */}
                      <button
                        onClick={() => setSelectedTemplate('minimal')}
                        className={`flex-1 rounded-lg border-2 transition-all ${selectedTemplate === 'minimal'
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-md'
                            : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]'
                          }`}
                      >
                        <div className="p-3">
                          {/* Mini Preview */}
                          <div className="flex gap-1 mb-2 h-12">
                            <div className="w-full bg-gray-900 border border-gray-700 rounded-sm flex flex-col gap-2 p-2">
                              <div className="h-1 bg-gray-300 rounded w-1/3"></div>
                              <div className="h-px bg-gray-600 w-full"></div>
                              <div className="h-1 bg-gray-500 rounded w-2/3"></div>
                              <div className="h-1 bg-gray-600 rounded w-full"></div>
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-white">Minimal</div>
                          <div className="text-xs text-gray-400 mt-1">1-column • Clean space</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setResumeData(null);
                        setFlowType('none');
                      }}
                      className="px-4 py-2 bg-[#1a1a1a] text-gray-300 rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors text-sm border border-[#2a2a2a]"
                    >
                      ← Start Over
                    </button>
                    <button
                      onClick={() => {
                        if (flowType === 'analyze') {
                          setShowFullAnalysis(true);
                        } else {
                          setShowPreview(true);
                        }
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-colors text-sm shadow-md"
                    >
                      {flowType === 'analyze' ? 'Get Full Analysis →' : 'Preview & Download →'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Content with Analysis Sidebar */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <ResumeEditor
                    resumeData={resumeData}
                    onUpdate={setResumeData}
                    isProcessing={isProcessing}
                  />
                </div>
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <QuickAnalysis
                      resumeContent={resumeContent}
                      onUpgrade={() => {
                        if (flowType === 'analyze') {
                          setShowFullAnalysis(true);
                        } else {
                          setShowPreview(true);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Preview & Payment - Only show when explicitly requested */}
        {showPreview && resumeData && flowType !== 'none' && (
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Preview */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Your Resume Preview</h2>
                <ResumePreview resumeData={resumeData} template={selectedTemplate} />
                <button
                  onClick={() => {
                    setShowPreview(false);
                    if (flowType === 'analyze') {
                      setShowFullAnalysis(false);
                    }
                  }}
                  className="mt-4 w-full bg-[#1a1a1a] text-gray-300 py-2 px-4 rounded-lg hover:bg-[#2a2a2a] transition-colors border border-[#2a2a2a]"
                >
                  ← Back to Edit
                </button>
              </div>

              {/* Payment/Download */}
              <div>
                <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-8">
                  <h2 className="text-2xl font-bold text-white mb-4">Ready to Download?</h2>

                  {!hasPaid ? (
                    <>
                      {/* Pricing Options - Show upsell based on flow */}
                      {flowType === 'build' ? (
                        <div className="space-y-3 mb-6">
                          {/* Option 1: Just Redesign */}
                          <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${!hasFullAnalysis ? 'border-blue-500 bg-blue-500/10' : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                            }`}>
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-lg font-bold text-white">Just Redesign</div>
                              <div className="text-2xl font-bold text-blue-400">$1.99</div>
                            </div>
                            <ul className="text-xs text-gray-400 space-y-1">
                              <li>✓ Professional template</li>
                              <li>✓ High-quality PDF</li>
                              <li>✓ Instant download</li>
                            </ul>
                          </div>

                          {/* Option 2: Add Full Analysis */}
                          <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all relative ${hasFullAnalysis ? 'border-purple-500 bg-purple-500/10' : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                            }`}>
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                              ADD $3.99
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-lg font-bold text-white">Redesign + Full Analysis</div>
                              <div className="text-2xl font-bold text-purple-400">$5.98</div>
                            </div>
                            <ul className="text-xs text-gray-400 space-y-1">
                              <li>✓ Everything in Just Redesign</li>
                              <li>✓ Section-by-section analysis</li>
                              <li>✓ Career roadmap & goals</li>
                              <li>✓ 50+ actionable suggestions</li>
                              <li>✓ Analysis report PDF</li>
                            </ul>
                            <button
                              onClick={() => setHasFullAnalysis(!hasFullAnalysis)}
                              className="mt-3 w-full text-xs text-purple-400 hover:text-purple-300 font-medium"
                            >
                              {hasFullAnalysis ? '✓ Selected' : 'Add Analysis (+$3.99)'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 mb-6">
                          {/* Analysis Flow - Just show the analysis option */}
                          <div className="border-2 rounded-lg p-4 border-purple-500 bg-purple-500/10">
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-lg font-bold text-white">Full Analysis</div>
                              <div className="text-2xl font-bold text-purple-400">$3.99</div>
                            </div>
                            <ul className="text-xs text-gray-400 space-y-1">
                              <li>✓ Section-by-section analysis</li>
                              <li>✓ Career roadmap & goals</li>
                              <li>✓ 50+ actionable suggestions</li>
                              <li>✓ Analysis report PDF</li>
                            </ul>
                          </div>

                          {/* Upsell: Add Redesign */}
                          <div className="border-2 rounded-lg p-4 border-[#2a2a2a] bg-[#0a0a0a]">
                            <div className="text-center py-2">
                              <p className="text-sm text-gray-300 mb-2">
                                Want a redesigned resume too?
                              </p>
                              <p className="text-xs text-gray-400">
                                Add redesign for just <span className="font-bold text-blue-400">+$1.99</span> after analysis
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={async () => {
                          // TODO: Integrate payment gateway here
                          if (flowType === 'build') {
                            const price = hasFullAnalysis ? '$5.98' : '$1.99';
                            if (hasFullAnalysis) {
                              alert(`Payment integration coming soon!\nYou selected: Redesign + Full Analysis\nPrice: ${price}\n\nEnabling download and analysis...`);
                              setHasPaid(true);
                              setShowFullAnalysis(true);
                              setShowPreview(false);
                            } else {
                              alert(`Payment integration coming soon!\nYou selected: Just Redesign\nPrice: ${price}\n\nEnabling download...`);
                              setHasPaid(true);
                            }
                          } else {
                            // Analysis flow
                            alert(`Payment integration coming soon!\nYou selected: Full Analysis\nPrice: $3.99\n\nEnabling analysis...`);
                            setHasPaid(true);
                            setShowFullAnalysis(true);
                            setShowPreview(false);
                          }
                        }}
                        disabled={isProcessing}
                        className={`w-full text-white py-4 px-6 rounded-lg font-semibold transition-colors mb-3 disabled:opacity-50 ${flowType === 'analyze' || hasFullAnalysis
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                          }`}
                      >
                        {isProcessing ? 'Processing...' :
                          flowType === 'build'
                            ? (hasFullAnalysis ? 'Pay $5.98 & Get Both' : 'Pay $1.99 & Download')
                            : 'Pay $3.99 & Analyze'
                        }
                      </button>

                      <p className="text-xs text-center text-gray-500 mt-4">
                        Secure payment via Stripe • No subscription BS
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-500/10 border-2 border-green-500/30 rounded-lg p-6 mb-6 text-center">
                        <div className="text-4xl mb-2">🎉</div>
                        <div className="text-lg font-semibold text-green-400 mb-1">
                          {showFullAnalysis ? 'Analysis Complete!' : 'Payment Successful!'}
                        </div>
                        <div className="text-sm text-gray-400">
                          Your resume is ready to download
                        </div>
                      </div>

                      <button
                        onClick={handleDownload}
                        disabled={isProcessing}
                        className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
                      >
                        {isProcessing ? 'Generating PDF...' : '⬇ Download Resume PDF'}
                      </button>

                      {showFullAnalysis && (
                        <button
                          onClick={() => {
                            alert('Analysis report download coming soon!');
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-colors mb-3"
                        >
                          📄 Download Analysis Report
                        </button>
                      )}

                      {flowType === 'build' && (
                        <button
                          onClick={() => {
                            setShowPreview(false);
                            setHasPaid(false);
                          }}
                          className="w-full bg-[#1a1a1a] text-gray-300 py-2 px-4 rounded-lg hover:bg-[#2a2a2a] transition-colors border border-[#2a2a2a]"
                        >
                          Make More Changes
                        </button>
                      )}

                      {flowType === 'analyze' && !showFullAnalysis && (
                        <button
                          onClick={() => {
                            alert('Payment integration coming soon!\nYou can add redesign for just +$1.99');
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-colors"
                        >
                          Add Redesign for +$1.99
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Template Switcher */}
                <div className="mt-6">
                  <TemplateSelector
                    selected={selectedTemplate}
                    onSelect={setSelectedTemplate}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {showFullAnalysis && hasPaid && (
          <div className="relative">
            <FullAnalysisDashboard
              resumeContent={resumeContent}
              resumeData={resumeData}
              onBack={() => {
                setShowFullAnalysis(false);
                setShowPreview(false);
              }}
            />

            {/* Upsell for Redesign - Show at bottom if in analyze flow */}
            {flowType === 'analyze' && (
              <div className="max-w-7xl mx-auto px-4 pb-12">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-8 text-white text-center shadow-xl">
                  <h3 className="text-2xl font-bold mb-3">Want a Redesigned Resume Too?</h3>
                  <p className="text-lg mb-6 opacity-90">
                    Get a professionally designed resume with your choice of 3 templates
                  </p>
                  <button
                    onClick={() => {
                      alert('Payment integration coming soon!\nAdd redesign for just +$1.99');
                    }}
                    className="bg-white text-blue-600 py-4 px-8 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Add Redesign for +$1.99 →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Modal for Analysis Flow */}
        {showFullAnalysis && !hasPaid && flowType === 'analyze' && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Get Full Analysis</h2>

              <div className="border-2 rounded-lg p-4 border-purple-500 bg-purple-500/10 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-lg font-bold text-white">Full Analysis</div>
                  <div className="text-3xl font-bold text-purple-400">$3.99</div>
                </div>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✓ Section-by-section analysis</li>
                  <li>✓ Career roadmap & goals</li>
                  <li>✓ 50+ actionable suggestions</li>
                  <li>✓ Analysis report PDF</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  alert('Payment integration coming soon!\nYou selected: Full Analysis\nPrice: $3.99\n\nEnabling analysis...');
                  setHasPaid(true);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-colors mb-3"
              >
                Pay $3.99 & Analyze
              </button>

              <button
                onClick={() => setShowFullAnalysis(false)}
                className="w-full bg-[#0a0a0a] text-gray-300 py-2 px-4 rounded-lg hover:bg-[#2a2a2a] transition-colors border border-[#2a2a2a]"
              >
                Cancel
              </button>

              <p className="text-xs text-center text-gray-500 mt-4">
                Secure payment via Stripe • No subscription BS
              </p>
            </div>
          </div>
        )}
      </div>
      )}
    </main>
  );
}
