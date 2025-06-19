const axios = require('axios');

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nx = 60, ny = 127 } = req.query; // 기본값: 서울
    
    const API_KEY = process.env.WEATHER_API_KEY || 'Lmc1Zq9hmKIACiZKiXehoeHi1ac4HG25EqROFy%2F%2FOkLBLhn5EWFL0X38pRF%2BFWvlRuRHJx7N79cf7zcsRUz%2BNA%3D%3D';
    
    // 현재 시간 정보
    const now = new Date();
    const baseDate = now.getFullYear() + 
                    String(now.getMonth() + 1).padStart(2, '0') + 
                    String(now.getDate()).padStart(2, '0');
    
    // 단기예보는 3시간마다 발표 (02, 05, 08, 11, 14, 17, 20, 23시)
    const hour = now.getHours();
    let baseTime;
    if (hour >= 23 || hour < 2) baseTime = '2300';
    else if (hour >= 20) baseTime = '2000';
    else if (hour >= 17) baseTime = '1700';
    else if (hour >= 14) baseTime = '1400';
    else if (hour >= 11) baseTime = '1100';
    else if (hour >= 8) baseTime = '0800';
    else if (hour >= 5) baseTime = '0500';
    else baseTime = '0200';
    
    const url = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
    const params = {
      serviceKey: decodeURIComponent(API_KEY),
      pageNo: 1,
      numOfRows: 500,
      dataType: 'JSON',
      base_date: baseDate,
      base_time: baseTime,
      nx: parseInt(nx),
      ny: parseInt(ny)
    };

    console.log('중기예보(단기예보 대체) API 요청:', { baseDate, baseTime, nx, ny });
    
    const response = await axios.get(url, { params });
    const data = response.data;

    if (data.response.header.resultCode !== '00') {
      throw new Error(`API Error: ${data.response.header.resultMsg}`);
    }

    const items = data.response.body.items.item || [];
    const forecastMap = {};
    
    // 날짜별로 그룹화 (7일치)
    items.forEach(item => {
      const date = item.fcstDate;
      if (!forecastMap[date]) {
        forecastMap[date] = {
          date: date,
          data: {}
        };
      }
      
      const time = item.fcstTime;
      
      switch (item.category) {
        case 'TMP': // 기온
          if (time === '1500') { // 오후 3시 기온을 대표값으로
            forecastMap[date].data.temperature = `${item.fcstValue}°C`;
          }
          break;
        case 'TMN': // 최저기온
          forecastMap[date].data.minTemp = `${item.fcstValue}°C`;
          break;
        case 'TMX': // 최고기온
          forecastMap[date].data.maxTemp = `${item.fcstValue}°C`;
          break;
        case 'SKY': // 하늘상태 (정오 기준)
          if (time === '1200') {
            const skyValue = item.fcstValue;
            forecastMap[date].data.sky = 
              skyValue === '1' ? '맑음' :
              skyValue === '3' ? '구름많음' :
              skyValue === '4' ? '흐림' : '정보없음';
          }
          break;
        case 'PTY': // 강수형태 (정오 기준)
          if (time === '1200') {
            const ptyValue = item.fcstValue;
            forecastMap[date].data.precipitationType = 
              ptyValue === '0' ? '없음' :
              ptyValue === '1' ? '비' :
              ptyValue === '2' ? '비/눈' :
              ptyValue === '3' ? '눈' :
              ptyValue === '5' ? '빗방울' :
              ptyValue === '6' ? '빗방울눈날림' :
              ptyValue === '7' ? '눈날림' : '없음';
          }
          break;
        case 'POP': // 강수확률 (정오 기준)
          if (time === '1200') {
            forecastMap[date].data.rainProbability = `${item.fcstValue}%`;
          }
          break;
        default:
          break;
      }
    });
    
    const result = Object.values(forecastMap).slice(0, 7); // 7일치 반환
    
    res.json({
      success: true,
      data: result,
      note: "중기예보 API 대신 단기예보 확장 데이터 사용",
      rawData: items.slice(0, 20), // 원본 데이터 일부만
      requestInfo: { baseDate, baseTime, nx, ny }
    });

  } catch (error) {
    console.error('중기예보(단기예보 대체) 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    });
  }
}
