import { ResumeData } from '@/types/resume';

export async function parseResumeFile(file: File): Promise<ResumeData> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/parse-resume', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to parse resume');
  }

  return response.json();
}

export function createEmptyResume(): ResumeData {
  return {
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
  };
}
