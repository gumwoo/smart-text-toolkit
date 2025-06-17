import React, { useState } from 'react';

const TextSummarizer = ({ setIsLoading, addNotification }) => {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');

  // 마크다운 문법 제거 함수 (** 굵게와 ### 제목만 제거)
  const removeMarkdown = (text) => {
    if (!text) return '';
    
    return text
      // ### 제목 제거
      .replace(/^#{1,6}\s+/gm, '')
      // ** 굵게 문법 제거
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .trim();
  };

  const lengthOptions = [
    { value: 'short', label: '짧게 (1-2 문장)', description: '핵심만 간단히' },
    { value: 'medium', label: '보통 (3-5 문장)', description: '주요 내용 요약' },
    { value: 'long', label: '길게 (한 문단)', description: '상세한 요약' }
  ];

  const summarizeText = async () => {
    console.log('텍스트 요약 시작:', { length: summaryLength, textLength: inputText.length });
    
    if (!inputText.trim()) {
      addNotification('요약할 텍스트를 입력해주세요.', 'error');
      return;
    }

    if (inputText.trim().length < 50) {
      addNotification('최소 50자 이상의 텍스트를 입력해주세요.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/summarize-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: inputText.trim(),
          length: summaryLength
        }),
      });

      if (!response.ok) {
        throw new Error('요약 생성 실패');
      }

      const data = await response.json();
      const cleanSummary = removeMarkdown(data.summary);
      setSummary(cleanSummary);
      addNotification('텍스트 요약이 완료되었습니다!', 'success');
      console.log('요약 생성 완료:', cleanSummary);
      
    } catch (error) {
      console.error('요약 생성 오류:', error);
      addNotification('요약 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!summary) {
      addNotification('복사할 요약이 없습니다.', 'error');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(summary);
      addNotification('요약이 클립보드에 복사되었습니다!', 'success');
      console.log('클립보드 복사 완료');
    } catch (error) {
      console.error('클립보드 복사 오류:', error);
      addNotification('복사 중 오류가 발생했습니다.', 'error');
    }
  };

  const clearAll = () => {
    setInputText('');
    setSummary('');
    addNotification('내용이 초기화되었습니다.', 'info');
  };

  const wordCount = inputText.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2>📝 텍스트 요약기</h2>
        <p>긴 텍스트를 입력하면 AI가 핵심 내용을 간단히 요약해드립니다.</p>
      </div>

      <div className="tool-controls">
        <div className="control-group">
          <label htmlFor="input-text">요약할 텍스트:</label>
          <textarea
            id="input-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="여기에 요약하고 싶은 텍스트를 입력하세요... (최소 50자)"
            className="text-input large"
            rows="8"
          />
          <div className="input-info">
            <span className="word-count">
              {wordCount}개 단어 | {inputText.length}자
            </span>
          </div>
        </div>

        <div className="control-group">
          <label>요약 길이:</label>
          <div className="length-options">
            {lengthOptions.map(option => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name="summaryLength"
                  value={option.value}
                  checked={summaryLength === option.value}
                  onChange={(e) => setSummaryLength(e.target.value)}
                />
                <div className="radio-content">
                  <span className="radio-label">{option.label}</span>
                  <span className="radio-description">{option.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="button-group">
          <button 
            onClick={summarizeText}
            className="generate-button primary"
            disabled={!inputText.trim() || inputText.trim().length < 50}
          >
            텍스트 요약하기
          </button>
          <button 
            onClick={clearAll}
            className="action-button secondary"
          >
            전체 초기화
          </button>
        </div>
      </div>

      {summary && (
        <div className="result-container">
          <div className="summary-display">
            <h3>📋 요약 결과</h3>
            <div className="generated-summary">
              {summary}
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={copyToClipboard}
              className="action-button secondary"
            >
              📋 복사하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextSummarizer;
