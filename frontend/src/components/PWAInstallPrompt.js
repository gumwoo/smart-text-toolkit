import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // PWA가 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA 설치 프롬프트 이벤트 발생');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // appinstalled 이벤트 리스너
    const handleAppInstalled = () => {
      console.log('PWA가 설치되었습니다');
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS Safari에서는 beforeinstallprompt가 지원되지 않으므로 수동으로 표시
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone;

    if (isIOS && !isInStandaloneMode) {
      setShowInstallButton(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS에서는 수동 안내
      alert('홈 화면에 추가하려면:\n1. 공유 버튼(□↑) 터치\n2. "홈 화면에 추가" 선택');
      return;
    }

    const result = await deferredPrompt.prompt();
    console.log('PWA 설치 프롬프트 결과:', result.outcome);
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    // 24시간 후 다시 표시하도록 설정
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // 이미 설치되었거나 24시간 내에 무시했다면 표시하지 않음
  if (isInstalled) return null;
  
  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null;
  }

  if (!showInstallButton) return null;

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-content">
        <div className="pwa-install-icon">📱</div>
        <div className="pwa-install-text">
          <h3>앱으로 설치하기</h3>
          <p>홈 화면에 추가하여 더 빠르게 접근하세요!</p>
        </div>
        <div className="pwa-install-buttons">
          <button onClick={handleInstallClick} className="pwa-install-btn primary">
            설치하기
          </button>
          <button onClick={handleDismiss} className="pwa-install-btn secondary">
            나중에
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
