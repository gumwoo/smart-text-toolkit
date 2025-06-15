import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p className="loading-text">AI가 작업 중입니다...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
