import React, { useState } from 'react';

const QuoteGenerator = ({ setIsLoading, addNotification }) => {
  const [quote, setQuote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('영감');
  const [customTopic, setCustomTopic] = useState('');

  const categories = [
    '영감', '동기부여', '성공', '사랑', '인생', '지혜', 
    '도전', '희망', '꿈', '리더십', '자신감', '행복'
  ];

  const generateQuote = async () => {
    console.log('명언 생성 시작:', { selectedCategory, customTopic });
    
    if (!selectedCategory && !customTopic.trim()) {
      addNotification('카테고리를 선택하거나 주제를 입력해주세요.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const topic = customTopic.trim() || selectedCategory;
      const response = await fetch('http://localhost:5000/api/generate-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: topic }),
      });

      if (!response.ok) {
        throw new Error('명언 생성 실패');
      }

      const data = await response.json();
      setQuote(data.quote);
      addNotification('새로운 명언이 생성되었습니다!', 'success');
      console.log('명언 생성 완료:', data.quote);
      
    } catch (error) {
      console.error('명언 생성 오류:', error);
      addNotification('명언 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!quote) {
      addNotification('복사할 명언이 없습니다.', 'error');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(quote);
      addNotification('명언이 클립보드에 복사되었습니다!', 'success');
      console.log('클립보드 복사 완료');
    } catch (error) {
      console.error('클립보드 복사 오류:', error);
      addNotification('복사 중 오류가 발생했습니다.', 'error');
    }
  };

  const shareQuote = () => {
    if (!quote) {
      addNotification('공유할 명언이 없습니다.', 'error');
      return;
    }

    if (navigator.share) {
      navigator.share({
        title: '스마트 텍스트 도구함에서 생성한 명언',
        text: quote,
        url: window.location.href
      }).then(() => {
        console.log('공유 완료');
      }).catch(error => {
        console.error('공유 오류:', error);
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2>💬 명언 생성기</h2>
        <p>카테고리를 선택하거나 원하는 주제를 입력하여 영감을 주는 명언을 생성하세요.</p>
      </div>

      <div className="tool-controls">
        <div className="control-group">
          <label htmlFor="category-select">카테고리 선택:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="">카테고리 선택...</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="custom-topic">또는 직접 주제 입력:</label>
          <input
            id="custom-topic"
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="예: 새로운 시작, 용기, 변화..."
            className="custom-topic-input"
          />
        </div>

        <button 
          onClick={generateQuote}
          className="generate-button primary"
          disabled={!selectedCategory && !customTopic.trim()}
        >
          명언 생성하기
        </button>
      </div>

      {quote && (
        <div className="result-container">
          <div className="quote-display">
            <blockquote className="generated-quote">
              "{quote}"
            </blockquote>
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={copyToClipboard}
              className="action-button secondary"
            >
              📋 복사하기
            </button>
            <button 
              onClick={shareQuote}
              className="action-button secondary"
            >
              📤 공유하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteGenerator;
