const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');

// OpenAI 클라이언트 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 로그 디렉토리 확인 및 생성
const logDir = path.join(process.cwd(), 'logs');

const logInfo = (message) => {
  const logMessage = `[${new Date().toISOString()}] INFO: ${message}\n`;
  console.log(logMessage.trim());
  try {
    fs.ensureDirSync(logDir);
    fs.appendFileSync(path.join(logDir, 'app.log'), logMessage);
  } catch (error) {
    console.warn('로그 파일 쓰기 실패:', error.message);
  }
};

const logError = (message) => {
  const logMessage = `[${new Date().toISOString()}] ERROR: ${message}\n`;
  console.error(logMessage.trim());
  try {
    fs.ensureDirSync(logDir);
    fs.appendFileSync(path.join(logDir, 'error.log'), logMessage);
  } catch (error) {
    console.warn('에러 로그 파일 쓰기 실패:', error.message);
  }
};

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
    const { type, recipient, purpose, tone, keyPoints } = req.body;
    
    logInfo(`이메일 생성 요청: 유형=${type}, 받는사람=${recipient}, 어조=${tone}`);
    
    if (!recipient || !purpose) {
      return res.status(400).json({ error: '받는 사람과 목적이 필요합니다.' });
    }

    let toneInstruction = '';
    switch (tone) {
      case 'formal':
        toneInstruction = '격식 있고 공손한 어조로';
        break;
      case 'friendly':
        toneInstruction = '친근하고 따뜻한 어조로';
        break;
      case 'professional':
        toneInstruction = '전문적이고 비즈니스라이크한 어조로';
        break;
      case 'casual':
        toneInstruction = '편안하고 자연스러운 어조로';
        break;
      default:
        toneInstruction = '적절한 어조로';
    }

    let typeContext = '';
    switch (type) {
      case 'business':
        typeContext = '업무 관련 이메일';
        break;
      case 'inquiry':
        typeContext = '문의 이메일';
        break;
      case 'complaint':
        typeContext = '불만 제기 이메일';
        break;
      case 'apology':
        typeContext = '사과 이메일';
        break;
      case 'invitation':
        typeContext = '초대 이메일';
        break;
      case 'thank':
        typeContext = '감사 인사 이메일';
        break;
      case 'follow-up':
        typeContext = '후속 조치 이메일';
        break;
      default:
        typeContext = '일반 이메일';
    }

    const keyPointsText = keyPoints ? `\n\n포함할 주요 내용:\n${keyPoints}` : '';

    const prompt = `${typeContext}을 작성해주세요.

받는 사람: ${recipient}
목적: ${purpose}
어조: ${toneInstruction}${keyPointsText}

한국어로 작성하고, 제목과 본문을 모두 포함하여 실제 이메일 형식으로 작성해주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 작성해주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 전문적인 이메일 작성 도우미입니다. 상황에 맞는 적절한 이메일을 작성해주세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 답변해주세요.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.6
    });

    const email = completion.choices[0].message.content.trim();
    
    logInfo(`이메일 생성 완료: ${email.substring(0, 50)}...`);
    
    res.json({ email });
    
  } catch (error) {
    logError(`이메일 생성 오류: ${error.message}`);
    res.status(500).json({ error: '이메일 생성 중 오류가 발생했습니다.' });
  }
}
