module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'post_id',
      references: {
        model: 'posts',
        key: 'id'
      }
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
    parentCommentId: {
      type: DataTypes.INTEGER,
      field: 'parent_comment_id',
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '评论内容不能为空'
        },
        len: {
          args: [1, 1000],
          msg: '评论长度必须在1-1000个字符之间'
        }
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
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted'
    }
  }, {
    tableName: 'comments',
    indexes: [
      { fields: ['post_id'] },
      { fields: ['author_id'] },
      { fields: ['parent_comment_id'] },
      { fields: ['created_at'] }
    ]
  });

  // 实例方法：增加点赞数
  Comment.prototype.incrementLikeCount = async function() {
    this.likeCount += 1;
    await this.save();
  };

  // 实例方法：减少点赞数
  Comment.prototype.decrementLikeCount = async function() {
    if (this.likeCount > 0) {
      this.likeCount -= 1;
      await this.save();
    }
  };

  // 定义关联关系
  Comment.associate = (models) => {
    // 评论所属的帖子
    Comment.belongsTo(models.Post, {
      foreignKey: 'postId',
      as: 'post'
    });

    // 评论的作者
    Comment.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });

    // 父评论（用于回复）
    Comment.belongsTo(models.Comment, {
      foreignKey: 'parentCommentId',
      as: 'parentComment'
    });

    // 子评论（回复）
    Comment.hasMany(models.Comment, {
      foreignKey: 'parentCommentId',
      as: 'replies'
    });

    // 评论的点赞
    Comment.hasMany(models.Like, {
      foreignKey: 'targetId',
      constraints: false,
      scope: {
        targetType: 'comment'
      },
      as: 'likes'
    });
  };

  return Comment;
};