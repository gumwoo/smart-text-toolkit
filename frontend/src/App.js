import React, { useState, useEffect } from 'react';
import './App.css';

// 컴포넌트 임포트
import Header from './components/Header';
import ToolSelector from './components/ToolSelector';
import QuoteGenerator from './components/QuoteGenerator';
import TextSummarizer from './components/TextSummarizer';
import EmailHelper from './components/EmailHelper';
import CreativeWriter from './components/CreativeWriter';
import WeatherDashboard from './components/Weather/WeatherDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import PWAInstallPrompt from './components/PWAInstallPrompt';

function App() {
  const [activeTool, setActiveTool] = useState('quote');
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // 알림 추가 함수
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    // 3초 후 자동 제거
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // 도구 변경 핸들러
  const handleToolChange = (toolName) => {
    console.log(`도구 변경: ${toolName}`);
    setActiveTool(toolName);
    addNotification(`${getToolDisplayName(toolName)} 도구로 전환했습니다.`);
  };

  // 도구 이름 표시용 함수
  const getToolDisplayName = (toolName) => {
    const toolNames = {
      quote: '명언 생성기',
      summarizer: '텍스트 요약기',
      email: '이메일 도우미',
      creative: '창의적 글쓰기',
      weather: '스마트 날씨'
    };
    return toolNames[toolName] || toolName;
  };

  // 활성 도구 컴포넌트 렌더링
  const renderActiveTool = () => {
    const commonProps = {
      setIsLoading,
      addNotification
    };

    switch (activeTool) {
      case 'quote':
        return <QuoteGenerator {...commonProps} />;
      case 'summarizer':
        return <TextSummarizer {...commonProps} />;
      case 'email':
        return <EmailHelper {...commonProps} />;
      case 'creative':
        return <CreativeWriter {...commonProps} />;
      case 'weather':
        return <WeatherDashboard />;
      default:
        return <QuoteGenerator {...commonProps} />;
    }
  };

  // PWA 설치 프롬프트 처리
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      // PWA 설치 프롬프트를 나중에 사용하려면 여기서 상태로 저장
      console.log('PWA 설치 프롬프트 준비됨');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <div className="App">
      {/* PWA 설치 프롬프트 */}
      <PWAInstallPrompt />

      {/* 알림 컨테이너 */}
      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification notification-${notification.type}`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* 로딩 오버레이 */}
      {isLoading && <LoadingSpinner />}

      {/* 메인 헤더 */}
      <Header />

      {/* 도구 선택 탭 */}
      <ToolSelector 
        activeTool={activeTool} 
        onToolChange={handleToolChange} 
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="main-content">
        <div className="container">
          {renderActiveTool()}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="app-footer">
        <p>&copy; 2025 스마트 텍스트 도구함 - AI로 더 스마트하게</p>
      </footer>
    </div>
  );
}

export default App;
