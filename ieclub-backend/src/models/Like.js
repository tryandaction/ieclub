// ============= Like.js =============
// backend/src/models/Like.js
module.exports = (sequelize, DataTypes) => {
  const Like = sequelize.define('Like', {
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
        isIn: [['post', 'comment']]
      }
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'target_id'
    }
  }, {
    tableName: 'likes',
    indexes: [
      { unique: true, fields: ['user_id', 'target_type', 'target_id'] },
      { fields: ['target_type', 'target_id'] }
    ],
    timestamps: true,
    updatedAt: false
  });

  Like.associate = (models) => {
    Like.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Like;
};