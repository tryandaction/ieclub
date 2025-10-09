
// ============= OCRRecord.js =============
// backend/src/models/OCRRecord.js
module.exports = (sequelize, DataTypes) => {
  const OCRRecord = sequelize.define('OCRRecord', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    originalImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'original_image_url'
    },
    ocrText: {
      type: DataTypes.TEXT,
      field: 'ocr_text'
    },
    editedText: {
      type: DataTypes.TEXT,
      field: 'edited_text'
    },
    confidenceScore: {
      type: DataTypes.DECIMAL(3, 2),
      field: 'confidence_score'
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'zh'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'processing',
      validate: {
        isIn: [['processing', 'completed', 'failed']]
      }
    },
    relatedEventId: {
      type: DataTypes.INTEGER,
      field: 'related_event_id'
    },
    processedAt: {
      type: DataTypes.DATE,
      field: 'processed_at'
    }
  }, {
    tableName: 'ocr_records',
    timestamps: true,
    updatedAt: false
  });

  OCRRecord.associate = (models) => {
    OCRRecord.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    OCRRecord.belongsTo(models.Event, { foreignKey: 'relatedEventId', as: 'relatedEvent' });
  };

  return OCRRecord;
};