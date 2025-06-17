const axios = require('axios');

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nx = 60, ny = 127 } = req.query; // 기본값: 서울
    
    const API_KEY = process.env.WEATHER_API_KEY || 'dXpC5DY7AuPeOdYqR%2BG%2FHgKB6IksYE1y9OgQ8CxBDjOGe7BhKgK5qGNj6oWJ2L4ORMKqo9QFHKm0oT%2F7n%2FLGIQ%3D%3D';
    
    // 현재 시간 정보
    const now = new Date();
    const baseDate = now.getFullYear() + 
                    String(now.getMonth() + 1).padStart(2, '0') + 
                    String(now.getDate()).padStart(2, '0');
    
    // 정시 기준 시간 계산
    const hour = now.getHours();
    const baseTime = String(hour).padStart(2, '0') + '00';
    
    const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
    const params = {
      serviceKey: decodeURIComponent(API_KEY),
      pageNo: 1,
      numOfRows: 10,
      dataType: 'JSON',
      base_date: baseDate,
      base_time: baseTime,
      nx: parseInt(nx),
      ny: parseInt(ny)
    };

    console.log('현재 날씨 API 요청:', { baseDate, baseTime, nx, ny });
    
    const response = await axios.get(url, { params });
    const data = response.data;

    if (data.response.header.resultCode !== '00') {
      throw new Error(`API Error: ${data.response.header.resultMsg}`);
    }

    const items = data.response.body.items.item || [];
    const weather = {};
    
    // 데이터 파싱
    items.forEach(item => {
      switch (item.category) {
        case 'T1H': // 기온
          weather.temperature = `${item.obsrValue}°C`;
          break;
        case 'RN1': // 1시간 강수량
          weather.rainfall = `${item.obsrValue}mm`;
          break;
        case 'UUU': // 동서바람성분
          weather.windU = item.obsrValue;
          break;
        case 'VVV': // 남북바람성분
          weather.windV = item.obsrValue;
          break;
        case 'REH': // 습도
          weather.humidity = `${item.obsrValue}%`;
          break;
        case 'PTY': // 강수형태
          const ptyValue = item.obsrValue;
          weather.precipitationType = 
            ptyValue === '0' ? '없음' :
            ptyValue === '1' ? '비' :
            ptyValue === '2' ? '비/눈' :
            ptyValue === '3' ? '눈' :
            ptyValue === '5' ? '빗방울' :
            ptyValue === '6' ? '빗방울눈날림' :
            ptyValue === '7' ? '눈날림' : '정보없음';
          break;
        case 'VEC': // 풍향
          weather.windDirection = `${item.obsrValue}°`;
          break;
        case 'WSD': // 풍속
          weather.windSpeed = `${item.obsrValue}m/s`;
          break;
      }
    });

    // 하늘상태는 초단기실황에서 제공되지 않으므로 기본값 설정
    weather.sky = '정보없음';
    
    res.json({
      success: true,
      data: weather,
      rawData: items,
      requestInfo: { baseDate, baseTime, nx, ny }
    });

  } catch (error) {
    console.error('현재 날씨 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    });
  }
}
