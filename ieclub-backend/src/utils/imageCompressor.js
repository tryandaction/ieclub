
// ==================== src/utils/imageCompressor.js ====================
// 图片压缩工具（需要安装 sharp: npm install sharp）

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageCompressor {
  /**
   * 压缩图片
   * @param {String} inputPath - 输入文件路径
   * @param {String} outputPath - 输出文件路径
   * @param {Object} options - 压缩选项
   */
  async compress(inputPath, outputPath, options = {}) {
    const {
      width = 1200,
      height = 1200,
      quality = 80,
      format = 'jpeg'
    } = options;

    try {
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat(format, { quality })
        .toFile(outputPath);

      // 删除原文件
      await fs.unlink(inputPath);
      
      return outputPath;
    } catch (error) {
      console.error('图片压缩失败:', error);
      throw error;
    }
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(inputPath, outputPath, size = 200) {
    await sharp(inputPath)
      .resize(size, size, { fit: 'cover' })
      .toFile(outputPath);
    
    return outputPath;
  }

  /**
   * 批量压缩
   */
  async compressBatch(files, outputDir, options = {}) {
    const results = [];
    
    for (const file of files) {
      const outputPath = path.join(
        outputDir,
        `compressed_${path.basename(file)}`
      );
      
      const compressed = await this.compress(file, outputPath, options);
      results.push(compressed);
    }
    
    return results;
  }
}

module.exports = new ImageCompressor();

// 使用方法（在uploadService.js中）：
// const imageCompressor = require('../utils/imageCompressor');
// 
// if (file.mimetype.startsWith('image/')) {
//   const compressedPath = await imageCompressor.compress(
//     file.path,
//     file.path.replace(/\.\w+$/, '_compressed.jpg')
//   );
// }