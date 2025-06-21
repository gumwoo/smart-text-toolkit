# 스마트 텍스트 도구함 (Smart Text Toolkit) 프로젝트

## 프로젝트 개요
AI를 활용한 텍스트 생성, 요약, 이메일 작성 도구를 제공하는 PWA 앱

## 기술 스택
- **Frontend**: React 19.1.0, React Router DOM 7.6.2
- **Backend**: Node.js, Express 5.1.0
- **AI**: OpenAI GPT-4o-mini
- **기타**: 
  - 기상청 API 연동 (날씨 기반 조언)
  - PWA 지원 (Service Worker)
  - Android APK 생성 (Bubblewrap CLI)

## 현재 상태

### ✅ 완료된 기능
1. **Backend API 서버** (server.js)
   - Express 서버 구성 완료
   - OpenAI API 연동 완료
   - CORS 설정 완료
   - 로깅 시스템 구축 (logs 폴더)

2. **AI 기능 API**
   - 명언 생성 API (`/api/generate-quote`)
   - 텍스트 요약 API (`/api/summarize-text`)
   - 이메일 생성 API (`/api/generate-email`)
   - 창의적 콘텐츠 생성 API (`/api/generate-creative`)

3. **날씨 기능** (routes/weather.js)
   - 기상청 API 연동 완료
   - 현재 날씨 조회 (`/api/weather/current`)
   - 단기예보 조회 (`/api/weather/forecast/short`)
   - AI 날씨 조언 API (`/api/weather-advisor`)

4. **Frontend 구조**
   - React 앱 기본 구조 완성
   - PWA 설정 (manifest.json, Service Worker)

5. **배포 설정**
   - Vercel 배포 설정 (vercel.json)
   - 환경 변수 설정 (.env)

6. **PWA Manifest 수정 완료** ✅
   - 아이콘 타입 수정 (PNG → image/png)
   - start_url 절대 경로로 수정
   - scope 필드 추가
   - prefer_related_applications 필드 추가
   - 모든 로고 파일 존재 확인 완료

7. **Android APK 생성 완료** ✅
   - Bubblewrap CLI 설정 완료
   - 키스토어 생성 및 서명 완료
   - APK 파일 생성: `app-release-signed.apk`
   - AAB 파일 생성: `app-release-bundle.aab`
   - Gradle 메모리 문제 해결

### ❌ 현재 발견된 문제점

#### 1. Bubblewrap CLI 오류
**문제**: `cli ERROR The session has been destroyed`
**원인 분석**:
- Node.js 버전 호환성 문제 가능성
- Windows 환경에서의 파일 권한 문제
- JDK/Android SDK 자동 설치 과정 중 오류

#### 2. PWA Manifest 아이콘 타입 불일치
**문제**: manifest.json의 아이콘 타입 설정 오류
```json
{
  "src": "logo192.png",
  "type": "image/svg+xml",  // PNG 파일인데 SVG로 설정됨
  "sizes": "192x192"
}
```

#### 3. Package.json 잠재적 문제
- Express 5.1.0 (최신 버전으로 호환성 확인 필요)
- React 19.1.0 (최신 버전으로 호환성 확인 필요)

## 수정해야 할 사항

### 🔧 즉시 수정 필요
1. **의존성 버전 호환성 검토**

### 📋 해야 할 일
1. Frontend React 컴포넌트 개발
2. 사용자 인터페이스 구현
3. API 연동 테스트
4. Android APK 생성 완료
5. 성능 최적화

## 디렉토리 구조
```
C:\app-onestore/
├── frontend/           # React 앱
├── api/               # API 관련 파일
├── routes/            # Express 라우터
├── docs/              # 문서
├── logs/              # 로그 파일
├── utils/             # 유틸리티
├── twa-app/           # TWA 관련 파일
├── server.js          # 메인 서버
├── package.json       # 백엔드 의존성
└── twa-manifest.json  # TWA 설정
```

## 다음 단계
1. 현재 발견된 문제점 수정
2. Frontend 개발 진행
3. 전체 시스템 테스트
4. APK 생성 재시도
