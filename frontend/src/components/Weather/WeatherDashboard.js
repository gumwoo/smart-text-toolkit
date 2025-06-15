import React, { useState } from 'react';
import WeatherCurrent from './WeatherCurrent';
import WeatherAdvisor from './WeatherAdvisor';

const WeatherDashboard = () => {
  const [coordinates, setCoordinates] = useState({
    nx: 60,
    ny: 127
  });
  
  const [locationName, setLocationName] = useState('서울 종로구');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [inputCoords, setInputCoords] = useState({ nx: '', ny: '' });

  const presetLocations = [
    { name: '서울 종로구', nx: 60, ny: 127 },
    { name: '서울 강남구', nx: 61, ny: 126 },
    { name: '부산 해운대구', nx: 99, ny: 75 },
    { name: '대구 중구', nx: 89, ny: 90 },
    { name: '인천 연수구', nx: 55, ny: 124 },
    { name: '광주 동구', nx: 58, ny: 74 },
    { name: '대전 유성구', nx: 67, ny: 100 },
    { name: '울산 남구', nx: 102, ny: 84 },
    { name: '세종시', nx: 66, ny: 103 },
    { name: '경기 수원시', nx: 60, ny: 121 },
    { name: '강원 춘천시', nx: 73, ny: 134 },
    { name: '충북 청주시', nx: 69, ny: 106 },
    { name: '충남 천안시', nx: 63, ny: 110 },
    { name: '전북 전주시', nx: 63, ny: 89 },
    { name: '전남 목포시', nx: 50, ny: 67 },
    { name: '경북 안동시', nx: 91, ny: 106 },
    { name: '경남 창원시', nx: 90, ny: 77 },
    { name: '제주 제주시', nx: 53, ny: 38 }
  ];

  const handleLocationChange = (location) => {
    setCoordinates({ nx: location.nx, ny: location.ny });
    setLocationName(location.name);
    setShowLocationInput(false);
    console.log(`[WeatherDashboard] 위치 변경: ${location.name} (${location.nx}, ${location.ny})`);
  };

  const handleCustomCoordinates = () => {
    const nx = parseInt(inputCoords.nx);
    const ny = parseInt(inputCoords.ny);
    
    if (isNaN(nx) || isNaN(ny) || nx < 1 || nx > 149 || ny < 1 || ny > 253) {
      alert('올바른 좌표를 입력해주세요.\nX좌표: 1~149, Y좌표: 1~253');
      return;
    }
    
    setCoordinates({ nx, ny });
    setLocationName(`사용자 위치 (${nx}, ${ny})`);
    setShowLocationInput(false);
    setInputCoords({ nx: '', ny: '' });
    console.log(`[WeatherDashboard] 사용자 정의 좌표 적용: (${nx}, ${ny})`);
  };

  const handleCancelInput = () => {
    setShowLocationInput(false);
    setInputCoords({ nx: '', ny: '' });
  };

  return (
    <div className="weather-dashboard">
      <div className="dashboard-header">
        <h2>🌤️ 스마트 날씨 & AI 코디네이터</h2>
        <div className="location-selector">
          <div className="current-location">
            <span className="location-name">📍 {locationName}</span>
            <button 
              className="change-location-btn"
              onClick={() => setShowLocationInput(!showLocationInput)}
              title="위치 변경"
            >
              ⚙️
            </button>
          </div>
          
          {showLocationInput && (
            <div className="location-input-panel">
              <div className="preset-locations">
                <h4>주요 도시</h4>
                <div className="preset-grid">
                  {presetLocations.map((location, index) => (
                    <button
                      key={index}
                      className="preset-btn"
                      onClick={() => handleLocationChange(location)}
                    >
                      {location.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="custom-coordinates">
                <h4>직접 입력</h4>
                <div className="coords-input">
                  <div className="input-group">
                    <label>X좌표:</label>
                    <input
                      type="number"
                      min="1"
                      max="149"
                      value={inputCoords.nx}
                      onChange={(e) => setInputCoords({...inputCoords, nx: e.target.value})}
                      placeholder="1-149"
                    />
                  </div>
                  <div className="input-group">
                    <label>Y좌표:</label>
                    <input
                      type="number"
                      min="1"
                      max="253"
                      value={inputCoords.ny}
                      onChange={(e) => setInputCoords({...inputCoords, ny: e.target.value})}
                      placeholder="1-253"
                    />
                  </div>
                </div>
                <div className="coords-actions">
                  <button className="apply-btn" onClick={handleCustomCoordinates}>
                    적용
                  </button>
                  <button className="cancel-btn" onClick={handleCancelInput}>
                    취소
                  </button>
                </div>
                <div className="coords-help">
                  <small>
                    💡 기상청 격자 좌표를 입력하세요.<br/>
                    <a 
                      href="https://www.weather.go.kr/w/pop/p-table-list.do"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      좌표 찾기 (기상청)
                    </a>
                  </small>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="weather-content">
        <div className="weather-section">
          <WeatherCurrent nx={coordinates.nx} ny={coordinates.ny} />
        </div>
        
        <div className="weather-section">
          <WeatherAdvisor nx={coordinates.nx} ny={coordinates.ny} />
        </div>
      </div>

      <div className="dashboard-footer">
        <div className="api-info">
          <p>
            📊 <strong>데이터 제공:</strong> 기상청 단기예보 조회서비스 2.0<br/>
            🤖 <strong>AI 조언:</strong> OpenAI GPT-4 기반 개인화된 날씨 추천<br/>
            🔄 <strong>업데이트:</strong> 실시간 날씨 분석 및 맞춤형 조언 제공<br/>
            📍 <strong>좌표계:</strong> 기상청 격자 좌표 (X: {coordinates.nx}, Y: {coordinates.ny})
          </p>
        </div>
        
        <div className="usage-notice">
          <details>
            <summary>📋 사용 안내</summary>
            <div className="notice-content">
              <ul>
                <li><strong>현재 날씨:</strong> 실시간 기상 정보 (온도, 습도, 풍속 등)</li>
                <li><strong>AI 옷차림 추천:</strong> 날씨에 맞는 의상과 준비물 제안</li>
                <li><strong>AI 활동 추천:</strong> 현재 날씨에 적합한 실내외 활동 안내</li>
                <li><strong>AI 건강 조언:</strong> 날씨 기반 건강 관리 팁 제공</li>
                <li><strong>위치 변경:</strong> 주요 도시 선택 또는 직접 입력 가능</li>
                <li><strong>개인화:</strong> AI가 실시간 날씨를 분석해 맞춤형 조언 생성</li>
              </ul>
            </div>
          </details>
        </div>
      </div>

      <style jsx>{`
        .weather-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .dashboard-header {
          margin-bottom: 30px;
          text-align: center;
        }
        
        .dashboard-header h2 {
          margin: 0 0 20px 0;
          font-size: 2.2em;
          color: #2d3436;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .location-selector {
          position: relative;
          display: inline-block;
        }
        
        .current-location {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8f9fa;
          padding: 10px 15px;
          border-radius: 10px;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
        }
        
        .current-location:hover {
          border-color: #74b9ff;
          box-shadow: 0 2px 8px rgba(116, 185, 255, 0.2);
        }
        
        .location-name {
          font-weight: 600;
          color: #2d3436;
        }
        
        .change-location-btn {
          background: #74b9ff;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }
        
        .change-location-btn:hover {
          background: #0984e3;
          transform: rotate(90deg);
        }
        
        .location-input-panel {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          width: 500px;
          max-width: 90vw;
          margin-top: 10px;
        }
        
        .location-input-panel h4 {
          margin: 0 0 15px 0;
          color: #2d3436;
          font-size: 1.1em;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 8px;
        }
        
        .preset-locations {
          margin-bottom: 25px;
        }
        
        .preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }
        
        .preset-btn {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9em;
          text-align: center;
        }
        
        .preset-btn:hover {
          background: #74b9ff;
          color: white;
          border-color: #74b9ff;
          transform: translateY(-1px);
        }
        
        .custom-coordinates {
          border-top: 1px solid #e9ecef;
          padding-top: 20px;
        }
        
        .coords-input {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .input-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .input-group label {
          font-size: 0.9em;
          font-weight: 600;
          color: #636e72;
        }
        
        .input-group input {
          padding: 8px 12px;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          font-size: 0.9em;
          transition: border-color 0.2s ease;
        }
        
        .input-group input:focus {
          outline: none;
          border-color: #74b9ff;
          box-shadow: 0 0 0 2px rgba(116, 185, 255, 0.2);
        }
        
        .coords-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 15px;
        }
        
        .apply-btn {
          background: #00b894;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        
        .apply-btn:hover {
          background: #00a085;
          transform: translateY(-1px);
        }
        
        .cancel-btn {
          background: #636e72;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        
        .cancel-btn:hover {
          background: #2d3436;
          transform: translateY(-1px);
        }
        
        .coords-help {
          text-align: center;
          opacity: 0.7;
        }
        
        .coords-help a {
          color: #74b9ff;
          text-decoration: none;
        }
        
        .coords-help a:hover {
          text-decoration: underline;
        }
        
        .weather-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }
        
        .weather-section {
          min-height: 400px;
        }
        
        .dashboard-footer {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          margin-top: 30px;
        }
        
        .api-info {
          margin-bottom: 20px;
        }
        
        .api-info p {
          margin: 0;
          line-height: 1.6;
          color: #636e72;
        }
        
        .usage-notice summary {
          cursor: pointer;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 10px;
          padding: 10px;
          background: #e9ecef;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .usage-notice summary:hover {
          background: #ddd;
        }
        
        .notice-content {
          padding: 15px;
          background: white;
          border-radius: 8px;
          margin-top: 10px;
        }
        
        .notice-content ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .notice-content li {
          margin-bottom: 8px;
          color: #636e72;
        }
        
        @media (max-width: 768px) {
          .weather-dashboard {
            padding: 15px;
          }
          
          .dashboard-header h2 {
            font-size: 1.8em;
          }
          
          .weather-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .location-input-panel {
            width: 350px;
          }
          
          .preset-grid {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          }
          
          .coords-input {
            flex-direction: column;
            gap: 10px;
          }
        }
        
        @media (max-width: 480px) {
          .location-input-panel {
            width: 300px;
          }
          
          .preset-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default WeatherDashboard;
