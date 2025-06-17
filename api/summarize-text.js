const OpenAI = require('openai');

// OpenAI 클라이언트 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, length } = req.body;
    
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: '최소 50자 이상의 텍스트가 필요합니다.' });
    }

    let lengthInstruction = '';
    switch (length) {
      case 'short':
        lengthInstruction = '1-2 문장으로 아주 간결하게';
        break;
      case 'medium':
        lengthInstruction = '3-5 문장으로 적절히';
        break;
      case 'long':
        lengthInstruction = '한 문단으로 상세하게';
        break;
      default:
        lengthInstruction = '3-5 문장으로 적절히';
    }

    const prompt = `다음 텍스트를 ${lengthInstruction} 요약해주세요. 핵심 내용만 포함하고 한국어로 작성해주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 작성해주세요.\n\n텍스트:\n${text}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 텍스트 요약 전문가입니다. 주어진 텍스트의 핵심 내용을 명확하고 간결하게 요약해주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 답변해주세요.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const summary = completion.choices[0].message.content.trim();
    
    res.json({ summary });
    
  } catch (error) {
    console.error('텍스트 요약 오류:', error);
    res.status(500).json({ error: '텍스트 요약 중 오류가 발생했습니다.' });
  }
}
