'use client';

import { useState } from 'react';
import { ResumeData } from '@/types/resume';

interface ResumeEditorProps {
  resumeData: ResumeData;
  onUpdate: (data: ResumeData) => void;
  isProcessing: boolean;
}

export default function ResumeEditor({ resumeData, onUpdate, isProcessing }: ResumeEditorProps) {
  const [rewritingSection, setRewritingSection] = useState<string | null>(null);

  const handleRewrite = async (content: string, sectionType: string, field: keyof ResumeData) => {
    setRewritingSection(sectionType);
    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sectionType }),
      });

      if (!response.ok) throw new Error('Failed to rewrite');

      const { rewrittenContent } = await response.json();
      onUpdate({
        ...resumeData,
        [field]: rewrittenContent,
      });
    } catch (error) {
      console.error('Rewrite error:', error);
      alert('Failed to rewrite content. Please try again.');
    } finally {
      setRewritingSection(null);
    }
  };

  const updateField = (field: keyof ResumeData, value: any) => {
    onUpdate({ ...resumeData, [field]: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Your Resume</h2>
      </div>

      {/* Personal Info */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={resumeData.personalInfo.name}
            onChange={(e) =>
              updateField('personalInfo', { ...resumeData.personalInfo, name: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="email"
            placeholder="Email"
            value={resumeData.personalInfo.email}
            onChange={(e) =>
              updateField('personalInfo', { ...resumeData.personalInfo, email: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={resumeData.personalInfo.phone}
            onChange={(e) =>
              updateField('personalInfo', { ...resumeData.personalInfo, phone: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Location"
            value={resumeData.personalInfo.location}
            onChange={(e) =>
              updateField('personalInfo', { ...resumeData.personalInfo, location: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="LinkedIn (optional)"
            value={resumeData.personalInfo.linkedin || ''}
            onChange={(e) =>
              updateField('personalInfo', { ...resumeData.personalInfo, linkedin: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Website (optional)"
            value={resumeData.personalInfo.website || ''}
            onChange={(e) =>
              updateField('personalInfo', { ...resumeData.personalInfo, website: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="GitHub (optional)"
            value={resumeData.personalInfo.github || ''}
            onChange={(e) =>
              updateField('personalInfo', { ...resumeData.personalInfo, github: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Portfolio (optional)"
            value={resumeData.personalInfo.portfolio || ''}
            onChange={(e) =>
              updateField('personalInfo', { ...resumeData.personalInfo, portfolio: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </section>

      {/* Summary */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Professional Summary</h3>
          <button
            onClick={() => handleRewrite(resumeData.summary, 'summary', 'summary')}
            disabled={isProcessing || rewritingSection === 'summary'}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50 text-sm font-medium"
          >
            {rewritingSection === 'summary' ? 'Rewriting...' : '✨ AI Rewrite'}
          </button>
        </div>
        <textarea
          placeholder="Write a brief professional summary..."
          value={resumeData.summary}
          onChange={(e) => updateField('summary', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </section>

      {/* Skills */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
        <input
          type="text"
          placeholder="Enter skills separated by commas"
          value={resumeData.skills.join(', ')}
          onChange={(e) =>
            updateField('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-2">Separate skills with commas</p>
      </section>

      {/* Experience */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
          <button
            onClick={() => {
              const newExp = [{
                id: Date.now().toString(),
                company: '',
                position: '',
                location: '',
                startDate: '',
                endDate: '',
                description: [''],
              }, ...resumeData.experience];
              updateField('experience', newExp);
            }}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
          >
            + Add Experience
          </button>
        </div>
        {resumeData.experience.length > 0 && (
          <div className="space-y-4">
            {resumeData.experience.map((exp, idx) => (
              <div key={exp.id} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (idx === 0) return;
                      const newExp = [...resumeData.experience];
                      [newExp[idx - 1], newExp[idx]] = [newExp[idx], newExp[idx - 1]];
                      updateField('experience', newExp);
                    }}
                    disabled={idx === 0}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => {
                      if (idx === resumeData.experience.length - 1) return;
                      const newExp = [...resumeData.experience];
                      [newExp[idx], newExp[idx + 1]] = [newExp[idx + 1], newExp[idx]];
                      updateField('experience', newExp);
                    }}
                    disabled={idx === resumeData.experience.length - 1}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => {
                      const newExp = resumeData.experience.filter((_, i) => i !== idx);
                      updateField('experience', newExp);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Remove this experience"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Position"
                    value={exp.position}
                    onChange={(e) => {
                      const newExp = [...resumeData.experience];
                      newExp[idx].position = e.target.value;
                      updateField('experience', newExp);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => {
                      const newExp = [...resumeData.experience];
                      newExp[idx].company = e.target.value;
                      updateField('experience', newExp);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Location (e.g., San Francisco, CA)"
                    value={exp.location}
                    onChange={(e) => {
                      const newExp = [...resumeData.experience];
                      newExp[idx].location = e.target.value;
                      updateField('experience', newExp);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Start (e.g., Jan 2020)"
                      value={exp.startDate}
                      onChange={(e) => {
                        const newExp = [...resumeData.experience];
                        newExp[idx].startDate = e.target.value;
                        updateField('experience', newExp);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="End (e.g., Present)"
                      value={exp.endDate}
                      onChange={(e) => {
                        const newExp = [...resumeData.experience];
                        newExp[idx].endDate = e.target.value;
                        updateField('experience', newExp);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-600">Achievements</label>
                    <button
                      onClick={async () => {
                        const sectionId = `exp-${idx}`;
                        setRewritingSection(sectionId);
                        try {
                          const response = await fetch('/api/rewrite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              content: exp.description.join('\n'), 
                              sectionType: 'experience achievements' 
                            }),
                          });
                          if (!response.ok) throw new Error('Failed to rewrite');
                          const { rewrittenContent } = await response.json();
                          const newExp = [...resumeData.experience];
                          newExp[idx].description = rewrittenContent.split('\n').filter((line: string) => line.trim());
                          updateField('experience', newExp);
                        } catch (error) {
                          console.error('Rewrite error:', error);
                          alert('Failed to rewrite. Please try again.');
                        } finally {
                          setRewritingSection(null);
                        }
                      }}
                      disabled={isProcessing || rewritingSection === `exp-${idx}`}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200 disabled:opacity-50"
                    >
                      {rewritingSection === `exp-${idx}` ? 'Rewriting...' : '✨ AI Rewrite'}
                    </button>
                  </div>
                  <textarea
                    placeholder="Achievements (one per line)"
                    value={exp.description.join('\n')}
                    onChange={(e) => {
                      const newExp = [...resumeData.experience];
                      newExp[idx].description = e.target.value.split('\n');
                      updateField('experience', newExp);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Education */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Education</h3>
          <button
            onClick={() => {
              const newEdu = [{
                id: Date.now().toString(),
                school: '',
                degree: '',
                field: '',
                location: '',
                graduationDate: '',
              }, ...resumeData.education];
              updateField('education', newEdu);
            }}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
          >
            + Add Education
          </button>
        </div>
        {resumeData.education.length > 0 && (
          <div className="space-y-4">
            {resumeData.education.map((edu, idx) => (
              <div key={edu.id} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (idx === 0) return;
                      const newEdu = [...resumeData.education];
                      [newEdu[idx - 1], newEdu[idx]] = [newEdu[idx], newEdu[idx - 1]];
                      updateField('education', newEdu);
                    }}
                    disabled={idx === 0}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => {
                      if (idx === resumeData.education.length - 1) return;
                      const newEdu = [...resumeData.education];
                      [newEdu[idx], newEdu[idx + 1]] = [newEdu[idx + 1], newEdu[idx]];
                      updateField('education', newEdu);
                    }}
                    disabled={idx === resumeData.education.length - 1}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => {
                      const newEdu = resumeData.education.filter((_, i) => i !== idx);
                      updateField('education', newEdu);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Remove this education"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="School"
                    value={edu.school}
                    onChange={(e) => {
                      const newEdu = [...resumeData.education];
                      newEdu[idx].school = e.target.value;
                      updateField('education', newEdu);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => {
                      const newEdu = [...resumeData.education];
                      newEdu[idx].degree = e.target.value;
                      updateField('education', newEdu);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Field of Study"
                    value={edu.field}
                    onChange={(e) => {
                      const newEdu = [...resumeData.education];
                      newEdu[idx].field = e.target.value;
                      updateField('education', newEdu);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={edu.location}
                    onChange={(e) => {
                      const newEdu = [...resumeData.education];
                      newEdu[idx].location = e.target.value;
                      updateField('education', newEdu);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Graduation Date (e.g., May 2020)"
                  value={edu.graduationDate}
                  onChange={(e) => {
                    const newEdu = [...resumeData.education];
                    newEdu[idx].graduationDate = e.target.value;
                    updateField('education', newEdu);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Custom Sections */}
      {resumeData.customSections && resumeData.customSections.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Sections</h3>
          <p className="text-sm text-gray-600 mb-4">
            These sections were automatically extracted from your resume. Edit or remove as needed.
          </p>
          <div className="space-y-6">
            {resumeData.customSections.map((section, sectionIdx) => (
              <div key={section.id} className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
                <div className="flex justify-between items-start mb-3">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => {
                      const newSections = [...(resumeData.customSections || [])];
                      newSections[sectionIdx].title = e.target.value;
                      updateField('customSections', newSections);
                    }}
                    className="text-lg font-semibold px-3 py-1 border border-gray-300 rounded flex-1 mr-3"
                    placeholder="Section Title"
                  />
                  <button
                    onClick={() => {
                      const newSections = (resumeData.customSections || []).filter((_, i) => i !== sectionIdx);
                      updateField('customSections', newSections);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Remove this section"
                  >
                    ✕
                  </button>
                </div>

                {/* List type */}
                {section.type === 'list' && Array.isArray(section.content) && (
                  <textarea
                    value={(section.content as string[]).join('\n')}
                    onChange={(e) => {
                      const newSections = [...(resumeData.customSections || [])];
                      newSections[sectionIdx].content = e.target.value.split('\n');
                      updateField('customSections', newSections);
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="One item per line"
                  />
                )}

                {/* Text type */}
                {section.type === 'text' && typeof section.content === 'string' && (
                  <textarea
                    value={section.content}
                    onChange={(e) => {
                      const newSections = [...(resumeData.customSections || [])];
                      newSections[sectionIdx].content = e.target.value;
                      updateField('customSections', newSections);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="Text content"
                  />
                )}

                {/* Items type (like Projects, Awards with details) */}
                {section.type === 'items' && Array.isArray(section.content) && (
                  <div className="space-y-3">
                    {(section.content as any[]).map((item: any, itemIdx: number) => (
                      <div key={item.id || itemIdx} className="bg-white border border-gray-300 rounded p-3 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => {
                              const newSections = [...(resumeData.customSections || [])];
                              const items = newSections[sectionIdx].content as any[];
                              items[itemIdx].title = e.target.value;
                              updateField('customSections', newSections);
                            }}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Title"
                          />
                          <input
                            type="text"
                            value={item.date || ''}
                            onChange={(e) => {
                              const newSections = [...(resumeData.customSections || [])];
                              const items = newSections[sectionIdx].content as any[];
                              items[itemIdx].date = e.target.value;
                              updateField('customSections', newSections);
                            }}
                            className="w-40 px-3 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Date"
                          />
                        </div>
                        {item.subtitle !== undefined && (
                          <input
                            type="text"
                            value={item.subtitle || ''}
                            onChange={(e) => {
                              const newSections = [...(resumeData.customSections || [])];
                              const items = newSections[sectionIdx].content as any[];
                              items[itemIdx].subtitle = e.target.value;
                              updateField('customSections', newSections);
                            }}
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Subtitle (e.g., technologies, organization)"
                          />
                        )}
                        {item.description && (
                          <textarea
                            value={Array.isArray(item.description) ? item.description.join('\n') : item.description}
                            onChange={(e) => {
                              const newSections = [...(resumeData.customSections || [])];
                              const items = newSections[sectionIdx].content as any[];
                              items[itemIdx].description = e.target.value.split('\n');
                              updateField('customSections', newSections);
                            }}
                            rows={2}
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Description (one per line)"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
