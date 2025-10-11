// ========== services/ocrService.js ==========
const axios = require('axios');
const fs = require('fs').promises;

/**
 * 百度OCR - 获取Access Token
 */
const getBaiduAccessToken = async () => {
  try {
    const response = await axios.post('https://aip.baidubce.com/oauth/2.0/token', null, {
      params: {
        grant_type: 'client_credentials',
        client_id: process.env.BAIDU_OCR_API_KEY,
        client_secret: process.env.BAIDU_OCR_SECRET_KEY
      }
    });
    return response.data.access_token;
  } catch (error) {
    throw new Error('获取百度OCR Token失败: ' + error.message);
  }
};

/**
 * 识别图片中的文字 - 百度OCR实现
 * @param {String} imagePath - 图片文件路径或base64数据
 * @param {Boolean} isBase64 - 是否为base64数据
 * @returns {Object} 识别结果
 */
exports.recognizeText = async (imagePath, isBase64 = false) => {
  try {
    // 检查百度OCR配置
    if (!process.env.BAIDU_OCR_API_KEY || !process.env.BAIDU_OCR_SECRET_KEY) {
      console.warn('百度OCR未配置，使用模拟数据');
      return {
        text: '这是模拟的OCR识别结果\n请配置百度OCR API密钥以使用真实识别功能',
        confidence: 0.85,
        wordsCount: 2,
        language: 'CHN_ENG'
      };
    }

    const accessToken = await getBaiduAccessToken();

    let imageBase64;

    if (isBase64) {
      // 如果是base64数据，直接使用
      imageBase64 = imagePath;
    } else {
      // 如果是文件路径，读取文件并转为base64
      const imageBuffer = await fs.readFile(imagePath);
      imageBase64 = imageBuffer.toString('base64');
    }

    // 调用百度OCR API - 通用文字识别
    const response = await axios.post(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
      `image=${encodeURIComponent(imageBase64)}&detect_direction=true&probability=true`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data.words_result && response.data.words_result.length > 0) {
      const text = response.data.words_result
        .map(item => item.words)
        .join('\n');

      return {
        text,
        confidence: response.data.words_result[0]?.probability?.average || 0.8,
        wordsCount: response.data.words_result_num || response.data.words_result.length,
        language: 'CHN_ENG'
      };
    }

    return {
      text: '未识别到文字',
      confidence: 0,
      wordsCount: 0,
      language: 'CHN_ENG'
    };
  } catch (error) {
    console.error('OCR识别错误:', error);
    throw new Error('文字识别失败: ' + error.message);
  }
};

/**
 * 高精度OCR识别（用于PPT等场景）
 * @param {String} imagePath - 图片文件路径或base64数据
 * @param {Boolean} isBase64 - 是否为base64数据
 */
exports.recognizeAccurateText = async (imagePath, isBase64 = false) => {
  try {
    // 检查百度OCR配置
    if (!process.env.BAIDU_OCR_API_KEY || !process.env.BAIDU_OCR_SECRET_KEY) {
      console.warn('百度OCR未配置，使用模拟数据');
      return {
        text: '这是高精度模拟识别结果\n请配置百度OCR API密钥以使用真实识别功能',
        confidence: 0.95,
        wordsCount: 2,
        language: 'CHN_ENG'
      };
    }

    const accessToken = await getBaiduAccessToken();

    let imageBase64;

    if (isBase64) {
      imageBase64 = imagePath;
    } else {
      const imageBuffer = await fs.readFile(imagePath);
      imageBase64 = imageBuffer.toString('base64');
    }

    // 调用百度OCR API - 高精度文字识别
    const response = await axios.post(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${accessToken}`,
      `image=${encodeURIComponent(imageBase64)}&detect_direction=true&probability=true`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data.words_result && response.data.words_result.length > 0) {
      const text = response.data.words_result
        .map(item => item.words)
        .join('\n');

      return {
        text,
        confidence: response.data.words_result[0]?.probability?.average || 0.9,
        wordsCount: response.data.words_result_num || response.data.words_result.length,
        language: 'CHN_ENG'
      };
    }

    return {
      text: '未识别到文字',
      confidence: 0,
      wordsCount: 0,
      language: 'CHN_ENG'
    };
  } catch (error) {
    console.error('高精度OCR错误:', error);
    throw new Error('高精度文字识别失败: ' + error.message);
  }
};