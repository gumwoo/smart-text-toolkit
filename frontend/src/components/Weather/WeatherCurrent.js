import React, { useState, useEffect } from 'react';
import weatherAPI from '../../services/weatherAPI';

const WeatherCurrent = ({ nx, ny }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // 현재 날씨 데이터 로드
  const loadCurrentWeather = async () => {
    try {
      console.log('[WeatherCurrent] 현재 날씨 조회 시작');
      setLoading(true);
      setError(null);
      
      const data = await weatherAPI.getCurrentWeather(nx, ny);
      
      if (data) {
        setCurrentWeather(data);
        setLastUpdated(new Date().toLocaleString());
        console.log('[WeatherCurrent] 현재 날씨 조회 완료:', data);
      } else {
        setError('날씨 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('[WeatherCurrent] 현재 날씨 조회 실패:', err);
      setError(err.message || '날씨 정보를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentWeather();
    
    // 10분마다 자동 업데이트
    const interval = setInterval(loadCurrentWeather, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [nx, ny]);

  // 새로고침 버튼 핸들러
  const handleRefresh = () => {
    console.log('[WeatherCurrent] 수동 새로고침 요청');
    loadCurrentWeather();
  };

  if (loading) {
    return (
      <div className="weather-current loading">
        <div className="weather-card">
          <div className="weather-header">
            <h3>현재 날씨</h3>
            <div className="loading-spinner">🔄</div>
          </div>
          <p>날씨 정보를 불러오는 중...</p>
        </div>
        <style jsx>{`
          .weather-current {
            margin: 20px 0;
          }
          
          .weather-card {
            background: linear-gradient(135deg, #74b9ff, #0984e3);
            color: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            min-height: 300px;
          }
          
          .loading .weather-card {
            background: linear-gradient(135deg, #a29bfe, #6c5ce7);
          }
          
          .loading-spinner {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-current error">
        <div className="weather-card">
          <div className="weather-header">
            <h3>현재 날씨</h3>
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              title="새로고침"
            >
              🔄
            </button>
          </div>
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={handleRefresh} className="retry-btn">
              다시 시도
            </button>
          </div>
        </div>
        <style jsx>{`
          .weather-current {
            margin: 20px 0;
          }
          
          .weather-card {
            background: linear-gradient(135deg, #74b9ff, #0984e3);
            color: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            min-height: 300px;
          }
          
          .error .weather-card {
            background: linear-gradient(135deg, #e17055, #d63031);
          }
          
          .weather-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .refresh-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            cursor: pointer;
            font-size: 16px;
          }
          
          .error-message {
            text-align: center;
            padding: 20px;
          }
          
          .retry-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
          }
        `}</style>
      </div>
    );
  }

  if (!currentWeather) {
    return (
      <div className="weather-current no-data">
        <div className="weather-card">
          <div className="weather-header">
            <h3>현재 날씨</h3>
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              title="새로고침"
            >
              🔄
            </button>
          </div>
          <p>날씨 데이터가 없습니다.</p>
        </div>
        <style jsx>{`
          .weather-current {
            margin: 20px 0;
          }
          
          .weather-card {
            background: linear-gradient(135deg, #74b9ff, #0984e3);
            color: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            min-height: 300px;
            opacity: 0.7;
          }
          
          .weather-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .refresh-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            cursor: pointer;
            font-size: 16px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="weather-current">
      <div className="weather-card">
        <div className="weather-header">
          <h3>현재 날씨</h3>
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            title="새로고침"
          >
            🔄
          </button>
        </div>
        
        <div className="weather-main">
          <div className="temperature-display">
            <span className="temperature">{currentWeather.temperature || 'N/A'}</span>
            <span className="weather-icon">
              {weatherAPI.getWeatherIcon(
                currentWeather.sky, 
                currentWeather.precipitationType
              )}
            </span>
          </div>
          
          <div className="weather-condition">
            <span className="condition-text">
              {currentWeather.precipitationType !== '없음' 
                ? currentWeather.precipitationType 
                : (currentWeather.sky || '정보 없음')}
            </span>
          </div>
        </div>
        
        <div className="weather-details">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">습도</span>
              <span className="value">{currentWeather.humidity || 'N/A'}</span>
            </div>
            
            <div className="detail-item">
              <span className="label">강수량</span>
              <span className="value">{currentWeather.rainfall || '0mm'}</span>
            </div>
            
            <div className="detail-item">
              <span className="label">풍속</span>
              <span className="value">{currentWeather.windSpeed || 'N/A'}</span>
            </div>
            
            <div className="detail-item">
              <span className="label">강수형태</span>
              <span className="value">{currentWeather.precipitationType || '없음'}</span>
            </div>
          </div>
        </div>
        
        <div className="weather-footer">
          <div className="location-info">
            <span>📍 {currentWeather.location}</span>
          </div>
          <div className="update-info">
            <span>🕐 업데이트: {lastUpdated}</span>
          </div>
          <div className="api-info">
            <span>📊 기상청 ({currentWeather.updateTime})</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .weather-current {
          margin: 20px 0;
        }
        
        .weather-card {
          background: linear-gradient(135deg, #74b9ff, #0984e3);
          color: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          min-height: 300px;
        }
        
        .weather-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .weather-header h3 {
          margin: 0;
          font-size: 1.2em;
          font-weight: 600;
        }
        
        .refresh-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 16px;
        }
        
        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(180deg);
        }
        
        .weather-main {
          text-align: center;
          margin-bottom: 25px;
        }
        
        .temperature-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 10px;
        }
        
        .temperature {
          font-size: 3em;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .weather-icon {
          font-size: 2.5em;
          filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
        }
        
        .weather-condition {
          margin-top: 10px;
        }
        
        .condition-text {
          font-size: 1.1em;
          opacity: 0.9;
        }
        
        .weather-details {
          margin: 20px 0;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .detail-item {
          background: rgba(255, 255, 255, 0.15);
          padding: 12px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .detail-item .label {
          font-size: 0.9em;
          opacity: 0.8;
          margin-bottom: 5px;
        }
        
        .detail-item .value {
          font-size: 1.1em;
          font-weight: 600;
        }
        
        .weather-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding-top: 15px;
          margin-top: 20px;
          font-size: 0.9em;
          opacity: 0.8;
        }
        
        .weather-footer > div {
          margin-bottom: 5px;
        }
        
        @media (max-width: 768px) {
          .weather-card {
            padding: 15px;
          }
          
          .temperature {
            font-size: 2.5em;
          }
          
          .weather-icon {
            font-size: 2em;
          }
          
          .detail-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          
          .weather-footer {
            font-size: 0.8em;
          }
        }
      `}</style>
    </div>
  );
};

export default WeatherCurrent;
