const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * API 키 관리 유틸리티
 * - 키 검증, 인코딩/디코딩, 보안 관리
 */
class ApiKeyManager {
  constructor() {
    this.secretKey = process.env.SECRET_KEY || 'default-secret-key-2025';
    this.algorithm = 'aes-256-cbc';
  }

  /**
   * 문자열을 Base64로 인코딩
   */
  encodeBase64(text) {
    try {
      return Buffer.from(text, 'utf8').toString('base64');
    } catch (error) {
      console.error('Base64 인코딩 오류:', error.message);
      return null;
    }
  }

  /**
   * Base64 문자열을 디코딩
   */
  decodeBase64(encodedText) {
    try {
      return Buffer.from(encodedText, 'base64').toString('utf8');
    } catch (error) {
      console.error('Base64 디코딩 오류:', error.message);
      return null;
    }
  }

  /**
   * AES 암호화
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.secretKey);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
      };
    } catch (error) {
      console.error('암호화 오류:', error.message);
      return null;
    }
  }

  /**
   * AES 복호화
   */
  decrypt(encryptedData, iv) {
    try {
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('복호화 오류:', error.message);
      return null;
    }
  }

  /**
   * OpenAI API 키 검증
   */
  async validateOpenAIKey(apiKey) {
    try {
      const OpenAI = require('openai');
      const client = new OpenAI({
        apiKey: apiKey
      });

      // 간단한 API 호출로 키 유효성 검증
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 5
      });

      return {
        valid: true,
        model: response.model,
        usage: response.usage
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        code: error.code || 'UNKNOWN'
      };
    }
  }

  /**
   * 환경변수에서 API 키 안전하게 로드
   */
  loadApiKey() {
    const rawKey = process.env.OPENAI_API_KEY;
    
    if (!rawKey) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }

    // Base64로 인코딩된 키라면 디코딩 시도
    if (this.isBase64(rawKey)) {
      const decodedKey = this.decodeBase64(rawKey);
      if (decodedKey && decodedKey.startsWith('sk-')) {
        return decodedKey;
      }
    }

    // 일반 키 형태라면 그대로 반환
    if (rawKey.startsWith('sk-')) {
      return rawKey;
    }

    throw new Error('올바르지 않은 API 키 형식입니다.');
  }

  /**
   * 문자열이 Base64 형식인지 확인
   */
  isBase64(str) {
    try {
      return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (error) {
      return false;
    }
  }

  /**
   * API 키를 안전하게 저장 (Base64 인코딩)
   */
  saveEncodedApiKey(apiKey) {
    try {
      const encodedKey = this.encodeBase64(apiKey);
      const envPath = path.join(__dirname, '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // 기존 키 교체
      envContent = envContent.replace(
        /OPENAI_API_KEY=.*/,
        `OPENAI_API_KEY=${encodedKey}`
      );
      
      // 백업 생성
      fs.writeFileSync(envPath + '.backup', envContent);
      fs.writeFileSync(envPath, envContent);
      
      return {
        success: true,
        encoded: encodedKey
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 다양한 방식으로 API 키 시도
   */
  async tryDifferentKeyFormats(baseKey) {
    const formats = [
      baseKey,                                    // 원본
      this.encodeBase64(baseKey),                // Base64 인코딩
      this.decodeBase64(baseKey),                // Base64 디코딩
      baseKey.trim(),                            // 공백 제거
      baseKey.replace(/\s/g, ''),               // 모든 공백 제거
    ];

    for (const format of formats) {
      if (!format || !format.startsWith('sk-')) continue;
      
      console.log(`API 키 형식 시도 중: ${format.substring(0, 10)}...`);
      const result = await this.validateOpenAIKey(format);
      
      if (result.valid) {
        return {
          success: true,
          workingKey: format,
          original: baseKey,
          validation: result
        };
      }
    }

    return {
      success: false,
      testedFormats: formats.length,
      lastError: '모든 키 형식 시도 실패'
    };
  }
}

module.exports = ApiKeyManager;
