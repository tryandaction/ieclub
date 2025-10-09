
// ============= EventRegistration.js =============
// backend/src/models/EventRegistration.js
module.exports = (sequelize, DataTypes) => {
  const EventRegistration = sequelize.define('EventRegistration', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'event_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'registered',
      validate: {
        isIn: [['registered', 'cancelled', 'attended']]
      }
    },
    registrationTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'registration_time'
    },
    attendanceTime: {
      type: DataTypes.DATE,
      field: 'attendance_time'
    },
    feedback: {
      type: DataTypes.TEXT
    },
    rating: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5
      }
    }
  }, {
    tableName: 'event_registrations',
    indexes: [
      { unique: true, fields: ['event_id', 'user_id'] }
    ],
    timestamps: false
  });

  EventRegistration.associate = (models) => {
    EventRegistration.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event' });
    EventRegistration.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return EventRegistration;
};