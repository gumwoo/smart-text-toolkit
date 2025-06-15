// AI 날씨 코디네이터 서비스
class WeatherAdvisorService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? '/api' 
      : 'http://localhost:5000/api';
  }

  // 현재 날씨 데이터 가져오기 (간단한 형태)
  async getCurrentWeatherSimple(nx = 60, ny = 127) {
    try {
      console.log('[WeatherAdvisor] 간단 현재 날씨 조회 시작');
      
      const response = await fetch(`${this.baseURL}/weather/current-simple?nx=${nx}&ny=${ny}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[WeatherAdvisor] 현재 날씨 응답:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown backend error');
      }
      
      return result.weather;
    } catch (error) {
      console.error('[WeatherAdvisor] 현재 날씨 조회 실패:', error);
      throw error;
    }
  }

  // AI 조언 요청
  async getWeatherAdvice(weatherData, advisorType = 'outfit') {
    try {
      console.log('[WeatherAdvisor] AI 조언 요청:', { advisorType, weatherData });
      
      const response = await fetch(`${this.baseURL}/weather-advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weatherData,
          advisorType
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[WeatherAdvisor] AI 조언 응답:', result);
      
      return result;
    } catch (error) {
      console.error('[WeatherAdvisor] AI 조언 요청 실패:', error);
      throw error;
    }
  }

  // 옷차림 추천
  async getOutfitAdvice(weatherData) {
    return this.getWeatherAdvice(weatherData, 'outfit');
  }

  // 활동 추천
  async getActivityAdvice(weatherData) {
    return this.getWeatherAdvice(weatherData, 'activity');
  }

  // 건강 조언
  async getHealthAdvice(weatherData) {
    return this.getWeatherAdvice(weatherData, 'health');
  }
}

export default new WeatherAdvisorService();
