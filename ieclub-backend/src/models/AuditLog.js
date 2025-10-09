// ==================== src/models/AuditLog.js ====================
module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作用户ID'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '操作类型'
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '操作资源'
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'HTTP方法'
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '请求路径'
    },
    params: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '路径参数'
    },
    query: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '查询参数'
    },
    requestBody: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '请求体'
    },
    response: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '响应数据'
    },
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'HTTP状态码'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '请求耗时(ms)'
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP地址'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户代理'
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否成功'
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '操作时间'
    }
  }, {
    tableName: 'audit_logs',
    timestamps: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['action'] },
      { fields: ['resource'] },
      { fields: ['timestamp'] },
      { fields: ['ip'] }
    ]
  });

  return AuditLog;
};
