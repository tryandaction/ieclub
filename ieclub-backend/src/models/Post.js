module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'author_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '标题不能为空'
        },
        len: {
          args: [1, 255],
          msg: '标题长度必须在1-255个字符之间'
        }
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '内容不能为空'
        },
        len: {
          args: [1, 50000],
          msg: '内容长度不能超过50000个字符'
        }
      }
    },
    category: {
      type: DataTypes.STRING(50),
      validate: {
        isIn: {
          args: [['学术讨论', '项目招募', '资源分享', '问答求助', '活动预告', '经验分享']],
          msg: '无效的分类'
        }
      }
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isValidTags(value) {
          if (!Array.isArray(value)) {
            throw new Error('标签必须是数组');
          }
          if (value.length > 10) {
            throw new Error('标签最多10个');
          }
          if (value.some(tag => typeof tag !== 'string' || tag.length > 20)) {
            throw new Error('每个标签必须是字符串且长度不超过20');
          }
        }
      }
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isValidImages(value) {
          if (!Array.isArray(value)) {
            throw new Error('图片必须是数组');
          }
          if (value.length > 9) {
            throw new Error('图片最多9张');
          }
        }
      }
    },
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'view_count',
      validate: {
        min: 0
      }
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'like_count',
      validate: {
        min: 0
      }
    },
    commentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'comment_count',
      validate: {
        min: 0
      }
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_pinned'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted'
    }
  }, {
    tableName: 'posts',
    indexes: [
      { fields: ['author_id'] },
      { fields: ['created_at'] },
      { fields: ['category'] },
      { fields: ['is_deleted'] }
      // 全文搜索索引暂时移除，SQLite不支持to_tsvector函数
      // 如需全文搜索，可以考虑使用SQLite FTS扩展
    ],
    hooks: {
      // 软删除：设置isDeleted为true而不是真正删除
      beforeDestroy: async (post) => {
        post.isDeleted = true;
        await post.save();
        throw new Error('SOFT_DELETE'); // 阻止真正删除
      }
    }
  });

  // 实例方法：增加浏览量
  Post.prototype.incrementViewCount = async function() {
    this.viewCount += 1;
    await this.save();
  };

  // 实例方法：增加点赞数
  Post.prototype.incrementLikeCount = async function() {
    this.likeCount += 1;
    await this.save();
  };

  // 实例方法：减少点赞数
  Post.prototype.decrementLikeCount = async function() {
    if (this.likeCount > 0) {
      this.likeCount -= 1;
      await this.save();
    }
  };

  // 实例方法：增加评论数
  Post.prototype.incrementCommentCount = async function() {
    this.commentCount += 1;
    await this.save();
  };

  // 实例方法：减少评论数
  Post.prototype.decrementCommentCount = async function() {
    if (this.commentCount > 0) {
      this.commentCount -= 1;
      await this.save();
    }
  };

  // 类方法：获取热门帖子
  Post.getHotPosts = async function(limit = 10) {
    return await this.findAll({
      where: { isDeleted: false },
      order: [
        ['viewCount', 'DESC'],
        ['likeCount', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit,
      include: [{
        model: sequelize.models.User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl', 'major', 'reputation']
      }]
    });
  };

  // 定义关联关系
  Post.associate = (models) => {
    // 帖子的作者
    Post.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });

    // 帖子的评论
    Post.hasMany(models.Comment, {
      foreignKey: 'postId',
      as: 'comments'
    });

    // 帖子的点赞
    Post.hasMany(models.Like, {
      foreignKey: 'targetId',
      constraints: false,
      scope: {
        targetType: 'post'
      },
      as: 'likes'
    });

    // 帖子的收藏
    Post.hasMany(models.Bookmark, {
      foreignKey: 'targetId',
      constraints: false,
      scope: {
        targetType: 'post'
      },
      as: 'bookmarks'
    });
  };

  return Post;
};