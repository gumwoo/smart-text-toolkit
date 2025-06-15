// 기상청 API 테스트 스크립트
console.log('=== 기상청 단기예보 API 테스트 ===');

const API_KEY = 'Lmc1Zq9hmKIACiZKiXehoeHi1ac4HG25EqROFy%2F%2FOkLBLhn5EWFL0X38pRF%2BFWvlRuRHJx7N79cf7zcsRUz%2BNA%3D%3D';
const BASE_URL = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

// 현재 날짜/시간 생성
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hour = String(now.getHours()).padStart(2, '0');

const baseDate = `${year}${month}${day}`;
const baseTime = `${hour}00`;

console.log(`테스트 날짜: ${baseDate}`);
console.log(`테스트 시간: ${baseTime}`);

// 서울 종로구 좌표
const nx = 60;
const ny = 127;

// 1. 초단기실황조회 테스트
async function testCurrentWeather() {
  console.log('\n=== 초단기실황조회 테스트 ===');
  
  const url = `${BASE_URL}/getUltraSrtNcst?serviceKey=${API_KEY}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
  
  console.log('요청 URL:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('응답 상태:', response.status);
    console.log('응답 데이터:', JSON.stringify(data, null, 2));
    
    if (data.response?.header?.resultCode === '00') {
      console.log('✅ 초단기실황 조회 성공');
      if (data.response.body?.items?.item) {
        const items = Array.isArray(data.response.body.items.item) 
          ? data.response.body.items.item 
          : [data.response.body.items.item];
        
        console.log(`📊 데이터 항목 수: ${items.length}`);
        items.forEach(item => {
          console.log(`- ${item.category}: ${item.obsrValue}`);
        });
      }
    } else {
      console.log('❌ API 에러:', data.response?.header?.resultMsg);
    }
  } catch (error) {
    console.error('❌ 네트워크 에러:', error.message);
  }
}

// 2. 초단기예보조회 테스트
async function testShortForecast() {
  console.log('\n=== 초단기예보조회 테스트 ===');
  
  // 초단기예보는 30분 단위
  const forecastTime = baseTime.substring(0, 2) + '30';
  
  const url = `${BASE_URL}/getUltraSrtFcst?serviceKey=${API_KEY}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${forecastTime}&nx=${nx}&ny=${ny}`;
  
  console.log('요청 URL:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('응답 상태:', response.status);
    
    if (data.response?.header?.resultCode === '00') {
      console.log('✅ 초단기예보 조회 성공');
      if (data.response.body?.items?.item) {
        const items = Array.isArray(data.response.body.items.item) 
          ? data.response.body.items.item 
          : [data.response.body.items.item];
        
        console.log(`📊 데이터 항목 수: ${items.length}`);
        console.log('샘플 데이터:');
        items.slice(0, 5).forEach(item => {
          console.log(`- ${item.category}: ${item.fcstValue} (${item.fcstDate} ${item.fcstTime})`);
        });
      }
    } else {
      console.log('❌ API 에러:', data.response?.header?.resultMsg);
    }
  } catch (error) {
    console.error('❌ 네트워크 에러:', error.message);
  }
}

// 3. 단기예보조회 테스트
async function testLongForecast() {
  console.log('\n=== 단기예보조회 테스트 ===');
  
  // 단기예보 발표시간 계산
  const forecastTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
  const currentHour = parseInt(hour);
  
  let forecastTime = '0200'; // 기본값
  
  if (currentHour >= 23 || currentHour < 2) forecastTime = '2300';
  else if (currentHour >= 20) forecastTime = '2000';
  else if (currentHour >= 17) forecastTime = '1700';
  else if (currentHour >= 14) forecastTime = '1400';
  else if (currentHour >= 11) forecastTime = '1100';
  else if (currentHour >= 8) forecastTime = '0800';
  else if (currentHour >= 5) forecastTime = '0500';
  
  const url = `${BASE_URL}/getVilageFcst?serviceKey=${API_KEY}&numOfRows=50&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${forecastTime}&nx=${nx}&ny=${ny}`;
  
  console.log('요청 URL:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('응답 상태:', response.status);
    
    if (data.response?.header?.resultCode === '00') {
      console.log('✅ 단기예보 조회 성공');
      if (data.response.body?.items?.item) {
        const items = Array.isArray(data.response.body.items.item) 
          ? data.response.body.items.item 
          : [data.response.body.items.item];
        
        console.log(`📊 데이터 항목 수: ${items.length}`);
        console.log('샘플 데이터:');
        items.slice(0, 10).forEach(item => {
          console.log(`- ${item.category}: ${item.fcstValue} (${item.fcstDate} ${item.fcstTime})`);
        });
      }
    } else {
      console.log('❌ API 에러:', data.response?.header?.resultMsg);
    }
  } catch (error) {
    console.error('❌ 네트워크 에러:', error.message);
  }
}

// 순차적으로 테스트 실행
async function runTests() {
  console.log('🚀 기상청 API 테스트 시작\n');
  
  await testCurrentWeather();
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
  
  await testShortForecast();
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
  
  await testLongForecast();
  
  console.log('\n✨ 모든 테스트 완료');
}

// 테스트 실행
if (typeof window !== 'undefined') {
  // 브라우저 환경
  window.runWeatherAPITest = runTests;
  console.log('브라우저 콘솔에서 runWeatherAPITest() 함수를 실행하세요.');
} else if (typeof global !== 'undefined') {
  // Node.js 환경
  runTests();
}
