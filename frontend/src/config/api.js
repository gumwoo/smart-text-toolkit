// API 기본 URL 설정
const getApiUrl = () => {
  // 운영 환경 (Vercel)에서는 상대 경로 사용
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  // 개발 환경에서는 로컬 서버 사용
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiUrl();

// API 엔드포인트들
export const API_ENDPOINTS = {
  GENERATE_QUOTE: `${API_BASE_URL}/api/generate-quote`,
  SUMMARIZE_TEXT: `${API_BASE_URL}/api/summarize-text`,
  GENERATE_EMAIL: `${API_BASE_URL}/api/generate-email`,
  GENERATE_CREATIVE: `${API_BASE_URL}/api/generate-creative`,
  WEATHER_ADVISOR: `${API_BASE_URL}/api/weather-advisor`,
  WEATHER_CURRENT: `${API_BASE_URL}/api/weather/current`,
};
