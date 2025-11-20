import { ResumeData } from '@/types/resume';

export const sampleResumeData: ResumeData = {
  personalInfo: {
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/johndoe',
  },
  summary: 'Experienced software engineer with 5+ years building scalable web applications. Passionate about clean code and user experience.',
  experience: [
    {
      id: '1',
      company: 'Tech Corp',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jan 2021',
      endDate: 'Present',
      description: [
        'Led development of microservices architecture serving 1M+ users',
        'Reduced API response time by 40% through optimization',
        'Mentored 3 junior developers and conducted code reviews',
      ],
    },
    {
      id: '2',
      company: 'Startup Inc',
      position: 'Full Stack Developer',
      location: 'Remote',
      startDate: 'Jun 2019',
      endDate: 'Dec 2020',
      description: [
        'Built responsive web applications using React and Node.js',
        'Implemented CI/CD pipeline reducing deployment time by 60%',
        'Collaborated with design team to improve user interface',
      ],
    },
  ],
  education: [
    {
      id: '1',
      school: 'University of California',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      location: 'Berkeley, CA',
      graduationDate: 'May 2019',
    },
  ],
  skills: [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'AWS',
    'Docker',
    'PostgreSQL',
  ],
};
