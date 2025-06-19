# App-OneStore 프로젝트 계획

## 📋 프로젝트 개요
- **프로젝트명**: App-OneStore
- **구조**: React (Frontend) + Express.js (Backend) 
- **배포 플랫폼**: Vercel
- **현재 상태**: Vercel 배포 실패 문제 해결 중

## 🚨 현재 문제점 (Vercel 배포 실패)

### 확인된 문제들
1. **vercel.json 설정 문제**
   - 현재 `builds` 속성을 사용하고 있으나, 이는 레거시 방식
   - `@vercel/static-build` 설정이 올바르지 않을 수 있음
   
2. **프로젝트 구조 문제**
   - Frontend: `frontend/` 폴더
   - Backend API: `api/` 폴더 
   - 루트에 `server.js` 있음 (Express 서버)

3. **빌드 설정 문제**
   - `installCommand`, `buildCommand`, `outputDirectory` 설정 검토 필요
   - React build 폴더 경로 확인 필요

## 🔍 조사할 웹사이트 목록

### 완료된 조사 (10개)
1. ✅ Vercel 공식 문서 - Error Codes
2. ✅ Vercel 공식 문서 - Troubleshooting Build Errors  
3. ✅ Vercel 공식 문서 - Why aren't commits triggering deployments
4. ✅ Vercel Status 페이지
5. ✅ Vercel 공식 문서 - Error List
6. ✅ Vercel 가이드 - Why is my deployed project showing a 404 error
7. ✅ GitHub Discussion - vercel/next.js #50560 (배포 에러 사례)
8. ✅ Vercel 공식 문서 - Managing Deployments
9. ✅ Stack Overflow - Deploying NextJS to Vercel failed
10. ✅ Vercel 공식 문서 - DEPLOYMENT_NOT_FOUND

### 추가 조사 완료 (10개)
11. ✅ Vercel 공식 문서 - Configuring projects with vercel.json
12. ✅ Vercel 가이드 - How to Deploy an Express.js Application  
13. ✅ Vercel 공식 문서 - Using Monorepos
14. ✅ Stack Overflow - Deploying NX Monorepo with React/Express
15. ✅ Vercel 가이드 - How to Deploy a Monorepo to Vercel Using Yarn
16. ✅ Vercel 블로그 - Monorepos are changing how teams build
17. ✅ Carlos Roso 블로그 - How to deploy a monorepo in Vercel
18. ✅ Vercel 공식 문서 - Deploying Turborepo to Vercel
19. ✅ Stack Overflow - How to deploy front and back end from same monorepo
20. ✅ GitHub Issue - unclear how to do monorepo deployment of CRA

## 📝 발견된 주요 해결책들

### vercel.json 설정 문제
- `builds` 속성 대신 새로운 설정 방식 사용 권장
- Express.js는 `api/` 폴더에 serverless function으로 배치
- React는 정적 빌드로 처리

### 2단계: 해결책 구현 (진행중) 🔄
- [x] 방안 A 선택 (Serverless Functions 방식)
- [x] vercel.json 새로 작성 (레거시 builds 제거)
- [x] package.json 수정 (Node.js 18.x 설정)
- [x] Express.js API 로직을 Serverless Functions로 변환
  - [x] `/api/health.js` - 헬스 체크
  - [x] `/api/index.js` - 루트 API 엔드포인트
  - [x] `/api/weather-advisor.js` - AI 날씨 조언
  - [x] `/api/generate-quote.js` - 명언 생성
  - [x] `/api/summarize-text.js` - 텍스트 요약
  - [x] `/api/generate-email.js` - 이메일 생성
  - [x] `/api/generate-creative.js` - 창의적 콘텐츠
- [ ] server.js 파일 처리 결정 (유지 vs 제거)
- [ ] 로컬 테스트

### 3단계: 테스트 및 배포
- [ ] 로컬에서 빌드 테스트
- [ ] Vercel CLI로 배포 테스트  
- [ ] 문제 발생시 로그 분석

## 🎯 즉시 적용 가능한 솔루션

### 최우선 추천: 방안 A (Serverless Functions)

**장점:**
- Express.js 코드를 최소한으로 수정
- 기존 API 구조 유지 가능
- Vercel의 권장 방식

**단점:**
- 일부 Express.js 기능 제한
- Serverless 환경 적응 필요

**구현 순서:**
1. 새로운 `vercel.json` 작성
2. `server.js`의 API 로직을 `api/` 폴더로 이동
3. React 빌드 설정 조정
4. 테스트 및 배포

## 📚 핵심 참고 자료 (검증된)

### Vercel 공식 가이드
- [Express.js on Vercel](https://vercel.com/guides/using-express-with-vercel)
- [React on Vercel](https://vercel.com/guides/deploying-react-with-vercel)
- [Project Configuration](https://vercel.com/docs/project-configuration)

### 실제 사례
- [Carlos Roso의 Monorepo 배포 사례](https://carlosroso.com/how-to-deploy-a-monorepo-in-vercel/)
- [Stack Overflow 검증된 답변들](https://stackoverflow.com/questions/78771856/what-should-my-vercel-json-config-file-to-deploy-my-mern-stack-given-my-current)

## 🔧 해야할 작업

### 1단계: 추가 웹사이트 조사 (완료) ✅
- [x] 20개 웹사이트 조사 완료
- [x] 각 웹사이트에서 솔루션 정보 수집 완료
- [x] 우리 프로젝트에 적용 가능한 해결책 정리 완료

## 🚨 분석 결과 - 주요 문제점 발견

### 문제 1: vercel.json 설정 오류
**현재 문제:**
- `builds` 속성 사용 (레거시 방식)
- `@vercel/static-build` 설정 부정확
- Express.js 서버와 API 함수 중복 정의

**해결책:** 
- `builds` 제거하고 새로운 방식 사용
- React는 자동 감지로 빌드
- Express.js는 Serverless Functions로 변환

### 문제 2: 프로젝트 구조 혼재
**현재 구조:**
```
프로젝트 루트/
├── server.js (Express 서버)
├── api/ (Serverless Functions)
├── frontend/ (React 앱)
└── vercel.json
```

**문제점:**
- Express 서버와 API 함수가 동시 존재
- Vercel에서는 둘 중 하나만 사용해야 함
- 빌드 명령어 충돌

### 문제 3: 환경 설정 불일치
- Node.js 버전 설정 필요
- 환경변수 처리 문제
- CORS 설정 충돌

## 💡 권장 해결 방안 (웹 조사 기반)

### 방안 A: Serverless Functions 방식 (권장)
```json
{
  "version": 2,
  "framework": "create-react-app",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/build",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 방안 B: 별도 프로젝트 분리
- Frontend: 별도 Vercel 프로젝트
- Backend: 별도 Vercel 프로젝트
- Monorepo 방식으로 관리

### 방안 C: Express.js 완전 제거
- `server.js` 삭제
- 모든 API를 `api/` 폴더의 개별 함수로 변환
- React Router로 SPA 라우팅 처리

## 🎯 목표
- Vercel에서 React + Express.js 앱 성공적으로 배포
- API 라우팅 정상 동작 확인
- 프론트엔드-백엔드 통신 정상화

## 📚 참고 자료
- [Vercel 공식 문서](https://vercel.com/docs)
- [Express.js on Vercel 가이드](https://vercel.com/guides/using-express-with-vercel)
- [React on Vercel 가이드](https://vercel.com/guides/deploying-react-with-vercel)

---
*마지막 업데이트: 2025-06-19*
