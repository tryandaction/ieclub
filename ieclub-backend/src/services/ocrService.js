
// // ========== services/ocrService.js ==========
// const axios = require('axios');
// const FormData = require('form-data');
// const fs = require('fs');

// /**
//  * 百度OCR - 获取Access Token
//  */
// const getBaiduAccessToken = async () => {
//   try {
//     const response = await axios.get('https://aip.baidubce.com/oauth/2.0/token', {
//       params: {
//         grant_type: 'client_credentials',
//         client_id: process.env.BAIDU_OCR_API_KEY,
//         client_secret: process.env.BAIDU_OCR_SECRET_KEY
//       }
//     });
//     return response.data.access_token;
//   } catch (error) {
//     throw new Error('获取百度OCR Token失败');
//   }
// };

// /**
//  * 识别图片中的文字
//  * @param {String} imagePath - 图片路径
//  * @returns {Object} 识别结果
//  */
// exports.recognizeText = async (imagePath) => {
//   try {
//     const accessToken = await getBaiduAccessToken();
    
//     // 读取图片并转为base64
//     const imageBuffer = fs.readFileSync(imagePath);
//     const imageBase64 = imageBuffer.toString('base64');
    
//     // 调用百度OCR API
//     const response = await axios.post(
//       `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
//       `image=${encodeURIComponent(imageBase64)}`,
//       {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         }
//       }
//     );
    
//     if (response.data.words_result) {
//       const text = response.data.words_result
//         .map(item => item.words)
//         .join('\n');
      
//       return {
//         text,
//         confidence: response.data.words_result[0]?.probability || 0,
//         wordsCount: response.data.words_result_num,
//         language: 'CHN_ENG'
//       };
//     }
    
//     throw new Error('OCR识别失败');
//   } catch (error) {
//     console.error('OCR识别错误:', error);
//     throw new Error('文字识别失败');
//   }
// };

// /**
//  * 高精度OCR识别（用于PPT等场景）
//  */
// exports.recognizeAccurateText = async (imagePath) => {
//   try {
//     const accessToken = await getBaiduAccessToken();
//     const imageBuffer = fs.readFileSync(imagePath);
//     const imageBase64 = imageBuffer.toString('base64');
    
//     const response = await axios.post(
//       `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${accessToken}`,
//       `image=${encodeURIComponent(imageBase64)}`,
//       {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         }
//       }
//     );
    
//     if (response.data.words_result) {
//       const text = response.data.words_result
//         .map(item => item.words)
//         .join('\n');
      
//       return {
//         text,
//         confidence: response.data.words_result[0]?.probability || 0,
//         wordsCount: response.data.words_result_num,
//         language: 'CHN_ENG'
//       };
//     }
    
//     throw new Error('OCR识别失败');
//   } catch (error) {
//     console.error('高精度OCR错误:', error);
//     throw new Error('文字识别失败');
//   }
// };



/**
 * OCR识别（开发环境返回mock数据）
 */
exports.recognizeText = async (imagePath) => {
  // 开发环境：返回mock数据
  if (process.env.NODE_ENV === 'development' && !process.env.BAIDU_OCR_API_KEY) {
    console.log('开发环境：返回OCR mock数据');
    return {
      text: '这是模拟的OCR识别结果\n第二行文字\n第三行文字',
      confidence: 0.95,
      wordsCount: 3,
      language: 'CHN_ENG'
    };
  }
  
  // 生产环境：调用百度OCR
  // ... 原有的OCR逻辑
};