// 기상청 단기예보 API 서비스 (백엔드 프록시 사용)
class WeatherAPIService {
  constructor() {
    // 백엔드 API 기본 정보
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? '/api/weather' 
      : 'http://localhost:5000/api/weather';
    
    // 서울 중구 기본 좌표 (더 정확한 서울 중심)
    this.defaultCoords = {
      nx: 60,  // 서울 중구
      ny: 127  // 서울 중구
    };

    // 날씨 코드 매핑
    this.weatherCodes = {
      SKY: {
        1: '맑음',
        3: '구름많음', 
        4: '흐림'
      },
      PTY: {
        0: '없음',
        1: '비',
        2: '비/눈',
        3: '눈',
        4: '소나기',
        5: '빗방울',
        6: '빗방울눈날림',
        7: '눈날림'
      }
    };
  }

  // API 호출 공통 함수
  async fetchWeatherData(endpoint, params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${this.baseURL}/${endpoint}?${queryParams}`;
      
      console.log(`[WeatherAPI] 호출 URL: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`[WeatherAPI] 응답:`, result);
      
      // 백엔드 에러 체크
      if (!result.success) {
        throw new Error(result.error || 'Unknown backend error');
      }
      
      return result.data;
    } catch (error) {
      console.error(`[WeatherAPI] ${endpoint} 호출 실패:`, error);
      throw error;
    }
  }

  // 1. 초단기실황조회 (현재 날씨)
  async getCurrentWeather(nx = null, ny = null) {
    const coords = { nx: nx || this.defaultCoords.nx, ny: ny || this.defaultCoords.ny };
    
    const data = await this.fetchWeatherData('current', coords);
    return this.parseCurrentWeather(data);
  }

  // 2. 초단기예보조회 (6시간 예보)
  async getShortTermForecast(nx = null, ny = null) {
    const coords = { nx: nx || this.defaultCoords.nx, ny: ny || this.defaultCoords.ny };
    
    const data = await this.fetchWeatherData('forecast/short', coords);
    return this.parseShortTermForecast(data);
  }

  // 3. 단기예보조회 (3일 예보)
  async getLongTermForecast(nx = null, ny = null) {
    const coords = { nx: nx || this.defaultCoords.nx, ny: ny || this.defaultCoords.ny };
    
    const data = await this.fetchWeatherData('forecast/long', coords);
    return this.parseLongTermForecast(data);
  }

  // 현재 날씨 데이터 파싱
  parseCurrentWeather(data) {
    if (!data?.items?.item) {
      console.warn('[WeatherAPI] 실황 데이터가 없습니다');
      return null;
    }
    
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
          weather.precipitationType = this.weatherCodes.PTY[item.obsrValue] || '알 수 없음';
          break;
        case 'WSD': // 풍속
          weather.windSpeed = `${item.obsrValue}m/s`;
          break;
        default:
          // 알 수 없는 카테고리 무시
          break;
      }
    });
    
    return {
      ...weather,
      updateTime: `${data.baseDate} ${data.baseTime}`,
      location: `좌표: (${data.nx}, ${data.ny})`
    };
  }

  // 초단기예보 데이터 파싱  
  parseShortTermForecast(data) {
    console.log('[WeatherAPI] 초단기예보 원본 데이터:', data);
    
    if (!data?.items?.item) {
      console.warn('[WeatherAPI] 초단기예보 데이터가 없습니다:', data);
      return [];
    }
    
    const items = Array.isArray(data.items.item) ? data.items.item : [data.items.item];
    console.log('[WeatherAPI] 초단기예보 아이템 수:', items.length);
    
    const forecastMap = {};
    
    // 시간별로 그룹화 (fcstDate + fcstTime 기준)
    items.forEach(item => {
      const timeKey = `${item.fcstDate}_${item.fcstTime}`;
      
      if (!forecastMap[timeKey]) {
        forecastMap[timeKey] = {
          date: item.fcstDate,
          time: item.fcstTime,
          data: {}
        };
      }
      
      // 기상청 가이드에 따른 카테고리별 데이터 매핑
      switch (item.category) {
        case 'T1H': // 기온
          forecastMap[timeKey].data.temperature = `${item.fcstValue}°C`;
          break;
        case 'RN1': // 1시간 강수량 (범주)
          forecastMap[timeKey].data.rainfall = this.parseRainfall(item.fcstValue);
          break;
        case 'SKY': // 하늘상태 (1:맑음, 3:구름많음, 4:흐림)
          forecastMap[timeKey].data.sky = this.weatherCodes.SKY[item.fcstValue] || '알 수 없음';
          break;
        case 'PTY': // 강수형태 (0:없음, 1:비, 2:비/눈, 3:눈, 5:빗방울, 6:빗방울눈날림, 7:눈날림)
          forecastMap[timeKey].data.precipitationType = this.weatherCodes.PTY[item.fcstValue] || '없음';
          break;
        case 'REH': // 습도
          forecastMap[timeKey].data.humidity = `${item.fcstValue}%`;
          break;
        case 'WSD': // 풍속
          forecastMap[timeKey].data.windSpeed = `${item.fcstValue}m/s`;
          break;
        case 'UUU': // 동서바람성분
          forecastMap[timeKey].data.windU = item.fcstValue;
          break;
        case 'VVV': // 남북바람성분
          forecastMap[timeKey].data.windV = item.fcstValue;
          break;
        case 'VEC': // 풍향
          forecastMap[timeKey].data.windDirection = `${item.fcstValue}°`;
          break;
        case 'LGT': // 낙뢰
          forecastMap[timeKey].data.lightning = `${item.fcstValue}kA`;
          break;
        default:
          // 알 수 없는 카테고리 무시
          break;
      }
    });
    
    // 시간순으로 정렬하여 6시간치 반환
    const sortedForecasts = Object.values(forecastMap)
      .sort((a, b) => {
        const timeA = parseInt(a.date + a.time);
        const timeB = parseInt(b.date + b.time);
        return timeA - timeB;
      })
      .slice(0, 6); // 6시간 예보만 반환
    
    console.log('[WeatherAPI] 파싱된 초단기예보 데이터:', sortedForecasts);
    
    return sortedForecasts;
  }

  // 단기예보 데이터 파싱
  parseLongTermForecast(data) {
    console.log('[WeatherAPI] 단기예보 원본 데이터:', data);
    
    if (!data?.items?.item) {
      console.warn('[WeatherAPI] 단기예보 데이터가 없습니다:', data);
      return [];
    }
    
    const items = Array.isArray(data.items.item) ? data.items.item : [data.items.item];
    console.log('[WeatherAPI] 단기예보 아이템 수:', items.length);
    
    const forecastMap = {};
    
    // 날짜별로 그룹화
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
            forecastMap[date].data.sky = this.weatherCodes.SKY[item.fcstValue] || '알 수 없음';
          }
          break;
        case 'PTY': // 강수형태 (정오 기준)
          if (time === '1200') {
            forecastMap[date].data.precipitationType = this.weatherCodes.PTY[item.fcstValue] || '없음';
          }
          break;
        case 'POP': // 강수확률 (정오 기준)
          if (time === '1200') {
            forecastMap[date].data.rainProbability = `${item.fcstValue}%`;
          }
          break;
        default:
          // 알 수 없는 카테고리 무시
          break;
      }
    });
    
    const result = Object.values(forecastMap).slice(0, 3); // 3일치만 반환
    console.log('[WeatherAPI] 파싱된 단기예보 데이터:', result);
    
    return result;
  }

  // 강수량 범주 파싱
  parseRainfall(value) {
    const num = parseFloat(value);
    if (num < 1.0) return '1mm 미만';
    if (num >= 1.0 && num < 30.0) return `${num}mm`;
    if (num >= 30.0 && num < 50.0) return '30~50mm';
    return '50mm 이상';
  }

  // 날씨 아이콘 매핑
  getWeatherIcon(sky, pty) {
    if (pty && pty !== '없음') {
      if (pty.includes('비')) return '🌧️';
      if (pty.includes('눈')) return '❄️';
      if (pty.includes('소나기')) return '🌦️';
    }
    
    switch (sky) {
      case '맑음': return '☀️';
      case '구름많음': return '⛅';  
      case '흐림': return '☁️';
      default: return '🌤️';
    }
  }
}

// WeatherAPIService 인스턴스 생성 및 export
const weatherAPIService = new WeatherAPIService();
export default weatherAPIService;
