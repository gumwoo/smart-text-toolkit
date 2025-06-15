import React from 'react';

const Header = () => {
  return (
    <header className="app-header">
      <div className="container">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">🔧 스마트 텍스트 도구함</h1>
            <p className="app-subtitle">AI로 더 스마트한 텍스트 작업</p>
          </div>
          <div className="header-info">
            <span className="version-badge">v1.0</span>
            <span className="status-badge online">온라인</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
