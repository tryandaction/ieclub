const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: '用户名已被使用'
      },
      validate: {
        len: {
          args: [3, 50],
          msg: '用户名长度必须在3-50个字符之间'
        },
        is: {
          args: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
          msg: '用户名只能包含字母、数字、下划线和中文'
        }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: '该邮箱已被注册'
      },
      validate: {
        isEmail: {
          msg: '请输入有效的邮箱地址'
        },
        isValidDomain(value) {
          const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || 'sustech.edu.cn,mail.sustech.edu.cn').split(',');
          const domain = value.split('@')[1];
          if (!allowedDomains.includes(domain)) {
            throw new Error('必须使用南科大邮箱注册');
          }
        }
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      field: 'avatar_url',
      defaultValue: null
    },
    school: {
      type: DataTypes.STRING(100),
      defaultValue: '南方科技大学'
    },
    department: {
      type: DataTypes.STRING(100),
      validate: {
        isIn: {
          args: [[
            '计算机科学与工程系',
            '电子与电气工程系',
            '数学系',
            '物理系',
            '化学系',
            '生物系',
            '材料科学与工程系',
            '金融系',
            '商学院',
            '人文社科学院',
            '环境科学与工程学院',
            '海洋科学与工程系',
            null
          ]],
          msg: '无效的院系'
        }
      }
    },
    major: {
      type: DataTypes.STRING(100)
    },
    grade: {
      type: DataTypes.STRING(20),
      validate: {
        isIn: {
          args: [['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士', null]],
          msg: '无效的年级'
        }
      }
    },
    bio: {
      type: DataTypes.TEXT,
      validate: {
        len: {
          args: [0, 500],
          msg: '个人简介最多500个字符'
        }
      }
    },
    skills: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isArrayOfStrings(value) {
          if (!Array.isArray(value)) {
            throw new Error('技能必须是数组');
          }
          if (value.length > 20) {
            throw new Error('技能标签最多20个');
          }
          if (value.some(item => typeof item !== 'string')) {
            throw new Error('技能标签必须是字符串');
          }
        }
      }
    },
    interests: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isArrayOfStrings(value) {
          if (!Array.isArray(value)) {
            throw new Error('兴趣必须是数组');
          }
          if (value.length > 20) {
            throw new Error('兴趣标签最多20个');
          }
          if (value.some(item => typeof item !== 'string')) {
            throw new Error('兴趣标签必须是字符串');
          }
        }
      }
    },
    reputation: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    followersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'followers_count',
      validate: {
        min: 0
      }
    },
    followingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'following_count',
      validate: {
        min: 0
      }
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'user',
      validate: {
        isIn: {
          args: [['user', 'admin', 'moderator']],
          msg: '无效的角色'
        }
      }
    },
    lastLogin: {
      type: DataTypes.DATE,
      field: 'last_login'
    },
    wechatOpenid: {
      type: DataTypes.STRING(100),
      unique: true,
      field: 'wechat_openid',
      allowNull: true
    }
  }, {
    tableName: 'users',
    indexes: [
      { fields: ['email'] },
      { fields: ['username'] },
      { fields: ['wechat_openid'] }
    ],
    hooks: {
      // 创建用户前加密密码
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      },
      // 更新用户前加密密码（如果密码被修改）
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      }
    }
  });

  // 实例方法：验证密码
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
  };

  // 实例方法：转换为安全的JSON（不包含敏感信息）
  User.prototype.toSafeJSON = function() {
    const values = this.get();
    delete values.passwordHash;
    return values;
  };

  // 类方法：通过邮箱查找用户
  User.findByEmail = async function(email) {
    return await this.findOne({ where: { email: email.toLowerCase() } });
  };

  // 类方法：通过用户名查找用户
  User.findByUsername = async function(username) {
    return await this.findOne({ where: { username } });
  };

  // 定义关联关系
  User.associate = (models) => {
    // 用户发布的帖子
    User.hasMany(models.Post, {
      foreignKey: 'authorId',
      as: 'posts',
      onDelete: 'CASCADE'
    });

    // 用户组织的活动
    User.hasMany(models.Event, {
      foreignKey: 'organizerId',
      as: 'organizedEvents',
      onDelete: 'CASCADE'
    });

    // 用户的评论
    User.hasMany(models.Comment, {
      foreignKey: 'authorId',
      as: 'comments',
      onDelete: 'CASCADE'
    });

    // 用户的点赞
    User.hasMany(models.Like, {
      foreignKey: 'userId',
      as: 'likes',
      onDelete: 'CASCADE'
    });

    // 用户的活动报名
    User.hasMany(models.EventRegistration, {
      foreignKey: 'userId',
      as: 'eventRegistrations',
      onDelete: 'CASCADE'
    });

    // 用户的关注关系
    User.hasMany(models.UserConnection, {
      foreignKey: 'userId',
      as: 'following',
      onDelete: 'CASCADE'
    });

    User.hasMany(models.UserConnection, {
      foreignKey: 'targetUserId',
      as: 'followers',
      onDelete: 'CASCADE'
    });

    // 用户的通知
    User.hasMany(models.Notification, {
      foreignKey: 'userId',
      as: 'notifications',
      onDelete: 'CASCADE'
    });

    // 用户的收藏
    User.hasMany(models.Bookmark, {
      foreignKey: 'userId',
      as: 'bookmarks',
      onDelete: 'CASCADE'
    });

    // 用户的OCR记录
    User.hasMany(models.OCRRecord, {
      foreignKey: 'userId',
      as: 'ocrRecords',
      onDelete: 'CASCADE'
    });
  };

  return User;
};