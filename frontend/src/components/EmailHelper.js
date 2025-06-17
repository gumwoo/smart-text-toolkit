import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

const EmailHelper = ({ setIsLoading, addNotification }) => {
  const [emailType, setEmailType] = useState('business');
  const [recipient, setRecipient] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('formal');
  const [keyPoints, setKeyPoints] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');

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

  const emailTypes = [
    { value: 'business', label: '비즈니스', description: '업무 관련 이메일' },
    { value: 'inquiry', label: '문의', description: '정보 요청 및 질문' },
    { value: 'complaint', label: '불만/항의', description: '문제 제기 및 개선 요청' },
    { value: 'apology', label: '사과', description: '실수에 대한 사과' },
    { value: 'invitation', label: '초대', description: '행사나 미팅 초대' },
    { value: 'thank', label: '감사', description: '감사 인사' },
    { value: 'follow-up', label: '후속 조치', description: '이전 대화 후속' }
  ];

  const toneOptions = [
    { value: 'formal', label: '공식적', description: '격식 있는 언어' },
    { value: 'friendly', label: '친근한', description: '따뜻하고 친밀한 톤' },
    { value: 'professional', label: '전문적', description: '비즈니스 전문가다운' },
    { value: 'casual', label: '캐주얼', description: '편안하고 자연스러운' }
  ];

  const generateEmail = async () => {
    console.log('이메일 생성 시작:', { emailType, recipient, purpose, tone });
    
    if (!recipient.trim() || !purpose.trim()) {
      addNotification('받는 사람과 목적을 입력해주세요.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.GENERATE_EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: emailType,
          recipient: recipient.trim(),
          purpose: purpose.trim(),
          tone: tone,
          keyPoints: keyPoints.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('이메일 생성 실패');
      }

      const data = await response.json();
      const cleanEmail = removeMarkdown(data.email);
      setGeneratedEmail(cleanEmail);
      addNotification('이메일이 생성되었습니다!', 'success');
      console.log('이메일 생성 완료');
      
    } catch (error) {
      console.error('이메일 생성 오류:', error);
      addNotification('이메일 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedEmail) {
      addNotification('복사할 이메일이 없습니다.', 'error');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(generatedEmail);
      addNotification('이메일이 클립보드에 복사되었습니다!', 'success');
      console.log('클립보드 복사 완료');
    } catch (error) {
      console.error('클립보드 복사 오류:', error);
      addNotification('복사 중 오류가 발생했습니다.', 'error');
    }
  };

  const clearAll = () => {
    setRecipient('');
    setPurpose('');
    setKeyPoints('');
    setGeneratedEmail('');
    addNotification('내용이 초기화되었습니다.', 'info');
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2>📧 이메일 작성 도우미</h2>
        <p>상황과 목적에 맞는 이메일을 AI가 작성해드립니다.</p>
      </div>

      <div className="tool-controls">
        <div className="control-group">
          <label htmlFor="email-type">이메일 유형:</label>
          <select
            id="email-type"
            value={emailType}
            onChange={(e) => setEmailType(e.target.value)}
            className="select-input"
          >
            {emailTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label} - {type.description}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="recipient">받는 사람 (이름/직책):</label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="예: 김대리님, 고객센터, 홍길동 팀장님"
            className="text-input"
          />
        </div>

        <div className="control-group">
          <label htmlFor="purpose">이메일 목적:</label>
          <input
            id="purpose"
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="예: 회의 일정 조율, 제품 문의, 프로젝트 진행 상황 공유"
            className="text-input"
          />
        </div>

        <div className="control-group">
          <label>어조:</label>
          <div className="tone-options">
            {toneOptions.map(option => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name="tone"
                  value={option.value}
                  checked={tone === option.value}
                  onChange={(e) => setTone(e.target.value)}
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
          <label htmlFor="key-points">포함할 주요 내용 (선택사항):</label>
          <textarea
            id="key-points"
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            placeholder="예: 내일 오후 2시 회의실 A에서, 첨부파일 참고, 회신 기한은 금요일까지"
            className="text-input"
            rows="3"
          />
        </div>

        <div className="button-group">
          <button 
            onClick={generateEmail}
            className="generate-button primary"
            disabled={!recipient.trim() || !purpose.trim()}
          >
            이메일 생성하기
          </button>
          <button 
            onClick={clearAll}
            className="action-button secondary"
          >
            전체 초기화
          </button>
        </div>
      </div>

      {generatedEmail && (
        <div className="result-container">
          <div className="email-display">
            <h3>📧 생성된 이메일</h3>
            <div className="generated-email">
              <pre>{generatedEmail}</pre>
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

export default EmailHelper;
