import axios from 'axios';

const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export async function rewriteWithKimi(content: string, sectionType: string): Promise<string> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not found in environment variables');
  }

  const prompt = `You are a professional resume writer. Rewrite the following ${sectionType} section to be more impactful, professional, and ATS-friendly. Keep it concise and use action verbs. Return only the rewritten content without any explanations.

Content to rewrite:
${content}`;

  try {
    const response = await axios.post(
      KIMI_API_URL,
      {
        model: 'kimi-k2-0711-preview', // 128k context, better for professional content generation
        messages: [
          {
            role: 'system',
            content: 'You are Kimi, an expert resume writer and career coach. You provide professional, ATS-friendly content that helps job seekers stand out.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('Kimi API error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to rewrite content with Kimi API');
  }
}
