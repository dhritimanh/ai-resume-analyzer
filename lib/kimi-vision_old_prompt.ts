import axios from 'axios';
import { ResumeData } from '@/types/resume';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export async function extractResumeWithVision(imageUrlOrUrls: string | string[]): Promise<ResumeData> {
  const imageUrls = Array.isArray(imageUrlOrUrls) ? imageUrlOrUrls : [imageUrlOrUrls];
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not found in environment variables');
  }

  const prompt = `You are an expert resume data extraction AI with perfect OCR capabilities. Your task is to analyze ${imageUrls.length > 1 ? `these ${imageUrls.length} resume pages` : 'this resume image'} and extract EVERY SINGLE PIECE OF INFORMATION with 100% accuracy into structured JSON format.

${imageUrls.length > 1 ? `IMPORTANT: This is a ${imageUrls.length}-page resume. Extract and combine information from ALL pages into a single JSON object. Do not duplicate information - merge content intelligently.` : ''}

CRITICAL EXTRACTION RULES:

1. NAME EXTRACTION (HIGHEST PRIORITY):
   - The name is typically the LARGEST text at the top of the resume
   - Extract the FULL name exactly as shown (First Middle Last)
   - Do NOT extract job titles, company names, or section headers as the name
   - Common locations: Top center, top left, or in a header section
   - If multiple large texts appear, the name is usually the FIRST one
   - Example: "John Michael Smith" NOT "Software Engineer" or "Resume"

2. CONTACT INFORMATION:
   - Email: Look for @ symbol
   - Phone: Look for numbers with dashes, dots, or parentheses
   - Location: City, State or City, Country format
   - LinkedIn: linkedin.com/in/username
   - GitHub: github.com/username
   - Website/Portfolio: Any URL that's not LinkedIn or GitHub

3. READ CAREFULLY:
   - Use OCR to read ALL text accurately
   - Preserve exact spelling, capitalization, and punctuation
   - Do not make assumptions or corrections
   - If text is unclear, extract your best interpretation

SECTIONS TO EXTRACT (extract ALL you see):
- Personal/Contact Information
- Summary/Objective/Profile
- Work Experience/Employment History
- Education/Academic Background
- Skills/Technical Skills/Core Competencies
- Projects/Side Projects/Personal Projects
- Awards/Honors/Achievements/Certifications
- Publications/Research/Papers
- Volunteer Work/Community Service
- Languages/Language Proficiency
- Interests/Hobbies
- References
- Professional Affiliations/Memberships
- Courses/Training/Workshops
- GitHub/Portfolio/Code Samples
- Patents
- Speaking Engagements/Presentations

DETAILED EXTRACTION INSTRUCTIONS:

PERSONAL INFORMATION (Extract with 100% accuracy):
- name: The FULL name from the top of the resume (usually largest text)
  ✓ CORRECT: "Sarah Johnson", "Michael Chen", "Dr. Emily Rodriguez"
  ✗ WRONG: "Software Engineer", "Resume", "Professional Summary"
- email: Exact email address with @ symbol
- phone: Phone number with all digits and formatting
- location: City and State/Country exactly as shown
- linkedin: Full LinkedIn URL or username
- website: Personal website URL
- github: GitHub profile URL or username
- portfolio: Portfolio website URL

SUMMARY/OBJECTIVE:
- Extract the introductory paragraph word-for-word
- May be labeled: Summary, Objective, Profile, About Me, Professional Summary
- Preserve all sentences and punctuation exactly

WORK EXPERIENCE (Extract EVERY job):
- company: Company name exactly as shown
- position: Job title exactly as shown
- location: City, State where job was located
- startDate: Start date EXACTLY as shown (e.g., "Jan 2020", "January 2020", "2020-01")
- endDate: End date EXACTLY as shown (e.g., "Present", "Current", "Dec 2022")
- description: Array of ALL bullet points/achievements
  - Each bullet point as a separate array item
  - Preserve exact wording
  - Include ALL bullets, don't skip any

EDUCATION (Extract EVERY degree):
- school: University/College name exactly as shown
- degree: Degree type (e.g., "Bachelor of Science", "Master of Arts", "PhD")
- field: Field of study (e.g., "Computer Science", "Business Administration")
- location: City, State of the school
- graduationDate: Graduation date EXACTLY as shown

SKILLS:
- Extract ALL skills mentioned anywhere in the resume
- Include: Technical skills, soft skills, tools, languages, frameworks
- Preserve exact names (e.g., "JavaScript" not "Javascript", "React.js" not "React")

CUSTOM SECTIONS:
- For Projects, Awards, Certifications, Publications, etc.
- Extract with title, type, and content
- Preserve all details and formatting

QUALITY CHECKS:
✓ Name is a person's name, not a job title or section header
✓ All dates are preserved exactly as shown
✓ All bullet points are captured
✓ No information is lost or summarized
✓ Spelling and capitalization are exact
✓ All sections are identified and extracted

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations):
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "(123) 456-7890",
    "location": "City, State",
    "linkedin": "linkedin.com/in/username",
    "website": "website.com",
    "github": "github.com/username",
    "portfolio": "portfolio.com"
  },
  "summary": "Professional summary text here",
  "experience": [
    {
      "id": "1",
      "company": "Company Name",
      "position": "Job Title",
      "location": "City, State",
      "startDate": "Jan 2020",
      "endDate": "Present",
      "description": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "id": "1",
      "school": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "location": "City, State",
      "graduationDate": "May 2020"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "customSections": [
    {
      "id": "1",
      "title": "Projects",
      "type": "items",
      "content": [
        {
          "id": "1",
          "title": "Project Name",
          "subtitle": "React, Node.js, MongoDB",
          "date": "Jan 2020 - Mar 2020",
          "description": ["Built feature X", "Achieved Y"]
        }
      ]
    },
    {
      "id": "2",
      "title": "Awards",
      "type": "list",
      "content": ["Award 1 - 2020", "Award 2 - 2019"]
    },
    {
      "id": "3",
      "title": "Certifications",
      "type": "text",
      "content": "AWS Certified Solutions Architect - 2020"
    }
  ]
}

If any field is not found, use empty string "" or empty array []. Ensure all IDs are unique strings.`;

  try {
    // Import retry utility
    const { retryWithBackoff } = await import('./kimi-retry');
    
    // Build content array with all images
    const messageContent: any[] = [];
    
    // Add all images first
    imageUrls.forEach((url) => {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: url,
        },
      });
    });
    
    // Add prompt text last
    messageContent.push({
      type: 'text',
      text: prompt,
    });
    
    const response = await retryWithBackoff(
      () => axios.post(
        KIMI_API_URL,
        {
          model: 'moonshot-v1-32k-vision-preview', // Use 32k model for larger resumes
          messages: [
            {
              role: 'user',
              content: messageContent,
            },
          ],
          temperature: 0,
          max_tokens: 4096, // Increase to ensure complete JSON responses
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      ),
      5, // max retries
      2000, // initial delay
      (attempt, delay) => {
        console.log(`Kimi Vision: Rate limit or error, retrying in ${delay}ms (attempt ${attempt}/5)`);
      }
    );

    // Log rate limit info for monitoring
    const { logRateLimitInfo } = await import('./kimi-retry');
    logRateLimitInfo(response, 'Kimi Vision');
    
    const content = response.data.choices[0].message.content.trim();
    
    // Use robust JSON parser to handle malformed responses
    const { parseJsonFromLLM } = await import('./json-parser');
    const resumeData: ResumeData = parseJsonFromLLM(content);
    
    // Validate and ensure all required fields exist
    if (!resumeData.personalInfo) {
      resumeData.personalInfo = { name: '', email: '', phone: '', location: '' };
    }
    if (!resumeData.summary) resumeData.summary = '';
    if (!resumeData.experience) resumeData.experience = [];
    if (!resumeData.education) resumeData.education = [];
    if (!resumeData.skills) resumeData.skills = [];
    if (!resumeData.customSections) resumeData.customSections = [];

    // Validate name extraction (common error check)
    const suspiciousNames = [
      'resume', 'cv', 'curriculum vitae', 'professional', 'summary',
      'engineer', 'developer', 'manager', 'designer', 'analyst',
      'experience', 'education', 'skills', 'contact', 'profile'
    ];
    
    const nameLower = resumeData.personalInfo.name.toLowerCase();
    const isSuspicious = suspiciousNames.some(word => nameLower.includes(word));
    
    if (isSuspicious) {
      console.warn(`Suspicious name detected: "${resumeData.personalInfo.name}". This might be a section header, not a name.`);
      // Try to find name from email if available
      if (resumeData.personalInfo.email) {
        const emailName = resumeData.personalInfo.email.split('@')[0];
        const formattedName = emailName
          .split(/[._-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        console.log(`Attempting to infer name from email: ${formattedName}`);
      }
    }

    return resumeData;
  } catch (error: any) {
    console.error('Kimi Vision API error:', error.response?.data || error.message);
    
    // Log additional context for debugging
    if (error.response?.data?.error?.type) {
      console.error('Error type:', error.response.data.error.type);
    }
    if (imageUrls.length > 1) {
      console.error(`Processing ${imageUrls.length} pages`);
    }
    
    // Throw the exact error message from API
    throw new Error(error.response?.data?.error?.message || error.message || 'Failed to extract resume data with Kimi Vision');
  }
}
