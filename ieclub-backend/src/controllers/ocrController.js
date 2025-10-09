
// ========== controllers/ocrController.js ==========
const { OCRRecord } = require('../models');
const { recognizeText, recognizeAccurateText } = require('../services/ocrService');
const fs = require('fs').promises;

exports.recognizeText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传图片' });
    }

    const { accurate = false } = req.body;

    // 选择识别方式
    const result = accurate 
      ? await recognizeAccurateText(req.file.path)
      : await recognizeText(req.file.path);

    // 保存识别记录
    const record = await OCRRecord.create({
      userId: req.user.id,
      imagePath: req.file.path,
      recognizedText: result.text,
      confidence: result.confidence,
      language: result.language
    });

    // 删除临时文件（可选，如果不需要保存原图）
    // await fs.unlink(req.file.path);

    res.json({
      message: '识别成功',
      text: result.text,
      confidence: result.confidence,
      wordsCount: result.wordsCount,
      recordId: record.id
    });
  } catch (error) {
    res.status(500).json({ message: 'OCR识别失败', error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const records = await OCRRecord.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['imagePath'] } // 不返回图片路径
    });

    res.json({
      records: records.rows,
      total: records.count,
      page: parseInt(page),
      totalPages: Math.ceil(records.count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: '获取历史记录失败', error: error.message });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    const record = await OCRRecord.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: '记录不存在' });
    }

    if (record.userId !== req.user.id) {
      return res.status(403).json({ message: '无权限删除此记录' });
    }

    // 删除图片文件
    try {
      await fs.unlink(record.imagePath);
    } catch (err) {
      console.error('删除图片文件失败:', err);
    }

    await record.destroy();

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
};