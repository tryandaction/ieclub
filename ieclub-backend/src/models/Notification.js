
// ============= Notification.js =============
// backend/src/models/Notification.js
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['like', 'comment', 'follow', 'event', 'system']]
      }
    },
    title: {
      type: DataTypes.STRING(255)
    },
    content: {
      type: DataTypes.TEXT
    },
    relatedId: {
      type: DataTypes.INTEGER,
      field: 'related_id'
    },
    relatedType: {
      type: DataTypes.STRING(50),
      field: 'related_type'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    }
  }, {
    tableName: 'notifications',
    indexes: [
      { fields: ['user_id', 'is_read'] }
    ],
    timestamps: true,
    updatedAt: false
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Notification;
};