import React, { useState } from 'react';

const CreativeWriter = ({ setIsLoading, addNotification }) => {
  const [contentType, setContentType] = useState('story');
  const [genre, setGenre] = useState('');
  const [prompt, setPrompt] = useState('');
  const [length, setLength] = useState('short');
  const [keywords, setKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

  const contentTypes = [
    { value: 'story', label: '짧은 이야기', description: '소설이나 단편 스토리' },
    { value: 'idea', label: '아이디어 브레인스토밍', description: '창의적 아이디어 생성' },
    { value: 'poem', label: '시/운율', description: '시나 운율 있는 문장' },
    { value: 'dialogue', label: '대화/시나리오', description: '캐릭터 간 대화' },
    { value: 'description', label: '묘사/설명', description: '장면이나 인물 묘사' },
    { value: 'blog', label: '블로그 아이디어', description: '블로그 포스팅 아이디어' }
  ];

  const genres = {
    story: ['판타지', '로맨스', '미스터리', '공상과학', '모험', '일상', '스릴러', '코미디'],
    idea: ['비즈니스', '기술', '교육', '엔터테인먼트', '소셜미디어', '마케팅', '창업', '혁신'],
    poem: ['자연', '사랑', '우정', '성장', '희망', '그리움', '계절', '인생'],
    dialogue: ['갈등', '화해', '첫만남', '이별', '협상', '상담', '면접', '데이트'],
    description: ['인물', '장소', '분위기', '감정', '행동', '배경', '사물', '상황'],
    blog: ['리뷰', '튜토리얼', '트렌드', '경험담', '팁', '분석', '예측', '추천']
  };

  const lengthOptions = [
    { value: 'short', label: '짧게', description: '1-2 단락' },
    { value: 'medium', label: '보통', description: '3-5 단락' },
    { value: 'long', label: '길게', description: '여러 단락' }
  ];

  const generateCreativeContent = async () => {
    console.log('창의적 콘텐츠 생성 시작:', { contentType, genre, prompt });
    
    if (!prompt.trim()) {
      addNotification('프롬프트나 주제를 입력해주세요.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/generate-creative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: contentType,
          genre: genre,
          prompt: prompt.trim(),
          length: length,
          keywords: keywords.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('창의적 콘텐츠 생성 실패');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      addNotification('창의적 콘텐츠가 생성되었습니다!', 'success');
      console.log('창의적 콘텐츠 생성 완료');
      
    } catch (error) {
      console.error('창의적 콘텐츠 생성 오류:', error);
      addNotification('창의적 콘텐츠 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedContent) {
      addNotification('복사할 콘텐츠가 없습니다.', 'error');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(generatedContent);
      addNotification('콘텐츠가 클립보드에 복사되었습니다!', 'success');
      console.log('클립보드 복사 완료');
    } catch (error) {
      console.error('클립보드 복사 오류:', error);
      addNotification('복사 중 오류가 발생했습니다.', 'error');
    }
  };

  const regenerateContent = () => {
    if (!prompt.trim()) {
      addNotification('프롬프트를 입력해주세요.', 'error');
      return;
    }
    generateCreativeContent();
  };

  const clearAll = () => {
    setPrompt('');
    setKeywords('');
    setGeneratedContent('');
    addNotification('내용이 초기화되었습니다.', 'info');
  };

  const currentGenres = genres[contentType] || [];

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2>✨ 창의적 글쓰기 도우미</h2>
        <p>AI와 함께 창의적인 아이디어와 스토리를 만들어보세요.</p>
      </div>

      <div className="tool-controls">
        <div className="control-group">
          <label htmlFor="content-type">콘텐츠 유형:</label>
          <select
            id="content-type"
            value={contentType}
            onChange={(e) => {
              setContentType(e.target.value);
              setGenre(''); // 장르 초기화
            }}
            className="select-input"
          >
            {contentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label} - {type.description}</option>
            ))}
          </select>
        </div>

        {currentGenres.length > 0 && (
          <div className="control-group">
            <label htmlFor="genre">장르/카테고리:</label>
            <select
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="select-input"
            >
              <option value="">장르 선택... (선택사항)</option>
              {currentGenres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        )}

        <div className="control-group">
          <label htmlFor="prompt">프롬프트/주제:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 시간여행을 할 수 있는 할머니 이야기, 새로운 카페 창업 아이디어, 가을에 대한 시..."
            className="text-input"
            rows="3"
          />
        </div>

        <div className="control-group">
          <label>분량:</label>
          <div className="length-options">
            {lengthOptions.map(option => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name="length"
                  value={option.value}
                  checked={length === option.value}
                  onChange={(e) => setLength(e.target.value)}
                />
                <div className="radio-content">
                  <span className="radio-label">{option.label}</span>
                  <span className="radio-description">{option.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="keywords">키워드 (선택사항):</label>
          <input
            id="keywords"    
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="예: 모험, 우정, 마법, 성장 (쉼표로 구분)"
            className="text-input"
          />
        </div>

        <div className="button-group">
          <button 
            onClick={generateCreativeContent}
            className="generate-button primary"
            disabled={!prompt.trim()}
          >
            창의적 콘텐츠 생성하기
          </button>
          <button 
            onClick={clearAll}
            className="action-button secondary"
          >
            전체 초기화
          </button>
        </div>
      </div>

      {generatedContent && (
        <div className="result-container">
          <div className="content-display">
            <h3>✨ 생성된 창의적 콘텐츠</h3>
            <div className="generated-content">
              <pre>{generatedContent}</pre>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={copyToClipboard}
              className="action-button secondary"
            >
              📋 복사하기
            </button>
            <button 
              onClick={regenerateContent}
              className="action-button primary"
            >
              🔄 다시 생성하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreativeWriter;
