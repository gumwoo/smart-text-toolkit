# App-OneStore 프로젝트 계획

## 프로젝트 개요
- **프로젝트명**: App-OneStore
- **설명**: Node.js/Express 기반 백엔드 API 서버와 React 프론트엔드를 포함한 웹 애플리케이션
- **기술 스택**: Node.js, Express, React, OpenAI API, 날씨 API

## 현재 상태 (2025-06-20)

### 🔴 긴급 해결 필요
- **server.js 파일 누락**: `npm run dev` 실행 시 `server.js` 파일을 찾을 수 없어 서버 시작 실패
- **package.json 설정 불일치**: main이 `index.js`로 설정되어 있으나 실제로는 `server.js` 실행 시도

### ✅ 완료된 작업
- 기본 프로젝트 구조 설정
- package.json 의존성 설정 완료
- server.js.backup 파일에서 server.js 복원
- 로그 디렉토리 설정 완료
- package.json main 필드를 server.js로 수정
- **파비콘 시스템 완전 교체**:
  - 기존 React 기본 파비콘 삭제
  - Smart Text Toolkit 브랜드에 맞는 새로운 파비콘 생성 (문서 + AI 스파크 디자인)
  - favicon.ico, favicon.svg, logo192.svg, logo512.svg 파일 생성
  - manifest.json 아이콘 설정 업데이트
  - index.html 메타데이터 및 타이틀 업데이트
  - 테마 색상을 브랜드 색상(#667eea)으로 변경
  - 기존 PNG 로고 파일들 백업 보관

### 📋 다음 해야할 작업
1. 서버 정상 작동 확인
2. 프론트엔드 연결 테스트
3. API 엔드포인트 테스트
4. 새로운 파비콘 브라우저에서 확인

## 프로젝트 구조
```
C:\app-onestore\
├── docs/              # 프로젝트 문서
├── frontend/          # React 프론트엔드
├── routes/            # Express 라우터
├── utils/             # 유틸리티 함수
├── logs/              # 로그 파일
├── api/               # API 관련 파일
├── server.js          # 메인 서버 파일 (복원 필요)
├── package.json       # 프로젝트 설정
└── .env              # 환경 변수
```

## API 엔드포인트
- `/api/weather` - 날씨 정보 API
- `/api/weather-advisor` - AI 날씨 조언 API
- `/api/generate-quote` - 명언 생성 API
- `/api/summarize-text` - 텍스트 요약 API
- `/api/generate-email` - 이메일 생성 API

## 로그 관리
- 로그 저장 위치: `C:\app-onestore\logs`
- 로그 종류: access.log, app.log, error.log

## 환경 설정
- 개발 서버: http://localhost:5000
- 프론트엔드: http://localhost:3000
- OpenAI API 키 필요
