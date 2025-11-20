'use client';

import { TemplateType } from '@/types/resume';

interface TemplateSelectorProps {
  selected: TemplateType;
  onSelect: (template: TemplateType) => void;
}

const templates = [
  {
    id: 'modern' as TemplateType,
    name: 'Modern',
    description: 'Bold colors, two-column layout',
    preview: 'bg-gradient-to-br from-blue-500 to-blue-700',
  },
  {
    id: 'classic' as TemplateType,
    name: 'Classic',
    description: 'Traditional, professional serif',
    preview: 'bg-gradient-to-br from-gray-700 to-gray-900',
  },
  {
    id: 'minimal' as TemplateType,
    name: 'Minimal',
    description: 'Clean, lots of whitespace',
    preview: 'bg-gradient-to-br from-slate-400 to-slate-600',
  },
];

export default function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Choose Template
      </h3>
      <div className="space-y-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selected === template.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-16 rounded ${template.preview}`} />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {template.name}
                </div>
                <div className="text-sm text-gray-600">
                  {template.description}
                </div>
              </div>
              {selected === template.id && (
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
