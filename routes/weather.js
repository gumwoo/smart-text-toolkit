const express = require('express');
const axios = require('axios');
const router = express.Router();

// 기상청 API 설정
const WEATHER_API_CONFIG = {
  baseURL: 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0',
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

// 모든 요청을 로그로 남기는 미들웨어
router.use((req, res, next) => {
  console.log(`🌤️ [Weather Router] ${req.method} ${req.path} 요청 받음`);
  console.log(`🌤️ [Weather Router] Query:`, req.query);
  next();
});

// 테스트용 라우터 (가장 간단한 형태)
router.get('/test', (req, res) => {
  console.log('🔥 TEST ROUTE CALLED!');
  res.json({ success: true, message: 'Weather router is working!' });
});

// 1. 초단기실황조회 (현재 날씨)
router.get('/current', async (req, res) => {
  console.log('[Weather Router] /current 라우터 호출됨');
  console.log('[Weather Router] 요청 파라미터:', req.query);
  
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

// 단기예보 시간 계산 (3시간마다 발표: 02, 05, 08, 11, 14, 17, 20, 23시)
const getForecastDateTime = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // 가장 최근 발표시간 찾기
  const baseTimes = ['02', '05', '08', '11', '14', '17', '20', '23'];
  let baseTime = '23'; // 기본값
  let baseDate = now;
  
  // 현재 시간보다 이전의 가장 최근 발표시간 찾기
  for (let i = baseTimes.length - 1; i >= 0; i--) {
    const publishTime = parseInt(baseTimes[i]);
    if (hour >= publishTime) {
      baseTime = baseTimes[i] + '00';
      break;
    }
  }
  
  // 만약 현재 시간이 02시 이전이면 전날 23시 데이터 사용
  if (hour < 2) {
    baseTime = '2300';
    baseDate = new Date(now);
    baseDate.setDate(baseDate.getDate() - 1);
  }
  
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  
  return {
    baseDate: `${year}${month}${day}`,
    baseTime: baseTime
  };
};

// 2. 단기예보조회 (3일간 날씨 예보) - /forecast/short
router.get('/forecast/short', async (req, res) => {
  console.log('[Weather Router] /forecast/short 라우터 호출됨');
  console.log('[Weather Router] 요청 파라미터:', req.query);
  
  try {
    const { nx = 60, ny = 127 } = req.query;
    const { baseDate, baseTime } = getForecastDateTime();
    
    logWeatherAPI('단기예보 요청', { 
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
      ny: parseInt(ny),
      numOfRows: '1000' // 단기예보는 데이터가 많으므로 충분히 설정
    });
    
    logWeatherAPI('단기예보 API 호출 파라미터', params);
    
    const data = await callWeatherAPI('getVilageFcst', params);
    
    logWeatherAPI('단기예보 API 응답', { 
      itemCount: data?.items?.item?.length || 0,
      totalCount: data?.totalCount
    });
    
    // 단기예보 데이터 파싱
    const items = Array.isArray(data.items.item) ? data.items.item : [data.items.item];
    
    // 날짜별, 시간별로 데이터 그룹화
    const forecastData = {};
    
    items.forEach(item => {
      const date = item.fcstDate;
      const time = item.fcstTime;
      const category = item.category;
      const value = item.fcstValue;
      
      if (!forecastData[date]) {
        forecastData[date] = {};
      }
      if (!forecastData[date][time]) {
        forecastData[date][time] = {};
      }
      
      // 주요 카테고리만 선별
      switch (category) {
        case 'TMP': // 1시간 기온
          forecastData[date][time].temperature = `${value}°C`;
          break;
        case 'TMN': // 일 최저기온
          forecastData[date][time].minTemperature = `${value}°C`;
          break;
        case 'TMX': // 일 최고기온
          forecastData[date][time].maxTemperature = `${value}°C`;
          break;
        case 'SKY': // 하늘상태
          const skyMap = {1: '맑음', 3: '구름많음', 4: '흐림'};
          forecastData[date][time].sky = skyMap[value] || '알 수 없음';
          break;
        case 'PTY': // 강수형태
          const ptyMap = {0: '없음', 1: '비', 2: '비/눈', 3: '눈', 4: '소나기'};
          forecastData[date][time].precipitationType = ptyMap[value] || '알 수 없음';
          break;
        case 'POP': // 강수확률
          forecastData[date][time].precipitationProbability = `${value}%`;
          break;
        case 'PCP': // 1시간 강수량
          forecastData[date][time].precipitation = value === '강수없음' ? '0mm' : value;
          break;
        case 'REH': // 습도
          forecastData[date][time].humidity = `${value}%`;
          break;
        case 'WSD': // 풍속
          forecastData[date][time].windSpeed = `${value}m/s`;
          break;
      }
    });
    
    res.json({
      success: true,
      data: forecastData,
      rawData: data, // 원본 데이터도 포함
      timestamp: new Date().toISOString(),
      location: { nx: parseInt(nx), ny: parseInt(ny) },
      requestInfo: { baseDate, baseTime }
    });
    
  } catch (error) {
    logWeatherAPI('단기예보 조회 실패', { 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      endpoint: 'forecast/short'
    });
  }
});

// 3. 중기예보조회 (5-10일간 날씨 예보) - /forecast/long  
router.get('/forecast/long', async (req, res) => {
  console.log('[Weather Router] /forecast/long 라우터 호출됨');
  console.log('[Weather Router] 요청 파라미터:', req.query);
  
  try {
    // 중기예보는 별도 API 사용 (현재는 단기예보 데이터로 대체)
    const { nx = 60, ny = 127 } = req.query;
    const { baseDate, baseTime } = getForecastDateTime();
    
    logWeatherAPI('중기예보 요청 (단기예보로 대체)', { 
      nx: parseInt(nx), 
      ny: parseInt(ny), 
      baseDate, 
      baseTime,
      currentTime: new Date().toISOString()
    });
    
    // 임시로 단기예보 API 사용 (추후 중기예보 API로 변경 필요)
    const params = getCommonParams({
      base_date: baseDate,
      base_time: baseTime,
      nx: parseInt(nx),
      ny: parseInt(ny),
      numOfRows: '1000'
    });
    
    const data = await callWeatherAPI('getVilageFcst', params);
    
    logWeatherAPI('중기예보 API 응답 (단기예보 대체)', { 
      itemCount: data?.items?.item?.length || 0,
      totalCount: data?.totalCount
    });
    
    // 간단한 요약 형태로 제공
    const items = Array.isArray(data.items.item) ? data.items.item : [data.items.item];
    
    // 날짜별로 요약 데이터 생성
    const summary = {};
    
    items.forEach(item => {
      const date = item.fcstDate;
      const category = item.category;
      const value = item.fcstValue;
      
      if (!summary[date]) {
        summary[date] = {
          date: date,
          minTemp: null,
          maxTemp: null,
          sky: null,
          precipitation: null
        };
      }
      
      switch (category) {
        case 'TMN':
          summary[date].minTemp = `${value}°C`;
          break;
        case 'TMX':
          summary[date].maxTemp = `${value}°C`;
          break;
        case 'SKY':
          const skyMap = {1: '맑음', 3: '구름많음', 4: '흐림'};
          summary[date].sky = skyMap[value] || '알 수 없음';
          break;
        case 'PTY':
          const ptyMap = {0: '없음', 1: '비', 2: '비/눈', 3: '눈', 4: '소나기'};
          summary[date].precipitation = ptyMap[value] || '알 수 없음';
          break;
      }
    });
    
    res.json({
      success: true,
      summary: Object.values(summary),
      note: '현재 중기예보는 단기예보 데이터로 대체 제공됩니다. 추후 중기예보 API 연동 예정입니다.',
      timestamp: new Date().toISOString(),
      location: { nx: parseInt(nx), ny: parseInt(ny) },
      requestInfo: { baseDate, baseTime }
    });
    
  } catch (error) {
    logWeatherAPI('중기예보 조회 실패', { 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      endpoint: 'forecast/long'
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
