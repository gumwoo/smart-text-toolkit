// 기상청 API 키 직접 테스트
const axios = require('axios');

// 현재 사용 중인 키들
const API_KEYS = {
  encoded: 'Lmc1Zq9hmKIACiZKiXehoeHi1ac4HG25EqROFy%2F%2FOkLBLhn5EWFL0X38pRF%2BFWvlRuRHJx7N79cf7zcsRUz%2BNA%3D%3D',
  decoded: 'Lmc1Zq9hmKIACiZKiXehoeHi1ac4HG25EqROFy//OkLBLhn5EWFL0X38pRF+FWvlRuRHJx7N79cf7zcsRUz+NA=='
};

// 현재 날짜/시간 
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hour = String(now.getHours()).padStart(2, '0');

const baseDate = `${year}${month}${day}`;
const baseTime = `${hour}00`;

console.log(`🗓️ 테스트 날짜: ${baseDate}`);
console.log(`⏰ 테스트 시간: ${baseTime}`);

async function testAPIKey(keyType, serviceKey) {
  console.log(`\n🔑 [${keyType.toUpperCase()} 키] 테스트 시작`);
  console.log(`📝 키 길이: ${serviceKey.length}`);
  console.log(`📝 키 시작: ${serviceKey.substring(0, 20)}...`);
  
  const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
  
  const params = {
    serviceKey: serviceKey,
    numOfRows: '10',
    pageNo: '1',
    dataType: 'JSON',
    base_date: baseDate,
    base_time: baseTime,
    nx: '60',
    ny: '127'
  };
  
  try {
    console.log(`📡 요청 URL: ${url}`);
    console.log(`📋 파라미터:`, { ...params, serviceKey: serviceKey.substring(0, 20) + '...' });
    
    const response = await axios.get(url, {
      params: params,
      timeout: 10000,
      headers: {
        'User-Agent': 'WeatherApp/1.0',
        'Accept': 'application/json'
      }
    });
    
    console.log(`✅ HTTP 상태: ${response.status}`);
    console.log(`📦 응답 타입: ${typeof response.data}`);
    console.log(`📄 Content-Type: ${response.headers['content-type']}`);
    
    // XML 응답 체크
    if (typeof response.data === 'string' && response.data.startsWith('<')) {
      console.log(`❌ XML 오류 응답 감지`);
      console.log(`📄 XML 미리보기:`, response.data.substring(0, 300));
      
      // 에러 메시지 추출
      const errorMatch = response.data.match(/<cmmMsgHeader>(.*?)<\/cmmMsgHeader>/);
      const returnAuthMsg = response.data.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/);
      const returnReasonCode = response.data.match(/<returnReasonCode>(.*?)<\/returnReasonCode>/);
      
      if (returnAuthMsg) console.log(`🚫 인증메시지: ${returnAuthMsg[1]}`);
      if (returnReasonCode) console.log(`🚫 에러코드: ${returnReasonCode[1]}`);
      if (errorMatch) console.log(`🚫 헤더메시지: ${errorMatch[1]}`);
      
      return false;
    }
    
    // JSON 응답 체크
    if (response.data && response.data.response) {
      const header = response.data.response.header;
      console.log(`📊 API 결과코드: ${header.resultCode}`);
      console.log(`📊 API 결과메시지: ${header.resultMsg}`);
      
      if (header.resultCode === '00') {
        console.log(`🎉 ${keyType.toUpperCase()} 키 인증 성공!`);
        
        const items = response.data.response.body?.items?.item;
        if (items) {
          const itemCount = Array.isArray(items) ? items.length : 1;
          console.log(`📈 데이터 항목 수: ${itemCount}`);
          
          if (Array.isArray(items) && items.length > 0) {
            console.log(`🌡️ 샘플 데이터: ${items[0].category} = ${items[0].obsrValue}`);
          }
        }
        return true;
      } else {
        console.log(`❌ API 오류: ${header.resultCode} - ${header.resultMsg}`);
        return false;
      }
    } else {
      console.log(`❌ 잘못된 응답 구조`);
      console.log(`📦 응답 데이터:`, JSON.stringify(response.data, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log(`❌ 요청 실패: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 HTTP 상태: ${error.response.status}`);
      console.log(`📄 응답 데이터:`, error.response.data);
    } else if (error.request) {
      console.log(`📡 네트워크 오류: 서버 응답 없음`);
    } else {
      console.log(`⚙️ 설정 오류: ${error.message}`);
    }
    return false;
  }
}

async function runTest() {
  console.log('🚀 기상청 API 키 유효성 검사 시작\n');
  
  let successCount = 0;
  
  for (const [keyType, serviceKey] of Object.entries(API_KEYS)) {
    const isValid = await testAPIKey(keyType, serviceKey);
    if (isValid) successCount++;
    
    // 다음 테스트 전 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 === 테스트 결과 요약 ===');
  console.log(`✅ 성공한 키: ${successCount}/${Object.keys(API_KEYS).length}`);
  
  if (successCount === 0) {
    console.log('🚨 모든 API 키가 실패했습니다!');
    console.log('💡 가능한 원인:');
    console.log('   1. API 키 만료 (2년마다 갱신 필요)');
    console.log('   2. API 키 오타 또는 잘못된 형식');
    console.log('   3. 기상청 API 서버 장애');
    console.log('   4. 요청 파라미터 오류');
    console.log('\n🔧 해결방법:');
    console.log('   1. 공공데이터포털(data.go.kr) 로그인');
    console.log('   2. 마이페이지 > 오픈API > 기상청 단기예보 확인');
    console.log('   3. 새로운 서비스키 발급 또는 갱신');
  } else if (successCount < Object.keys(API_KEYS).length) {
    console.log('⚠️ 일부 키만 작동합니다.');
    console.log('💡 작동하는 키를 우선적으로 사용하도록 설정 확인');
  } else {
    console.log('🎉 모든 API 키가 정상 작동합니다!');
  }
}

// 테스트 실행
runTest().catch(console.error);
