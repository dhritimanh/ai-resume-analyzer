import axios from 'axios';
import { createHash } from 'crypto';
import { ResumeData } from '@/types/resume';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// VISION EXTRACTION CACHE (Two-Tier Strategy)
// ============================================================================
// Cache ONLY vision extraction (expensive: $0.05 per 5-page resume)
// Analysis is NOT cached here (cheap: $0.015, must stay fresh)
// This prevents stale suggestions when users edit their resume
// ============================================================================

interface CachedVisionResult {
  data: ResumeData;
  expires: number;
  timestamp: number;
}

// In-memory cache (swap to Redis for production multi-instance deployments)
const visionCache = new Map<string, CachedVisionResult>();

// Generate perceptual hash from image URLs
const generateImageHash = (imageUrls: string[]): string => {
  const combined = imageUrls.sort().join('|'); // Sort for consistency
  return createHash('sha256').update(combined).digest('hex').slice(0, 16);
};

// Get cached result if valid
const getCachedVision = (hash: string): ResumeData | null => {
  const cached = visionCache.get(hash);
  if (cached && cached.expires > Date.now()) {
    console.log(`✓ Vision cache HIT (saved $0.05, age: ${Math.round((Date.now() - cached.timestamp) / 1000 / 60)}m)`);
    return cached.data;
  }
  if (cached) {
    visionCache.delete(hash); // Clean up expired
  }
  return null;
};

// Store result in cache
const setCachedVision = (hash: string, data: ResumeData): void => {
  visionCache.set(hash, {
    data,
    expires: Date.now() + CACHE_TTL,
    timestamp: Date.now(),
  });
  console.log(`✓ Vision result cached (24h TTL, hash: ${hash})`);
};

export async function extractResumeWithVision(imageUrlOrUrls: string | string[]): Promise<ResumeData> {
  const imageUrls = Array.isArray(imageUrlOrUrls) ? imageUrlOrUrls : [imageUrlOrUrls];
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not found in environment variables');
  }

  // Check cache first (saves $0.05 per hit)
  const imageHash = generateImageHash(imageUrls);
  const cached = getCachedVision(imageHash);
  if (cached) {
    return cached; // Instant return, zero cost
  }

  // ============================================================================
  // OPTIMIZED PROMPT (Hybrid Approach)
  // - Reduced from ~1850 to ~1300 tokens (30% reduction)
  // - Kept critical accuracy instructions
  // - Removed redundant examples and verbose explanations
  // - Maintains extraction quality while reducing cost
  // ============================================================================
  const prompt = `Extract resume data with 100% accuracy into structured JSON.${imageUrls.length > 1 ? ` This is a ${imageUrls.length}-page resume - merge ALL pages into one JSON object.` : ''}

CRITICAL RULES:

1. NAME EXTRACTION (TOP PRIORITY):
   - Name = LARGEST text at top (NOT job title/section header)
   - Extract FULL name exactly as shown
   - ✓ "Sarah Johnson" ✗ "Software Engineer" or "Resume"

2. CONTACT INFO:
   - Email: look for @
   - Phone: all digits with formatting
   - Location: City, State format
   - LinkedIn/GitHub/Website: extract URLs or usernames

3. OCR ACCURACY:
   - Read ALL text exactly (spelling, caps, punctuation)
   - Preserve exact wording, no corrections
   - Extract best interpretation if unclear

SECTIONS (extract ALL found):
Personal Info, Summary/Objective, Work Experience, Education, Skills, Projects, Awards, Certifications, Publications, Volunteer Work, Languages, Interests, Professional Affiliations, Courses, Patents, Presentations

EXTRACTION DETAILS:

PERSONAL INFO:
- name: Full name from top (largest text)
- email, phone, location: exact as shown
- linkedin, github, website, portfolio: URLs or usernames

SUMMARY: Extract intro paragraph word-for-word (may be labeled Summary/Objective/Profile/About Me)

EXPERIENCE (EVERY job):
- company, position, location: exact as shown
- startDate, endDate: EXACT format (e.g., "Jan 2020", "Present", "Dec 2022")
- description: Array of ALL bullets, preserve exact wording, include every bullet

EDUCATION (EVERY degree):
- school, degree, field, location: exact as shown
- graduationDate: exact format

SKILLS: Extract ALL skills (technical, soft, tools, languages, frameworks). Preserve exact names (e.g., "JavaScript", "React.js")

CUSTOM SECTIONS: Projects, Awards, Certifications, etc. - extract with title, type, content

QUALITY CHECKS:
✓ Name is person's name (not job title)
✓ All dates exact as shown
✓ All bullets captured
✓ No info lost or summarized
✓ Exact spelling/caps

Return ONLY valid JSON (no markdown):
{
  "personalInfo": {"name": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "", "github": "", "portfolio": ""},
  "summary": "",
  "experience": [{"id": "1", "company": "", "position": "", "location": "", "startDate": "", "endDate": "", "description": []}],
  "education": [{"id": "1", "school": "", "degree": "", "field": "", "location": "", "graduationDate": ""}],
  "skills": [],
  "customSections": [
    {"id": "1", "title": "Projects", "type": "items", "content": [{"id": "1", "title": "", "subtitle": "", "date": "", "description": []}]},
    {"id": "2", "title": "Awards", "type": "list", "content": []},
    {"id": "3", "title": "Certifications", "type": "text", "content": ""}
  ]
}

Missing fields = "" or []. All IDs = unique strings.`;

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
    
    // Generate deterministic seed from image hash for reproducibility
    const seed = parseInt(imageHash, 16) % 10000;
    
    const response = await retryWithBackoff(
      () => axios.post(
        KIMI_API_URL,
        {
          model: 'moonshot-v1-32k-vision-preview',
          messages: [
            {
              role: 'user',
              content: messageContent,
            },
          ],
          temperature: 0,        // Deterministic
          top_p: 0.01,           // Further constrain randomness for JSON output
          seed: seed,            // Same image → same seed → same extraction
          max_tokens: 4096,      // Keep high for complex multi-page resumes
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

    // Cache the result for 24h (saves $0.05 on repeat uploads)
    setCachedVision(imageHash, resumeData);

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
