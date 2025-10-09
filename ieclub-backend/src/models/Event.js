
// ============= Event.js =============
// backend/src/models/Event.js
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'organizer_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    category: {
      type: DataTypes.STRING(50),
      validate: {
        isIn: [['学术讲座', '读书会', '工作坊', '社交活动', '项目路演', '技能培训']]
      }
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      field: 'end_time'
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      field: 'max_participants'
    },
    currentParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'current_participants'
    },
    coverImage: {
      type: DataTypes.STRING(500),
      field: 'cover_image'
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'upcoming',
      validate: {
        isIn: [['upcoming', 'ongoing', 'finished', 'cancelled']]
      }
    },
    registrationDeadline: {
      type: DataTypes.DATE,
      field: 'registration_deadline'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted'
    }
  }, {
    tableName: 'events',
    indexes: [
      { fields: ['organizer_id'] },
      { fields: ['start_time'] },
      { fields: ['status'] }
    ]
  });

  Event.associate = (models) => {
    Event.belongsTo(models.User, { foreignKey: 'organizerId', as: 'organizer' });
    Event.hasMany(models.EventRegistration, { foreignKey: 'eventId', as: 'registrations' });
  };

  return Event;
};