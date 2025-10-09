
// ============= Bookmark.js =============
// backend/src/models/Bookmark.js
module.exports = (sequelize, DataTypes) => {
  const Bookmark = sequelize.define('Bookmark', {
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
    targetType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'target_type',
      validate: {
        isIn: [['post', 'event']]
      }
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'target_id'
    }
  }, {
    tableName: 'bookmarks',
    indexes: [
      { unique: true, fields: ['user_id', 'target_type', 'target_id'] }
    ],
    timestamps: true,
    updatedAt: false
  });

  Bookmark.associate = (models) => {
    Bookmark.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Bookmark;
};