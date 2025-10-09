// ==================== src/utils/contentFilter.js ====================
/**
 * 智能内容审核系统
 */
class ContentFilter {
  constructor() {
    // 敏感词库（DFA算法用）
    this.sensitiveWords = this.loadSensitiveWords();
    this.dfaTree = this.buildDFATree();
  }

  /**
   * 加载敏感词库
   */
  loadSensitiveWords() {
    return [
      // 政治敏感
      '习近平', '毛泽东', '共产党', '民主', '人权', '六四', '法轮功',
      // 色情低俗
      '性交', '做爱', '色情', '裸体', '黄色', 'AV', '毛片', '成人',
      // 暴力血腥
      '杀人', '暴力', '血腥', '恐怖', '爆炸', '枪支', '毒品',
      // 广告推广
      '加微信', '扫码', '免费领取', '点击链接', '代理', '刷单', '招聘兼职',
      // 违法违规
      '办证', '代孕', '代考', '代写', '诈骗', '赌博', '贷款', '发票'
    ];
  }

  /**
   * 构建DFA树（确定有限状态自动机）
   */
  buildDFATree() {
    const tree = {};
    
    for (const word of this.sensitiveWords) {
      let node = tree;
      
      for (const char of word) {
        if (!node[char]) {
          node[char] = { isEnd: false };
        }
        node = node[char];
      }
      
      node.isEnd = true;
      node.word = word;
    }
    
    return tree;
  }

  /**
   * 检测敏感词（DFA算法）
   */
  detectSensitiveWords(text) {
    if (!text) return [];
    
    const found = [];
    const len = text.length;
    
    for (let i = 0; i < len; i++) {
      let node = this.dfaTree;
      let matchedWord = '';
      let j = i;
      
      while (j < len && node[text[j]]) {
        node = node[text[j]];
        matchedWord += text[j];
        j++;
        
        if (node.isEnd) {
          found.push({
            word: matchedWord,
            position: i,
            length: matchedWord.length
          });
          break;
        }
      }
    }
    
    return found;
  }

  /**
   * 替换敏感词
   */
  replaceSensitiveWords(text, replacement = '*') {
    if (!text) return '';
    
    const detected = this.detectSensitiveWords(text);
    let result = text;
    
    // 从后往前替换，避免位置偏移
    for (let i = detected.length - 1; i >= 0; i--) {
      const { position, length } = detected[i];
      const stars = replacement.repeat(length);
      result = result.substring(0, position) + stars + result.substring(position + length);
    }
    
    return result;
  }

  /**
   * 检测垃圾内容特征
   */
  detectSpam(text) {
    const spamPatterns = [
      // 联系方式
      /\d{11}/g,                    // 手机号
      /\d{3,4}-\d{7,8}/g,           // 座机号
      /qq[:：]\s*\d{5,}/gi,         // QQ号
      /微信[:：]\s*[a-z0-9_-]{5,}/gi, // 微信号
      
      // 网址
      /(https?:\/\/|www\.)[^\s]+/gi,
      
      // 特殊符号过多
      /[!！?？.。,，]{3,}/g,
      
      // 重复字符
      /(.)\1{4,}/g,
      
      // 全大写（超过10个字母）
      /[A-Z]{10,}/g
    ];
    
    const spamScore = spamPatterns.reduce((score, pattern) => {
      const matches = text.match(pattern);
      return score + (matches ? matches.length * 10 : 0);
    }, 0);
    
    return {
      isSpam: spamScore > 30,
      score: spamScore,
      reason: spamScore > 30 ? '检测到垃圾内容特征' : ''
    };
  }

  /**
   * 检测广告推广
   */
  detectAdvertisement(text) {
    const adKeywords = [
      '加微信', '扫码', '免费领取', '点击链接', '立即购买',
      '代理', '招募', '兼职', '赚钱', '优惠', '打折'
    ];
    
    const found = adKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return {
      isAd: found.length >= 2,
      keywords: found,
      reason: found.length >= 2 ? '疑似广告推广' : ''
    };
  }

  /**
   * 文本质量评分
   */
  evaluateQuality(text) {
    if (!text) return 0;
    
    let score = 50; // 基础分
    
    // 长度评分
    const length = text.length;
    if (length < 10) score -= 30;
    else if (length < 30) score -= 10;
    else if (length > 100) score += 10;
    else if (length > 500) score += 20;
    
    // 标点符号评分
    const punctuation = (text.match(/[，。！？；：""''、]/g) || []).length;
    score += Math.min(punctuation * 2, 10);
    
    // 换行评分（有段落结构）
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0).length;
    if (paragraphs > 1) score += 5;
    if (paragraphs > 3) score += 5;
    
    // 重复字符扣分
    const repeated = text.match(/(.)\1{3,}/g);
    if (repeated) score -= repeated.length * 5;
    
    // 全大写扣分
    const uppercase = text.match(/[A-Z]{5,}/g);
    if (uppercase) score -= uppercase.length * 3;
    
    // 特殊符号过多扣分
    const specialChars = (text.match(/[!！?？.。]{3,}/g) || []).length;
    score -= specialChars * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 综合审核
   */
  async review(text, options = {}) {
    const {
      checkSensitive = true,
      checkSpam = true,
      checkAd = true,
      checkQuality = true,
      aiReview = false
    } = options;
    
    const result = {
      passed: true,
      score: 100,
      reasons: [],
      suggestions: []
    };
    
    // 1. 敏感词检测
    if (checkSensitive) {
      const sensitive = this.detectSensitiveWords(text);
      if (sensitive.length > 0) {
        result.passed = false;
        result.score -= 50;
        result.reasons.push(`包含敏感词: ${sensitive.map(s => s.word).join(', ')}`);
        result.filteredText = this.replaceSensitiveWords(text);
      }
    }
    
    // 2. 垃圾内容检测
    if (checkSpam) {
      const spam = this.detectSpam(text);
      if (spam.isSpam) {
        result.passed = false;
        result.score -= 30;
        result.reasons.push(spam.reason);
      }
    }
    
    // 3. 广告检测
    if (checkAd) {
      const ad = this.detectAdvertisement(text);
      if (ad.isAd) {
        result.passed = false;
        result.score -= 40;
        result.reasons.push(ad.reason);
        result.suggestions.push('请勿发布广告推广内容');
      }
    }
    
    // 4. 质量评分
    if (checkQuality) {
      const quality = this.evaluateQuality(text);
      result.qualityScore = quality;
      
      if (quality < 30) {
        result.suggestions.push('内容质量较低，建议补充更多信息');
      }
    }
    
    // 5. AI审核（可选，调用第三方API）
    if (aiReview && process.env.BAIDU_AI_KEY) {
      try {
        const aiResult = await this.baiduContentReview(text);
        if (!aiResult.passed) {
          result.passed = false;
          result.reasons.push(...aiResult.reasons);
        }
      } catch (error) {
        console.error('AI审核失败:', error);
      }
    }
    
    return result;
  }

  /**
   * 百度AI内容审核
   */
  async baiduContentReview(text) {
    const axios = require('axios');
    
    try {
      // 获取access_token
      const tokenResponse = await axios.get(
        'https://aip.baidubce.com/oauth/2.0/token',
        {
          params: {
            grant_type: 'client_credentials',
            client_id: process.env.BAIDU_AI_KEY,
            client_secret: process.env.BAIDU_AI_SECRET
          }
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      
      // 调用文本审核API
      const response = await axios.post(
        `https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=${accessToken}`,
        `text=${encodeURIComponent(text)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const data = response.data;
      
      return {
        passed: data.conclusionType === 1,
        reasons: data.data ? data.data.map(item => item.msg) : [],
        conclusion: data.conclusion
      };
    } catch (error) {
      throw new Error('百度AI审核失败: ' + error.message);
    }
  }

  /**
   * 图片审核
   */
  async reviewImage(imageUrl) {
    const axios = require('axios');
    
    try {
      // 获取access_token
      const tokenResponse = await axios.get(
        'https://aip.baidubce.com/oauth/2.0/token',
        {
          params: {
            grant_type: 'client_credentials',
            client_id: process.env.BAIDU_AI_KEY,
            client_secret: process.env.BAIDU_AI_SECRET
          }
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      
      // 调用图片审核API
      const response = await axios.post(
        `https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined?access_token=${accessToken}`,
        `imgUrl=${encodeURIComponent(imageUrl)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const data = response.data;
      
      return {
        passed: data.conclusionType === 1,
        type: data.conclusion,
        details: data.data || []
      };
    } catch (error) {
      throw new Error('图片审核失败: ' + error.message);
    }
  }

  /**
   * 批量审核
   */
  async reviewBatch(items, options = {}) {
    const results = [];
    
    for (const item of items) {
      const result = await this.review(item, options);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 添加自定义敏感词
   */
  addSensitiveWords(words) {
    if (Array.isArray(words)) {
      this.sensitiveWords.push(...words);
    } else {
      this.sensitiveWords.push(words);
    }
    
    // 重建DFA树
    this.dfaTree = this.buildDFATree();
  }

  /**
   * 移除敏感词
   */
  removeSensitiveWords(words) {
    const wordsToRemove = Array.isArray(words) ? words : [words];
    this.sensitiveWords = this.sensitiveWords.filter(
      word => !wordsToRemove.includes(word)
    );
    
    // 重建DFA树
    this.dfaTree = this.buildDFATree();
  }

  /**
   * 获取审核统计
   */
  getStatistics() {
    return {
      totalWords: this.sensitiveWords.length,
      categories: {
        political: 0,
        pornographic: 0,
        violent: 0,
        advertisement: 0,
        illegal: 0
      }
    };
  }
}

module.exports = new ContentFilter();