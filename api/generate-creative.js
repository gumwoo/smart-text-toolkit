const OpenAI = require('openai');

// OpenAI 클라이언트 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
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
    const { type, genre, prompt, length, keywords } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: '프롬프트가 필요합니다.' });
    }

    let lengthInstruction = '';
    switch (length) {
      case 'short':
        lengthInstruction = '1-2 단락으로 간결하게';
        break;
      case 'medium':
        lengthInstruction = '3-5 단락으로 적당한 길이로';
        break;
      case 'long':
        lengthInstruction = '여러 단락으로 상세하게';
        break;
      default:
        lengthInstruction = '적절한 길이로';
    }

    let typeInstruction = '';
    switch (type) {
      case 'story':
        typeInstruction = '흥미진진한 짧은 이야기를';
        break;
      case 'idea':
        typeInstruction = '창의적이고 실용적인 아이디어를';
        break;
      case 'poem':
        typeInstruction = '감성적이고 운율이 있는 시를';
        break;
      case 'dialogue':
        typeInstruction = '자연스럽고 생동감 있는 대화를';
        break;
      case 'description':
        typeInstruction = '생생하고 구체적인 묘사를';
        break;
      case 'blog':
        typeInstruction = '유익하고 흥미로운 블로그 아이디어를';
        break;
      default:
        typeInstruction = '창의적인 콘텐츠를';
    }

    const genreText = genre ? ` (장르: ${genre})` : '';
    const keywordsText = keywords ? `\n\n포함할 키워드: ${keywords}` : '';

    const fullPrompt = `다음 주제로 ${typeInstruction} ${lengthInstruction} 작성해주세요${genreText}.

주제: ${prompt}${keywordsText}

한국어로 작성하고, 창의적이고 매력적인 내용으로 만들어주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 작성해주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 창의적인 글쓰기 전문가입니다. 독창적이고 매력적인 콘텐츠를 만들어주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 답변해주세요.'
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.8
    });

    const content = completion.choices[0].message.content.trim();
    
    res.json({ content });
    
  } catch (error) {
    console.error('창의적 콘텐츠 생성 오류:', error);
    res.status(500).json({ error: '창의적 콘텐츠 생성 중 오류가 발생했습니다.' });
  }
}
