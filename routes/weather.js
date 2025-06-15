const express = require('express');
const axios = require('axios');
const router = express.Router();

// 기상청 API 설정
const WEATHER_API_CONFIG = {
  baseURL: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0',
  // 실제 제공받은 인코딩된 키와 디코딩된 키
  serviceKeys: {
    encoded: 'Lmc1Zq9hmKIACiZKiXehoeHi1ac4HG25EqROFy%2F%2FOkLBLhn5EWFL0X38pRF%2BFWvlRuRHJx7N79cf7zcsRUz%2BNA%3D%3D',
    decoded: 'Lmc1Zq9hmKIACiZKiXehoeHi1ac4HG25EqROFy//OkLBLhn5EWFL0X38pRF+FWvlRuRHJx7N79cf7zcsRUz+NA=='
  },
  timeout: 10000 // 10초 타임아웃
};

// 로깅 함수
const logWeatherAPI = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [WeatherAPI] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

// 공통 파라미터 생성 (키는 callWeatherAPI에서 처리)
const getCommonParams = (additionalParams = {}) => {
  return {
    numOfRows: '10',
    pageNo: '1',
    dataType: 'JSON',
    ...additionalParams
  };
};

// 현재 날짜/시간 생성 (초단기실황용 - 매시 정시 생성, 10분 이후 호출 가능)
const getCurrentDateTime = () => {
  const now = new Date();
  const minute = now.getMinutes();
  let hour = now.getHours();
  
  // 현재 시간이 10분 이전이면 이전 시간 데이터 사용
  if (minute < 10) {
    hour = hour === 0 ? 23 : hour - 1;
  }
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  let day = String(now.getDate()).padStart(2, '0');
  
  // 자정 이전 시간으로 가면 전날로 설정
  if (hour === 23 && now.getHours() === 0) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    day = String(yesterday.getDate()).padStart(2, '0');
  }
  
  const baseDate = `${year}${month}${day}`;
  const baseTime = String(hour).padStart(2, '0') + '00';
  
  return { baseDate, baseTime };
};

// API 호출 공통 함수 (인코딩/디코딩 키 자동 선택)
const callWeatherAPI = async (endpoint, params) => {
  const keyTypes = ['encoded', 'decoded'];
  
  for (let i = 0; i < keyTypes.length; i++) {
    const keyType = keyTypes[i];
    
    try {
      const serviceKey = WEATHER_API_CONFIG.serviceKeys[keyType];
      const finalParams = { ...params, serviceKey };
      
      logWeatherAPI(`${endpoint} 호출 시도 (${keyType} 키)`, { 
        params: { ...finalParams, serviceKey: serviceKey.substring(0, 20) + '...' },
        keyType: keyType,
        keyLength: serviceKey.length
      });
      
      const url = `${WEATHER_API_CONFIG.baseURL}/${endpoint}`;
      
      const response = await axios.get(url, {
        params: finalParams,
        timeout: WEATHER_API_CONFIG.timeout,
        headers: {
          'User-Agent': 'WeatherApp/1.0',
          'Accept': 'application/json'
        }
      });
      
      logWeatherAPI(`${endpoint} 응답 상태: ${response.status}`, {
        contentType: response.headers['content-type'],
        dataType: typeof response.data,
        keyType: keyType
      });
      
      // XML 응답인지 확인 (오류 응답)
      if (typeof response.data === 'string' && response.data.startsWith('<')) {
        logWeatherAPI(`${endpoint} XML 응답 감지 (${keyType} 키)`, { 
          xmlPreview: response.data.substring(0, 200)
        });
        
        // XML에서 에러 메시지 추출
        const errorMatch = response.data.match(/<cmmMsgHeader>(.*?)<\/cmmMsgHeader>/);
        const returnAuthMsg = response.data.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/);
        const returnReasonCode = response.data.match(/<returnReasonCode>(.*?)<\/returnReasonCode>/);
        
        let errorDetails = '';
        if (returnAuthMsg) errorDetails += `인증메시지: ${returnAuthMsg[1]} `;
        if (returnReasonCode) errorDetails += `에러코드: ${returnReasonCode[1]} `;
        if (errorMatch) errorDetails += `헤더메시지: ${errorMatch[1]}`;
        
        logWeatherAPI(`${endpoint} ${keyType} 키 실패: ${errorDetails}`);
        
        // 마지막 키가 아니면 다음 키로 시도
        if (i < keyTypes.length - 1) {
          logWeatherAPI(`${endpoint} 다음 키로 재시도...`);
          continue;
        } else {
          throw new Error(`모든 API 키 시도 실패: ${errorDetails || 'XML 오류 응답'}`);
        }
      }
      
      // JSON 응답 처리
      if (!response.data || !response.data.response) {
        logWeatherAPI(`${endpoint} 잘못된 응답 구조 (${keyType} 키)`, { 
          data: response.data 
        });
        
        if (i < keyTypes.length - 1) {
          continue;
        } else {
          throw new Error('Invalid API response structure');
        }
      }
      
      // API 에러 코드 확인
      const resultCode = response.data.response.header?.resultCode;
      const resultMsg = response.data.response.header?.resultMsg;
      
      if (resultCode !== '00') {
        logWeatherAPI(`${endpoint} API 에러 (${keyType} 키)`, { 
          resultCode, 
          resultMsg 
        });
        
        // 인증 관련 오류인 경우 다음 키로 시도
        if ((resultCode === '03' || resultCode === '22' || resultCode === '01') && i < keyTypes.length - 1) {
          logWeatherAPI(`${endpoint} 인증 오류로 다음 키 시도`);
          continue;
        } else {
          throw new Error(`API Error (${resultCode}): ${resultMsg}`);
        }
      }
      
      logWeatherAPI(`${endpoint} 성공 (${keyType} 키 사용)`);
      return response.data.response.body;
      
    } catch (error) {
      logWeatherAPI(`${endpoint} 시도 실패 (${keyType} 키)`, { 
        error: error.message,
        status: error.response?.status,
        attempt: i + 1,
        totalAttempts: keyTypes.length
      });
      
      // 마지막 시도가 아니면 다음 키로 계속
      if (i < keyTypes.length - 1) {
        continue;
      }
      
      // 모든 키 시도 실패
      if (error.response) {
        throw new Error(`모든 API 키 실패 - HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('기상청 API 서버 응답 없음');
      } else {
        throw new Error(`API 요청 설정 오류: ${error.message}`);
      }
    }
  }
};

// 1. 초단기실황조회 (현재 날씨)
router.get('/current', async (req, res) => {
  try {
    const { nx = 60, ny = 127 } = req.query;
    const { baseDate, baseTime } = getCurrentDateTime();
    
    logWeatherAPI('초단기실황 요청', { 
      nx: parseInt(nx), 
      ny: parseInt(ny), 
      baseDate, 
      baseTime,
      currentTime: new Date().toISOString()
    });
    
    const params = getCommonParams({
      base_date: baseDate,
      base_time: baseTime,
      nx: parseInt(nx),
      ny: parseInt(ny)
    });
    
    logWeatherAPI('초단기실황 API 호출 파라미터', params);
    
    const data = await callWeatherAPI('getUltraSrtNcst', params);
    
    logWeatherAPI('초단기실황 API 응답', { 
      itemCount: data?.items?.item?.length || 0,
      totalCount: data?.totalCount
    });
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      location: { nx: parseInt(nx), ny: parseInt(ny) },
      requestInfo: { baseDate, baseTime }
    });
    
  } catch (error) {
    logWeatherAPI('초단기실황 조회 실패', { 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      endpoint: 'current'
    });
  }
});

// 날씨 기반 AI 조언 요청용 현재 날씨 조회 (간단한 형태)
router.get('/current-simple', async (req, res) => {
  try {
    const { nx = 60, ny = 127 } = req.query;
    const { baseDate, baseTime } = getCurrentDateTime();
    
    const params = getCommonParams({
      base_date: baseDate,
      base_time: baseTime,
      nx: parseInt(nx),
      ny: parseInt(ny)
    });
    
    const data = await callWeatherAPI('getUltraSrtNcst', params);
    
    // 간단한 형태로 파싱
    const items = Array.isArray(data.items.item) ? data.items.item : [data.items.item];
    const weather = {};
    
    items.forEach(item => {
      switch (item.category) {
        case 'T1H': // 기온
          weather.temperature = `${item.obsrValue}°C`;
          break;
        case 'RN1': // 1시간 강수량
          weather.rainfall = `${item.obsrValue}mm`;
          break;
        case 'REH': // 습도
          weather.humidity = `${item.obsrValue}%`;
          break;
        case 'PTY': // 강수형태
          const ptyMap = {0: '없음', 1: '비', 2: '비/눈', 3: '눈', 4: '소나기', 5: '빗방울', 6: '빗방울눈날림', 7: '눈날림'};
          weather.precipitationType = ptyMap[item.obsrValue] || '알 수 없음';
          break;
        case 'WSD': // 풍속
          weather.windSpeed = `${item.obsrValue}m/s`;
          break;
      }
    });
    
    res.json({
      success: true,
      weather: weather,
      location: { nx: parseInt(nx), ny: parseInt(ny) },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logWeatherAPI('간단 현재 날씨 조회 실패', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 5. API 상태 확인
router.get('/health', async (req, res) => {
  try {
    // 간단한 API 호출로 상태 확인
    const { baseDate, baseTime } = getCurrentDateTime();
    const params = getCommonParams({
      base_date: baseDate,
      base_time: baseTime,
      nx: 60,
      ny: 127,
      numOfRows: 1
    });
    
    await callWeatherAPI('getUltraSrtNcst', params);
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      api: {
        baseURL: WEATHER_API_CONFIG.baseURL,
        hasServiceKey: !!WEATHER_API_CONFIG.serviceKey
      }
    });
    
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 에러 핸들링 미들웨어
router.use((error, req, res, next) => {
  logWeatherAPI('라우터 에러', { error: error.message, stack: error.stack });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
