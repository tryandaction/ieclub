const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const db = {
  sequelize,
  Sequelize,
  User: require('./User')(sequelize, Sequelize),
  Post: require('./Post')(sequelize, Sequelize),
  Event: require('./Event')(sequelize, Sequelize),
  Comment: require('./Comment')(sequelize, Sequelize),
  Like: require('./Like')(sequelize, Sequelize),
  EventRegistration: require('./EventRegistration')(sequelize, Sequelize),
  UserConnection: require('./UserConnection')(sequelize, Sequelize),
  OCRRecord: require('./OCRRecord')(sequelize, Sequelize),
  Notification: require('./Notification')(sequelize, Sequelize),
  Bookmark: require('./Bookmark')(sequelize, Sequelize),
};

// 定义关联关系
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;