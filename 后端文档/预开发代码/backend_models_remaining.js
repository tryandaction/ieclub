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