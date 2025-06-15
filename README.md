# 🌟 스마트 텍스트 툴킷

> AI 기반 텍스트 처리 도구와 스마트 날씨 코디네이터를 제공하는 웹 애플리케이션

## ✨ 주요 기능

### 🤖 AI 텍스트 도구
- **💬 명언 생성기**: 카테고리별 영감을 주는 명언 생성
- **📝 텍스트 요약기**: 긴 텍스트를 간결하게 요약
- **📧 이메일 도우미**: 상황별 이메일 자동 작성
- **✨ 창의적 글쓰기**: 창의적 콘텐츠 및 스토리 생성

### 🌤️ 스마트 날씨 서비스
- **실시간 날씨 정보**: 기상청 공식 데이터 기반
- **🤖 AI 날씨 코디네이터**: 
  - 👗 옷차림 추천
  - 🏃 활동 제안
  - 💪 건강 관리 조언
- **18개 주요 도시** 지원
- **사용자 정의 좌표** 입력 가능

## 🛠️ 기술 스택

### Backend
- **Node.js** + Express
- **OpenAI GPT-4** API 연동
- **기상청 단기예보 API** 연동
- **CORS, Morgan** 미들웨어

### Frontend
- **React** 18
- **Progressive Web App** (PWA)
- **Responsive Design**
- **Modern CSS** (Flexbox, Grid)

### 개발 도구
- **ES6+** JavaScript
- **환경변수** 관리
- **실시간 로깅** 시스템
- **에러 핸들링**

## 🚀 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/gumwoo/smart-text-toolkit.git
cd smart-text-toolkit
```

### 2. 의존성 설치
```bash
# 백엔드 의존성 설치
npm install

# 프론트엔드 의존성 설치
cd frontend
npm install
cd ..
```

### 3. 환경변수 설정
`.env` 파일을 생성하고 다음 내용을 추가:
```env
# OpenAI API 키
OPENAI_API_KEY=your_openai_api_key_here

# 기상청 API 키 (두 개 중 하나는 동작해야 함)
WEATHER_API_KEY=your_weather_api_key_here
WEATHER_API_KEY_ENCODED=your_encoded_weather_api_key_here

# 서버 설정
PORT=5000
NODE_ENV=development
```

### 4. 애플리케이션 실행
```bash
# 백엔드 서버 실행 (포트 5000)
npm run dev

# 새 터미널에서 프론트엔드 실행 (포트 3000)
cd frontend
npm start
```

## 📱 모바일 앱 출시 계획

이 프로젝트는 **원스토어**에 하이브리드 앱으로 출시 예정입니다.

### 계획된 변환 방식:
- **Capacitor** 또는 **Cordova** 사용
- **PWA** 기능 활용
- **네이티브 앱** 형태로 패키징

## 🔧 API 엔드포인트

### AI 텍스트 처리
- `POST /api/generate-quote` - 명언 생성
- `POST /api/summarize-text` - 텍스트 요약
- `POST /api/generate-email` - 이메일 생성
- `POST /api/generate-creative` - 창의적 콘텐츠 생성

### 날씨 서비스
- `GET /api/weather/current` - 현재 날씨
- `POST /api/weather-advisor` - AI 날씨 조언

### 시스템
- `GET /health` - 헬스 체크

## 📊 프로젝트 구조

```
smart-text-toolkit/
├── 📁 frontend/          # React 프론트엔드
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── 📁 Weather/
│   │   │   │   ├── WeatherDashboard.js
│   │   │   │   ├── WeatherCurrent.js
│   │   │   │   └── WeatherAdvisor.js
│   │   │   ├── QuoteGenerator.js
│   │   │   ├── TextSummarizer.js
│   │   │   ├── EmailHelper.js
│   │   │   └── CreativeWriter.js
│   │   └── 📁 services/
│   └── 📁 public/
├── 📁 routes/            # Express 라우터
├── 📁 utils/             # 유틸리티 함수
├── 📁 logs/              # 로그 파일
├── 📁 docs/              # 프로젝트 문서
├── server.js             # 메인 서버 파일
└── package.json
```

## 🔒 보안 및 개인정보

- **API 키** 환경변수로 안전하게 관리
- **CORS** 정책 적용
- **개인정보 수집 최소화**
- **HTTPS** 권장 (프로덕션 환경)

## 📈 버전 히스토리

- **v1.0.0** - 초기 출시 버전
  - AI 텍스트 도구 4종
  - 스마트 날씨 서비스
  - PWA 지원

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트 링크: [https://github.com/gumwoo/smart-text-toolkit](https://github.com/gumwoo/smart-text-toolkit)

---

⭐ 이 프로젝트가 유용하다면 스타를 눌러주세요!
