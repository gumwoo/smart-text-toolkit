const dotenv = require('dotenv');
const ApiKeyManager = require('./utils/apiKeyManager');
const fs = require('fs');
const path = require('path');

// 환경변수 로드
dotenv.config();

/**
 * API 키 진단 및 수정 스크립트
 */
async function diagnoseApiKey() {
  console.log('🔍 API 키 진단을 시작합니다...\n');
  
  const keyManager = new ApiKeyManager();
  const logPath = path.join(__dirname, 'logs', 'api-diagnosis.log');
  
  // 로그 함수
  const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(logPath, logMessage + '\n');
  };

  try {
    // 1. 현재 환경변수에서 키 확인
    log('1. 환경변수에서 API 키 확인 중...');
    const rawApiKey = process.env.OPENAI_API_KEY;
    
    if (!rawApiKey) {
      log('❌ OPENAI_API_KEY가 설정되지 않았습니다.');
      return;
    }
    
    log(`원본 키 길이: ${rawApiKey.length}`);
    log(`키 시작 부분: ${rawApiKey.substring(0, 10)}...`);
    log(`Base64 형식 여부: ${keyManager.isBase64(rawApiKey)}`);
    
    // 2. 다양한 형식으로 키 테스트
    log('\n2. 다양한 키 형식으로 검증 시도...');
    const testResult = await keyManager.tryDifferentKeyFormats(rawApiKey);
    
    if (testResult.success) {
      log('✅ 유효한 API 키를 찾았습니다!');
      log(`작동하는 키: ${testResult.workingKey.substring(0, 10)}...`);
      log(`모델: ${testResult.validation.model}`);
      log(`사용량: ${JSON.stringify(testResult.validation.usage)}`);
      
      // 작동하는 키로 환경변수 업데이트
      if (testResult.workingKey !== rawApiKey) {
        log('\n3. 환경변수 업데이트 중...');
        const updateResult = keyManager.saveEncodedApiKey(testResult.workingKey);
        if (updateResult.success) {
          log('✅ 환경변수가 업데이트되었습니다.');
        } else {
          log(`❌ 환경변수 업데이트 실패: ${updateResult.error}`);
        }
      }
      
    } else {
      log('❌ 유효한 API 키를 찾을 수 없습니다.');
      log(`테스트한 형식 수: ${testResult.testedFormats}`);
      log(`마지막 오류: ${testResult.lastError}`);
      
      // 새로운 키 입력 안내
      log('\n📝 새로운 API 키가 필요합니다.');
      log('다음 단계를 따라주세요:');
      log('1. OpenAI 웹사이트에서 새 API 키 생성');
      log('2. .env 파일의 OPENAI_API_KEY 값 교체');
      log('3. 이 스크립트 다시 실행');
    }
    
    // 4. 추가 진단 정보
    log('\n4. 추가 진단 정보:');
    log(`Node.js 버전: ${process.version}`);
    log(`현재 작업 디렉토리: ${process.cwd()}`);
    log(`환경: ${process.env.NODE_ENV || 'development'}`);
    
    // 5. 서버 연결 테스트
    log('\n5. 서버 연결 테스트...');
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        const data = await response.json();
        log(`✅ 서버 연결 성공: ${JSON.stringify(data)}`);
      } else {
        log(`❌ 서버 응답 오류: ${response.status}`);
      }
    } catch (error) {
      log(`❌ 서버 연결 실패: ${error.message}`);
      log('서버를 먼저 시작해주세요: npm run dev');
    }
    
  } catch (error) {
    log(`❌ 진단 중 오류 발생: ${error.message}`);
    log(`스택 트레이스: ${error.stack}`);
  }
  
  log('\n🔍 API 키 진단이 완료되었습니다.');
  log(`상세 로그는 다음 파일에서 확인하세요: ${logPath}`);
}

/**
 * 새로운 API 키 설정
 */
async function setNewApiKey(newKey) {
  console.log('🔑 새로운 API 키를 설정합니다...\n');
  
  const keyManager = new ApiKeyManager();
  
  try {
    // 키 검증
    console.log('키 유효성 검증 중...');
    const validation = await keyManager.validateOpenAIKey(newKey);
    
    if (!validation.valid) {
      console.log(`❌ 유효하지 않은 API 키입니다: ${validation.error}`);
      return false;
    }
    
    console.log('✅ 유효한 API 키입니다!');
    console.log(`모델: ${validation.model}`);
    
    // 키 저장 (Base64 인코딩)
    const saveResult = keyManager.saveEncodedApiKey(newKey);
    
    if (saveResult.success) {
      console.log('✅ API 키가 성공적으로 저장되었습니다.');
      console.log('서버를 재시작해주세요.');
      return true;
    } else {
      console.log(`❌ 키 저장 실패: ${saveResult.error}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ 오류 발생: ${error.message}`);
    return false;
  }
}

// 명령행 인수 처리
const args = process.argv.slice(2);
const command = args[0];

if (command === 'set' && args[1]) {
  // 새 키 설정: node diagnose-api.js set sk-your-new-key
  setNewApiKey(args[1]);
} else if (command === 'diagnose' || !command) {
  // 진단 실행: node diagnose-api.js 또는 node diagnose-api.js diagnose
  diagnoseApiKey();
} else {
  console.log('사용법:');
  console.log('  node diagnose-api.js                    # API 키 진단');
  console.log('  node diagnose-api.js diagnose           # API 키 진단');
  console.log('  node diagnose-api.js set YOUR_API_KEY   # 새 API 키 설정');
}
