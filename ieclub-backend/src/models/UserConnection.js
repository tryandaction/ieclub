
// ============= UserConnection.js =============
// backend/src/models/UserConnection.js
module.exports = (sequelize, DataTypes) => {
  const UserConnection = sequelize.define('UserConnection', {
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
    targetUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'target_user_id'
    },
    connectionType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'connection_type',
      validate: {
        isIn: [['follow', 'friend', 'block']]
      }
    }
  }, {
    tableName: 'user_connections',
    indexes: [
      { unique: true, fields: ['user_id', 'target_user_id', 'connection_type'] }
    ],
    timestamps: true,
    updatedAt: false
  });

  UserConnection.associate = (models) => {
    UserConnection.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    UserConnection.belongsTo(models.User, { foreignKey: 'targetUserId', as: 'targetUser' });
  };

  return UserConnection;
};