
// ==================== src/utils/pagination.js ====================
// 分页助手（立即可用）

class PaginationHelper {
  /**
   * 计算分页参数
   */
  static calculate(page = 1, limit = 20, maxLimit = 100) {
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(
      Math.max(1, parseInt(limit) || 20),
      maxLimit
    );
    const offset = (parsedPage - 1) * parsedLimit;

    return {
      page: parsedPage,
      limit: parsedLimit,
      offset
    };
  }

  /**
   * 构建分页元数据
   */
  static buildMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      hasPrevious: page > 1,
      firstPage: 1,
      lastPage: totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    };
  }

  /**
   * 游标分页辅助
   */
  static buildCursor(lastItem, cursorField = 'id') {
    return lastItem ? Buffer.from(
      JSON.stringify({
        [cursorField]: lastItem[cursorField],
        timestamp: lastItem.createdAt
      })
    ).toString('base64') : null;
  }

  /**
   * 解析游标
   */
  static parseCursor(cursor) {
    if (!cursor) return null;
    
    try {
      return JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf8')
      );
    } catch {
      return null;
    }
  }
}

module.exports = PaginationHelper;

// 使用方法：
// const PaginationHelper = require('../utils/pagination');
// 
// const { page, limit, offset } = PaginationHelper.calculate(req.query.page, req.query.limit);
// const { rows, count } = await Post.findAndCountAll({ limit, offset });
// const meta = PaginationHelper.buildMeta(count, page, limit);
// res.json({ posts: rows, pagination: meta });