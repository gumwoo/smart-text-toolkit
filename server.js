const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 로그 디렉토리 확인 및 생성
const logDir = path.join(__dirname, 'logs');
fs.ensureDirSync(logDir);

// 로그 스트림 설정
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'), 
  { flags: 'a' }
);

// OpenAI 클라이언트 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 미들웨어 설정
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3005', 
    'http://localhost:3006',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3005',
    'http://127.0.0.1:3006'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 모든 요청 로깅
app.use((req, res, next) => {
  console.log(`📝 Request: ${req.method} ${req.path} (${req.originalUrl})`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: accessLogStream }));

// 라우터 설정 (다른 라우트보다 먼저!)
console.log('🔍 Loading weather router...');
try {
  console.log('🔍 Requiring ./routes/weather...');
  const weatherRouter = require('./routes/weather');
  console.log('✅ Weather router required successfully');
  console.log('🔍 Weather router type:', typeof weatherRouter);
  console.log('🔍 Weather router keys:', Object.keys(weatherRouter || {}));
  
  console.log('🔍 Mounting weather router...');
  app.use('/api/weather', weatherRouter);
  console.log('✅ Weather router mounted at /api/weather');
  
  // 직접 테스트 라우터 추가 (비교용)
  app.get('/api/weather/direct-test', (req, res) => {
    console.log('🎯 Direct test route called!');
    res.json({ success: true, message: 'Direct route working!' });
  });
  
} catch (error) {
  console.error('❌ Weather router loading failed:', error.message);
  console.error('❌ Stack trace:', error.stack);
  
  // 임시 대체 라우터
  console.log('🔧 Creating fallback router...');
  app.get('/api/weather/test', (req, res) => {
    res.json({ success: true, message: 'Fallback router working' });
  });
}

// AI 날씨 코디네이터 API 추가
app.post('/api/weather-advisor', async (req, res) => {
  try {
    const { weatherData, advisorType = 'outfit' } = req.body;
    
    logInfo(`AI 날씨 조언 요청: 타입=${advisorType}, 온도=${weatherData?.temperature}, 습도=${weatherData?.humidity}`);
    
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
    
    logInfo(`AI 날씨 조언 생성 완료: ${advice.substring(0, 50)}...`);
    
    res.json({ 
      advice,
      advisorType,
      weatherData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logError(`AI 날씨 조언 생성 오류: ${error.message}`);
    res.status(500).json({ error: 'AI 날씨 조언 생성 중 오류가 발생했습니다.' });
  }
});

// 커스텀 로깅 함수
const logInfo = (message) => {
  const logMessage = `[${new Date().toISOString()}] INFO: ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(path.join(logDir, 'app.log'), logMessage);
};

const logError = (message) => {
  const logMessage = `[${new Date().toISOString()}] ERROR: ${message}\n`;
  console.error(logMessage.trim());
  fs.appendFileSync(path.join(logDir, 'error.log'), logMessage);
};

// 기본 라우트
app.get('/', (req, res) => {
  logInfo('Root endpoint accessed');
  res.json({ 
    message: 'Smart Text Toolkit API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 명언 생성 API
app.post('/api/generate-quote', async (req, res) => {
  try {
    const { category } = req.body;
    
    logInfo(`명언 생성 요청: 카테고리=${category}`);
    
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
    
    logInfo(`명언 생성 완료: ${quote.substring(0, 50)}...`);
    
    res.json({ quote });
    
  } catch (error) {
    logError(`명언 생성 오류: ${error.message}`);
    res.status(500).json({ error: '명언 생성 중 오류가 발생했습니다.' });
  }
});

// 텍스트 요약 API
app.post('/api/summarize-text', async (req, res) => {
  try {
    const { text, length } = req.body;
    
    logInfo(`텍스트 요약 요청: 길이=${length}, 텍스트길이=${text ? text.length : 0}`);
    
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
    
    logInfo(`텍스트 요약 완료: ${summary.substring(0, 50)}...`);
    
    res.json({ summary });
    
  } catch (error) {
    logError(`텍스트 요약 오류: ${error.message}`);
    res.status(500).json({ error: '텍스트 요약 중 오류가 발생했습니다.' });
  }
});

// 이메일 생성 API
app.post('/api/generate-email', async (req, res) => {
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
});

// 창의적 콘텐츠 생성 API
app.post('/api/generate-creative', async (req, res) => {
  try {
    const { type, genre, prompt, length, keywords } = req.body;
    
    logInfo(`창의적 콘텐츠 생성 요청: 유형=${type}, 장르=${genre}, 길이=${length}`);
    
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
    
    logInfo(`창의적 콘텐츠 생성 완료: ${content.substring(0, 50)}...`);
    
    res.json({ content });
    
  } catch (error) {
    logError(`창의적 콘텐츠 생성 오류: ${error.message}`);
    res.status(500).json({ error: '창의적 콘텐츠 생성 중 오류가 발생했습니다.' });
  }
});

// 오류 처리 미들웨어
app.use((error, req, res, next) => {
  logError(`서버 오류: ${error.message}`);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

// 404 처리
app.use((req, res) => {
  console.log(`❌ 404 Error Details:`);
  console.log(`   Method: ${req.method}`);
  console.log(`   Path: ${req.path}`);
  console.log(`   Original URL: ${req.originalUrl}`);
  console.log(`   Query: ${JSON.stringify(req.query)}`);
  
  logInfo(`404 요청: ${req.method} ${req.path} (Original: ${req.originalUrl})`);
  res.status(404).json({ 
    success: false,
    error: `Route not found: ${req.originalUrl}`,
    method: req.method,
    path: req.path
  });
});

// 서버 시작
app.listen(PORT, () => {
  logInfo(`Server is running on port ${PORT}`);
  console.log(`🚀 Smart Text Toolkit API Server running on http://localhost:${PORT}`);
});

// 예외 처리
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});

module.exports = app;
