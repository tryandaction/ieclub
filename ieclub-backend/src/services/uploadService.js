// // ========== services/uploadService.js ==========
// const OSS = require('ali-oss');
// const path = require('path');
// const fs = require('fs').promises;

// // 初始化OSS客户端
// const client = new OSS({
//   region: process.env.ALI_OSS_REGION,
//   accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
//   accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
//   bucket: process.env.ALI_OSS_BUCKET
// });

// /**
//  * 上传文件到阿里云OSS
//  * @param {Object} file - Multer文件对象
//  * @param {String} folder - 存储文件夹
//  * @returns {String} 文件URL
//  */
// exports.uploadToOSS = async (file, folder = 'uploads') => {
//   try {
//     const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
//     const result = await client.put(fileName, file.path);
    
//     // 删除本地临时文件
//     await fs.unlink(file.path);
    
//     return result.url;
//   } catch (error) {
//     console.error('OSS上传失败:', error);
//     throw new Error('文件上传失败');
//   }
// };

// /**
//  * 删除OSS文件
//  * @param {String} fileUrl - 文件URL
//  */
// exports.deleteFromOSS = async (fileUrl) => {
//   try {
//     const fileName = fileUrl.split('.com/')[1];
//     await client.delete(fileName);
//   } catch (error) {
//     console.error('OSS删除失败:', error);
//   }
// };

// /**
//  * 批量上传文件
//  * @param {Array} files - 文件数组
//  * @param {String} folder - 存储文件夹
//  * @returns {Array} 文件URL数组
//  */
// exports.uploadMultipleToOSS = async (files, folder = 'uploads') => {
//   return Promise.all(files.map(file => exports.uploadToOSS(file, folder)));
// };










const path = require('path');
const fs = require('fs').promises;

/**
 * 本地开发：保存到本地uploads目录
 * 生产环境：上传到阿里云OSS
 */
exports.uploadToOSS = async (file, folder = 'uploads') => {
  try {
    // 开发环境：保存到本地
    if (process.env.NODE_ENV === 'development') {
      const uploadDir = path.join(process.cwd(), 'uploads', folder);
      
      // 确保目录存在
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
      const newPath = path.join(uploadDir, fileName);
      
      // 移动文件
      await fs.rename(file.path, newPath);
      
      // 返回本地URL
      return `/uploads/${folder}/${fileName}`;
    }
    
    // 生产环境：上传到OSS（需要配置）
    const OSS = require('ali-oss');
    const client = new OSS({
      region: process.env.ALI_OSS_REGION,
      accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
      bucket: process.env.ALI_OSS_BUCKET
    });
    
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    const result = await client.put(fileName, file.path);
    await fs.unlink(file.path);
    return result.url;
  } catch (error) {
    console.error('文件上传失败:', error);
    throw new Error('文件上传失败');
  }
};

exports.deleteFromOSS = async (fileUrl) => {
  // 开发环境：删除本地文件
  if (process.env.NODE_ENV === 'development') {
    try {
      const filePath = path.join(process.cwd(), fileUrl);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('删除文件失败:', error);
    }
    return;
  }
    // 生产环境：删除OSS文件
  // ... OSS删除逻辑
};