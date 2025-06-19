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
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: '카테고리가 필요합니다.' });
    }

    const prompt = `${category}에 관한 영감을 주는 명언을 하나 생성해주세요. 한국어로 작성하고, 따옴표 없이 명언만 반환해주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 작성해주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 영감을 주는 명언을 생성하는 전문가입니다. 간결하고 의미 있는 명언을 만들어주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 답변해주세요.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.8
    });

    const quote = completion.choices[0].message.content.trim();
    
    res.json({ quote });
    
  } catch (error) {
    console.error('명언 생성 오류:', error);
    res.status(500).json({ error: '명언 생성 중 오류가 발생했습니다.' });
  }
}
