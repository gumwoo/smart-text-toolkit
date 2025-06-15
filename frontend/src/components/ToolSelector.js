import React from 'react';

const ToolSelector = ({ activeTool, onToolChange }) => {
  const tools = [
    { id: 'quote', name: '명언 생성기', icon: '💬', description: '영감을 주는 명언 생성' },
    { id: 'summarizer', name: '텍스트 요약기', icon: '📝', description: '긴 텍스트를 간단히 요약' },
    { id: 'email', name: '이메일 도우미', icon: '📧', description: '상황별 이메일 작성 도움' },
    { id: 'creative', name: '창적 글쓰기', icon: '✨', description: '창의적 아이디어와 스토리 생성' },
    { id: 'weather', name: '스마트 날씨', icon: '🌤️', description: '실시간 날씨 & AI 코디네이터' }
  ];

  return (
    <nav className="tool-selector">
      <div className="container">
        <div className="tool-tabs">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`tool-tab ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => onToolChange(tool.id)}
              title={tool.description}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-name">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default ToolSelector;
