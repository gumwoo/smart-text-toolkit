import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA 서비스 워커 등록
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('앱이 오프라인 사용을 위해 캐시되었습니다.');
  },
  onUpdate: (registration) => {
    console.log('새 콘텐츠가 사용 가능합니다. 새로고침해주세요.');
    // 사용자에게 업데이트 알림 표시 가능
  }
});

// 성능 측정을 원하면 함수를 전달하여 결과를 로그하거나 분석 엔드포인트로 보내세요.
reportWebVitals();
