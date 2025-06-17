const express = require('express');
const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();
const logDir = path.join(__dirname, '../logs');

// 로깅 함수
const logInfo = (message) => {
  const logMessage = `[${new Date().toISOString()}] QUOTES-INFO: ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(path.join(logDir, 'app.log'), logMessage);
};

const logError = (message) => {
  const logMessage = `[${new Date().toISOString()}] QUOTES-ERROR: ${message}\n`;
  console.error(logMessage.trim());
  fs.appendFileSync(path.join(logDir, 'error.log'), logMessage);
};

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 명언 카테고리 정의
const QUOTE_CATEGORIES = [
  'motivational',
  'inspirational',
  'success',
  'life',
  'happiness',
  'wisdom',
  'perseverance',
  'leadership',
  'creativity',
  'love'
];

// 명언 생성 엔드포인트
router.post('/generate', async (req, res) => {
  try {
    const { category = 'motivational', language = 'korean' } = req.body;
    
    logInfo(`Quote generation requested - Category: ${category}, Language: ${language}`);
    
    // 카테고리 유효성 검사
    if (!QUOTE_CATEGORIES.includes(category)) {
      logError(`Invalid category requested: ${category}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Please use one of: ' + QUOTE_CATEGORIES.join(', ')
      });
    }

    // OpenAI API 호출
    const prompt = language === 'korean' 
      ? `${category} 주제로 한국어 명언을 하나 생성해주세요. 짧고 인상적인 문구로 만들어주세요. 작성자는 포함하지 마세요. **굵게**나 ###제목 같은 마크다운 문법을 사용하지 말고 일반 텍스트로만 작성해주세요.`
      : `Generate one ${category} quote in English. Make it short and impactful. Don't include the author. Do not use **bold** or ###headings markdown syntax. Respond only in plain text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a wise quote generator. Create meaningful and inspiring quotes. Do not use **bold** or ###headings markdown syntax. Respond only in plain text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.8
    });

    const quote = completion.choices[0].message.content.trim();
    
    logInfo(`Quote generated successfully - Category: ${category}`);
    
    res.json({
      success: true,
      data: {
        quote,
        category,
        language,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logError(`Quote generation failed: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate quote. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 사용 가능한 카테고리 조회
router.get('/categories', (req, res) => {
  logInfo('Quote categories requested');
  
  res.json({
    success: true,
    data: {
      categories: QUOTE_CATEGORIES,
      total: QUOTE_CATEGORIES.length
    }
  });
});

module.exports = router;
