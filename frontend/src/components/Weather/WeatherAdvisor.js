import React, { useState, useEffect } from 'react';
import weatherAPI from '../../services/weatherAPI';

const WeatherAdvisor = ({ nx, ny }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [advisorType, setAdvisorType] = useState('outfit');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);

  const advisorTypes = {
    outfit: { 
      icon: '👗', 
      title: '옷차림 추천',
      description: '현재 날씨에 맞는 의상과 준비물을 추천해드려요'
    },
    activity: { 
      icon: '🏃', 
      title: '활동 추천',
      description: '오늘 날씨에 좋은 실내외 활동을 제안해드려요'
    },
    health: { 
      icon: '💪', 
      title: '건강 조언',
      description: '날씨에 따른 건강 관리 팁을 알려드려요'
    }
  };

  // 현재 날씨 데이터 로드
  const loadCurrentWeather = async () => {
    try {
      console.log('[WeatherAdvisor] 현재 날씨 데이터 조회 시작');
      setError(null);
      
      const weatherData = await weatherAPI.getCurrentWeather(nx, ny);
      setCurrentWeather(weatherData);
      console.log('[WeatherAdvisor] 현재 날씨 데이터:', weatherData);
      
    } catch (err) {
      console.error('[WeatherAdvisor] 현재 날씨 조회 실패:', err);
      setError('현재 날씨 정보를 가져올 수 없습니다.');
    }
  };

  // AI 조언 생성
  const generateAIAdvice = async (weatherData, type) => {
    try {
      console.log('[WeatherAdvisor] AI 조언 생성 시작:', type);
      setIsGeneratingAdvice(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/weather-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weatherData: {
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            precipitationType: weatherData.precipitationType,
            sky: weatherData.sky
          },
          advisorType: type
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAiAdvice(data.advice);
      setLastUpdated(new Date().toLocaleString());
      
      console.log('[WeatherAdvisor] AI 조언 생성 완료:', data.advice.substring(0, 100));
      
    } catch (err) {
      console.error('[WeatherAdvisor] AI 조언 생성 실패:', err);
      setError('AI 조언을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await loadCurrentWeather();
      setLoading(false);
    };
    
    initializeData();
  }, [nx, ny]);

  // 현재 날씨가 로드되면 AI 조언 생성
  useEffect(() => {
    if (currentWeather && !aiAdvice) {
      generateAIAdvice(currentWeather, advisorType);
    }
  }, [currentWeather]);

  // 조언 타입 변경시 AI 조언 재생성
  const handleAdvisorTypeChange = (newType) => {
    console.log('[WeatherAdvisor] 조언 타입 변경:', newType);
    setAdvisorType(newType);
    setAiAdvice(null);
    
    if (currentWeather) {
      generateAIAdvice(currentWeather, newType);
    }
  };

  // 수동 새로고침
  const handleRefresh = async () => {
    console.log('[WeatherAdvisor] 수동 새로고침 요청');
    setLoading(true);
    await loadCurrentWeather();
    
    if (currentWeather) {
      await generateAIAdvice(currentWeather, advisorType);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="weather-advisor loading">
        <div className="advisor-card">
          <div className="advisor-header">
            <h3>🤖 AI 날씨 코디네이터</h3>
            <div className="loading-spinner">🔄</div>
          </div>
          <p>날씨 정보를 분석하고 있어요...</p>
        </div>
        <style jsx>{`
          .weather-advisor { margin: 20px 0; }
          .advisor-card {
            background: linear-gradient(135deg, #6c5ce7, #a29bfe);
            color: white; border-radius: 15px; padding: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }
          .advisor-header { 
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 15px;
          }
          .loading-spinner { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-advisor error">
        <div className="advisor-card">
          <div className="advisor-header">
            <h3>🤖 AI 날씨 코디네이터</h3>
            <button className="refresh-btn" onClick={handleRefresh}>🔄</button>
          </div>
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={handleRefresh} className="retry-btn">다시 시도</button>
          </div>
        </div>
        <style jsx>{`
          .weather-advisor { margin: 20px 0; }
          .advisor-card { 
            background: linear-gradient(135deg, #e17055, #d63031);
            color: white; border-radius: 15px; padding: 20px;
          }
          .refresh-btn { 
            background: rgba(255,255,255,0.2); border: none;
            border-radius: 50%; width: 35px; height: 35px; cursor: pointer;
          }
          .retry-btn {
            background: rgba(255,255,255,0.3); border: none; border-radius: 8px;
            padding: 8px 16px; color: white; cursor: pointer; margin-top: 10px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="weather-advisor">
      <div className="advisor-card">
        <div className="advisor-header">
          <h3>🤖 AI 날씨 코디네이터</h3>
          <button className="refresh-btn" onClick={handleRefresh}>🔄</button>
        </div>

        {/* 날씨 요약 */}
        {currentWeather && (
          <div className="weather-summary">
            <div className="weather-info">
              <span className="temp">{currentWeather.temperature}</span>
              <span className="condition">{currentWeather.precipitationType !== '없음' ? currentWeather.precipitationType : currentWeather.sky}</span>
            </div>
            <div className="weather-details">
              <span>습도 {currentWeather.humidity}</span>
              <span>풍속 {currentWeather.windSpeed}</span>
            </div>
          </div>
        )}

        {/* 조언 타입 선택 */}
        <div className="advisor-tabs">
          {Object.entries(advisorTypes).map(([key, type]) => (
            <button
              key={key}
              className={`advisor-tab ${advisorType === key ? 'active' : ''}`}
              onClick={() => handleAdvisorTypeChange(key)}
              disabled={isGeneratingAdvice}
            >
              <span className="tab-icon">{type.icon}</span>
              <span className="tab-text">{type.title}</span>
            </button>
          ))}
        </div>

        {/* AI 조언 내용 */}
        <div className="advice-content">
          <div className="advice-header">
            <h4>
              {advisorTypes[advisorType].icon} {advisorTypes[advisorType].title}
            </h4>
            <p className="advice-description">
              {advisorTypes[advisorType].description}
            </p>
          </div>
          
          {isGeneratingAdvice ? (
            <div className="generating-advice">
              <div className="thinking-animation">🤔 💭 ✨</div>
              <p>AI가 날씨를 분석하고 있어요...</p>
            </div>
          ) : aiAdvice ? (
            <div className="advice-text">
              {aiAdvice.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          ) : (
            <div className="no-advice">
              <p>조언을 생성하지 못했습니다. 새로고침을 시도해보세요.</p>
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="advisor-footer">
          <div>🤖 AI 기반 개인화 조언</div>
          {lastUpdated && <div>🕐 업데이트: {lastUpdated}</div>}
        </div>
      </div>

      <style jsx>{`
        .weather-advisor { margin: 20px 0; }
        .advisor-card {
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          color: white; border-radius: 15px; padding: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .advisor-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px;
        }
        .advisor-header h3 { margin: 0; font-size: 1.3em; font-weight: 600; }
        .refresh-btn {
          background: rgba(255, 255, 255, 0.2); border: none; border-radius: 50%;
          width: 35px; height: 35px; cursor: pointer; font-size: 16px;
          transition: all 0.3s ease;
        }
        .refresh-btn:hover { 
          background: rgba(255, 255, 255, 0.3); 
          transform: rotate(180deg); 
        }
        .weather-summary {
          background: rgba(255, 255, 255, 0.15); border-radius: 10px;
          padding: 15px; margin-bottom: 20px; text-align: center;
        }
        .weather-info { margin-bottom: 10px; }
        .temp {
          font-size: 2em; font-weight: bold; margin-right: 15px;
        }
        .condition { 
          font-size: 1.2em; opacity: 0.9;
        }
        .weather-details { 
          display: flex; justify-content: center; gap: 20px; 
          font-size: 0.9em; opacity: 0.8;
        }
        .advisor-tabs {
          display: flex; gap: 8px; margin-bottom: 20px;
        }
        .advisor-tab {
          flex: 1; padding: 12px 8px; border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1); color: white; border-radius: 8px;
          cursor: pointer; transition: all 0.3s ease; font-size: 0.85em;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .advisor-tab:hover:not(:disabled) { 
          background: rgba(255, 255, 255, 0.2); 
        }
        .advisor-tab:disabled {
          opacity: 0.6; cursor: not-allowed;
        }
        .advisor-tab.active {
          background: rgba(255, 255, 255, 0.3); 
          border-color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
        }
        .tab-icon { font-size: 1.2em; }
        .tab-text { font-size: 0.85em; }
        .advice-content {
          background: rgba(255, 255, 255, 0.1); border-radius: 12px;
          padding: 20px; margin-bottom: 20px; min-height: 200px;
        }
        .advice-header { margin-bottom: 15px; }
        .advice-header h4 { 
          margin: 0 0 8px 0; font-size: 1.1em; 
        }
        .advice-description { 
          margin: 0; font-size: 0.9em; opacity: 0.8; 
        }
        .generating-advice { 
          text-align: center; padding: 40px 20px; 
        }
        .thinking-animation { 
          font-size: 2em; margin-bottom: 15px;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .advice-text {
          line-height: 1.6; font-size: 0.95em;
        }
        .advice-text p {
          margin: 0 0 12px 0;
        }
        .advice-text p:last-child {
          margin-bottom: 0;
        }
        .no-advice {
          text-align: center; padding: 40px 20px; opacity: 0.7;
        }
        .advisor-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.2); 
          padding-top: 15px; font-size: 0.8em; opacity: 0.8;
        }
        .advisor-footer > div { 
          margin-bottom: 5px; 
        }
        .advisor-footer > div:last-child {
          margin-bottom: 0;
        }
        @media (max-width: 768px) {
          .advisor-tabs { 
            flex-direction: column; gap: 8px; 
          }
          .advisor-tab {
            flex-direction: row; justify-content: center;
            padding: 10px 15px;
          }
          .tab-icon { margin-right: 8px; }
          .weather-details { 
            flex-direction: column; gap: 8px; 
          }
        }
      `}</style>
    </div>
  );
};

export default WeatherAdvisor;
