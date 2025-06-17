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
    const { weatherData, advisorType = 'outfit' } = req.body;
    
    if (!weatherData) {
      return res.status(400).json({ error: '날씨 데이터가 필요합니다.' });
    }

    let prompt = '';
    let systemMessage = '';

    switch (advisorType) {
      case 'outfit':
        systemMessage = '당신은 날씨 전문가이자 패션 코디네이터입니다. 현재 날씨 조건에 맞는 실용적이고 스타일리시한 옷차림을 추천해주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 답변해주세요.';
        prompt = `현재 날씨 정보:
- 기온: ${weatherData.temperature}
- 습도: ${weatherData.humidity}
- 풍속: ${weatherData.windSpeed}
- 강수형태: ${weatherData.precipitationType}
- 하늘상태: ${weatherData.sky || '정보 없음'}

이 날씨에 맞는 옷차림과 외출 준비물을 추천해주세요. 
상의, 하의, 외투, 신발, 액세서리, 준비물로 나누어서 구체적으로 설명해주세요.
답변할 때 **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 작성해주세요.`;
        break;
        
      case 'activity':
        systemMessage = '당신은 날씨 기반 활동 추천 전문가입니다. 현재 날씨 조건에 최적화된 실내외 활동을 제안해주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 답변해주세요.';
        prompt = `현재 날씨 정보:
- 기온: ${weatherData.temperature}
- 습도: ${weatherData.humidity}
- 풍속: ${weatherData.windSpeed}
- 강수형태: ${weatherData.precipitationType}

이 날씨에 적합한 활동들을 실내활동 3가지, 실외활동 3가지로 나누어 추천해주세요.
각 활동의 이유와 주의사항도 함께 설명해주세요.
답변할 때 **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 작성해주세요.`;
        break;
        
      case 'health':
        systemMessage = '당신은 날씨와 건강의 상관관계를 잘 아는 건강 조언 전문가입니다. 현재 날씨 조건에서 주의해야 할 건강 관리법을 제공해주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 답변해주세요.';
        prompt = `현재 날씨 정보:
- 기온: ${weatherData.temperature}
- 습도: ${weatherData.humidity}
- 풍속: ${weatherData.windSpeed}
- 강수형태: ${weatherData.precipitationType}

이 날씨 조건에서 주의해야 할 건강 관리 요령을 알려주세요.
수분 섭취, 피부 관리, 호흡기 건강, 운동 시 주의사항 등을 포함해서 설명해주세요.
답변할 때 **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 작성해주세요.`;
        break;
        
      default:
        return res.status(400).json({ error: '올바르지 않은 조언 타입입니다.' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const advice = completion.choices[0].message.content.trim();
    
    res.json({ 
      advice,
      advisorType,
      weatherData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI 날씨 조언 생성 오류:', error);
    res.status(500).json({ error: 'AI 날씨 조언 생성 중 오류가 발생했습니다.' });
  }
}
