// ==================== src/config/elasticsearch.js ====================
const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/logger');

/**
 * Elasticsearch配置
 */
class ElasticsearchConfig {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  /**
   * 初始化客户端
   */
  async init() {
    try {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        auth: process.env.ELASTICSEARCH_AUTH ? {
          username: process.env.ELASTICSEARCH_USER,
          password: process.env.ELASTICSEARCH_PASSWORD
        } : undefined,
        maxRetries: 5,
        requestTimeout: 60000,
        sniffOnStart: true
      });

      // 测试连接
      const health = await this.client.cluster.health();
      logger.info('✅ Elasticsearch连接成功', {
        status: health.status,
        clusterName: health.cluster_name
      });

      // 创建索引
      await this.createIndices();

      this.initialized = true;
    } catch (error) {
      logger.error('Elasticsearch初始化失败:', error);
      // 不阻止应用启动
    }
  }

  /**
   * 创建索引
   */
  async createIndices() {
    const indices = [
      {
        index: 'posts',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                ik_smart_analyzer: {
                  type: 'custom',
                  tokenizer: 'ik_smart'
                },
                ik_max_word_analyzer: {
                  type: 'custom',
                  tokenizer: 'ik_max_word'
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'integer' },
              title: {
                type: 'text',
                analyzer: 'ik_max_word_analyzer',
                search_analyzer: 'ik_smart_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              content: {
                type: 'text',
                analyzer: 'ik_max_word_analyzer',
                search_analyzer: 'ik_smart_analyzer'
              },
              authorId: { type: 'integer' },
              authorName: {
                type: 'text',
                analyzer: 'ik_smart_analyzer'
              },
              tags: {
                type: 'keyword'
              },
              category: { type: 'keyword' },
              viewCount: { type: 'integer' },
              likeCount: { type: 'integer' },
              commentCount: { type: 'integer' },
              status: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        }
      },
      {
        index: 'users',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                ik_analyzer: {
                  type: 'custom',
                  tokenizer: 'ik_smart'
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'integer' },
              email: { type: 'keyword' },
              nickname: {
                type: 'text',
                analyzer: 'ik_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              bio: {
                type: 'text',
                analyzer: 'ik_analyzer'
              },
              department: { type: 'keyword' },
              major: { type: 'keyword' },
              interests: { type: 'keyword' },
              skills: { type: 'keyword' },
              followerCount: { type: 'integer' },
              followingCount: { type: 'integer' },
              postCount: { type: 'integer' },
              status: { type: 'keyword' },
              createdAt: { type: 'date' }
            }
          }
        }
      },
      {
        index: 'events',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                ik_analyzer: {
                  type: 'custom',
                  tokenizer: 'ik_max_word'
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'integer' },
              title: {
                type: 'text',
                analyzer: 'ik_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              description: {
                type: 'text',
                analyzer: 'ik_analyzer'
              },
              location: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              organizerId: { type: 'integer' },
              organizerName: { type: 'keyword' },
              category: { type: 'keyword' },
              tags: { type: 'keyword' },
              startTime: { type: 'date' },
              endTime: { type: 'date' },
              maxParticipants: { type: 'integer' },
              currentParticipants: { type: 'integer' },
              status: { type: 'keyword' },
              createdAt: { type: 'date' }
            }
          }
        }
      }
    ];

    for (const { index, body } of indices) {
      try {
        const exists = await this.client.indices.exists({ index });
        
        if (!exists) {
          await this.client.indices.create({ index, body });
          logger.info(`✅ 创建索引: ${index}`);
        }
      } catch (error) {
        if (error.meta?.body?.error?.type !== 'resource_already_exists_exception') {
          logger.error(`创建索引失败 ${index}:`, error);
        }
      }
    }
  }

  /**
   * 获取客户端
   */
  getClient() {
    return this.client;
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.client) {
      await this.client.close();
      logger.info('Elasticsearch连接已关闭');
    }
  }
}

module.exports = new ElasticsearchConfig();


// ==================== src/services/searchService.js ====================
const esConfig = require('../config/elasticsearch');
const logger = require('../utils/logger');

/**
 * 搜索服务
 */
class SearchService {
  /**
   * 索引文档
   */
  async indexDocument(index, id, document) {
    try {
      const client = esConfig.getClient();
      if (!client) return;

      await client.index({
        index,
        id: id.toString(),
        document,
        refresh: true
      });

      logger.debug(`文档已索引: ${index}/${id}`);
    } catch (error) {
      logger.error('索引文档失败:', error);
    }
  }

  /**
   * 批量索引
   */
  async bulkIndex(index, documents) {
    try {
      const client = esConfig.getClient();
      if (!client) return;

      const operations = documents.flatMap(doc => [
        { index: { _index: index, _id: doc.id.toString() } },
        doc
      ]);

      const result = await client.bulk({
        refresh: true,
        operations
      });

      if (result.errors) {
        logger.warn('批量索引部分失败');
      }

      logger.info(`批量索引完成: ${documents.length}个文档`);
    } catch (error) {
      logger.error('批量索引失败:', error);
    }
  }

  /**
   * 更新文档
   */
  async updateDocument(index, id, document) {
    try {
      const client = esConfig.getClient();
      if (!client) return;

      await client.update({
        index,
        id: id.toString(),
        doc: document,
        refresh: true
      });

      logger.debug(`文档已更新: ${index}/${id}`);
    } catch (error) {
      logger.error('更新文档失败:', error);
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(index, id) {
    try {
      const client = esConfig.getClient();
      if (!client) return;

      await client.delete({
        index,
        id: id.toString(),
        refresh: true
      });

      logger.debug(`文档已删除: ${index}/${id}`);
    } catch (error) {
      logger.error('删除文档失败:', error);
    }
  }

  /**
   * 搜索帖子
   */
  async searchPosts(query, options = {}) {
    try {
      const client = esConfig.getClient();
      if (!client) {
        throw new Error('Elasticsearch未初始化');
      }

      const {
        page = 1,
        limit = 20,
        category,
        tags,
        authorId,
        sortBy = 'relevance',
        dateFrom,
        dateTo
      } = options;

      // 构建查询
      const must = [];
      const filter = [];

      // 主查询
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['nickname^3', 'bio^2', 'major', 'skills', 'interests'],
            fuzziness: 'AUTO'
          }
        });
      }

      filter.push({ term: { status: 'active' } });

      if (department) {
        filter.push({ term: { department } });
      }

      if (interests && interests.length > 0) {
        filter.push({ terms: { interests } });
      }

      const result = await client.search({
        index: 'users',
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: {
            must: must.length > 0 ? must : undefined,
            filter: filter.length > 0 ? filter : undefined
          }
        },
        highlight: {
          fields: {
            nickname: {},
            bio: {}
          }
        }
      });

      return {
        total: result.hits.total.value,
        hits: result.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          ...hit._source,
          highlight: hit.highlight
        })),
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('用户搜索失败:', error);
      throw error;
    }
  }

  /**
   * 搜索活动
   */
  async searchEvents(query, options = {}) {
    try {
      const client = esConfig.getClient();
      if (!client) {
        throw new Error('Elasticsearch未初始化');
      }

      const { page = 1, limit = 20, category, status, upcoming } = options;

      const must = [];
      const filter = [];

      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['title^3', 'description^2', 'location', 'tags'],
            fuzziness: 'AUTO'
          }
        });
      }

      if (status) {
        filter.push({ term: { status } });
      }

      if (category) {
        filter.push({ term: { category } });
      }

      if (upcoming) {
        filter.push({
          range: {
            startTime: { gte: 'now' }
          }
        });
      }

      const result = await client.search({
        index: 'events',
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: {
            must: must.length > 0 ? must : undefined,
            filter: filter.length > 0 ? filter : undefined
          }
        },
        sort: [
          { startTime: { order: 'asc' } }
        ],
        highlight: {
          fields: {
            title: {},
            description: {}
          }
        }
      });

      return {
        total: result.hits.total.value,
        hits: result.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          ...hit._source,
          highlight: hit.highlight
        })),
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('活动搜索失败:', error);
      throw error;
    }
  }

  /**
   * 搜索建议（自动补全）
   */
  async getSuggestions(query, type = 'posts') {
    try {
      const client = esConfig.getClient();
      if (!client) return [];

      const field = type === 'posts' ? 'title' : 'nickname';

      const result = await client.search({
        index: type,
        size: 10,
        query: {
          match_phrase_prefix: {
            [field]: {
              query,
              max_expansions: 10
            }
          }
        },
        _source: [field, 'id']
      });

      return result.hits.hits.map(hit => ({
        id: hit._id,
        text: hit._source[field]
      }));
    } catch (error) {
      logger.error('获取建议失败:', error);
      return [];
    }
  }

  /**
   * 热门搜索词
   */
  async getHotSearchTerms(limit = 10) {
    try {
      const terms = await redis.zrevrange('hot:search:terms', 0, limit - 1, 'WITHSCORES');
      
      const result = [];
      for (let i = 0; i < terms.length; i += 2) {
        result.push({
          term: terms[i],
          count: parseInt(terms[i + 1])
        });
      }
      
      return result;
    } catch (error) {
      logger.error('获取热门搜索词失败:', error);
      return [];
    }
  }

  /**
   * 记录搜索词
   */
  async recordSearchTerm(term) {
    try {
      await redis.zincrby('hot:search:terms', 1, term);
    } catch (error) {
      logger.error('记录搜索词失败:', error);
    }
  }

  /**
   * 获取排序配置
   */
  getSortConfig(sortBy) {
    const sortConfigs = {
      relevance: [{ _score: { order: 'desc' } }],
      latest: [{ createdAt: { order: 'desc' } }],
      popular: [
        { likeCount: { order: 'desc' } },
        { viewCount: { order: 'desc' } }
      ],
      hot: [
        { commentCount: { order: 'desc' } },
        { likeCount: { order: 'desc' } }
      ]
    };

    return sortConfigs[sortBy] || sortConfigs.relevance;
  }

  /**
   * 重建索引
   */
  async reindexAll() {
    try {
      const { Post, User, Event } = require('../models');

      // 重建帖子索引
      const posts = await Post.findAll({
        where: { status: 'published' },
        include: [{ model: User, as: 'author', attributes: ['nickname'] }]
      });

      await this.bulkIndex('posts', posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        authorName: post.author?.nickname,
        tags: post.tags,
        category: post.category,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        status: post.status,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      })));

      // 重建用户索引
      const users = await User.findAll({
        where: { status: 'active' }
      });

      await this.bulkIndex('users', users.map(user => ({
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        bio: user.bio,
        department: user.department,
        major: user.major,
        interests: user.interests,
        skills: user.skills,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        postCount: user.postCount,
        status: user.status,
        createdAt: user.createdAt
      })));

      // 重建活动索引
      const events = await Event.findAll();

      await this.bulkIndex('events', events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        organizerId: event.organizerId,
        category: event.category,
        tags: event.tags,
        startTime: event.startTime,
        endTime: event.endTime,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
        status: event.status,
        createdAt: event.createdAt
      })));

      logger.info('✅ 索引重建完成');
    } catch (error) {
      logger.error('重建索引失败:', error);
      throw error;
    }
  }
}

module.exports = new SearchService();


// ==================== src/controllers/searchController.js ====================
const searchService = require('../services/searchService');
const logger = require('../utils/logger');

class SearchController {
  /**
   * 综合搜索
   */
  static async search(req, res) {
    try {
      const { q: query, type = 'all', page = 1, limit = 20 } = req.query;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '搜索关键词不能为空'
        });
      }

      // 记录搜索词
      searchService.recordSearchTerm(query);

      const results = {};

      if (type === 'all' || type === 'posts') {
        results.posts = await searchService.searchPosts(query, {
          page,
          limit: type === 'all' ? 5 : limit
        });
      }

      if (type === 'all' || type === 'users') {
        results.users = await searchService.searchUsers(query, {
          page,
          limit: type === 'all' ? 5 : limit
        });
      }

      if (type === 'all' || type === 'events') {
        results.events = await searchService.searchEvents(query, {
          page,
          limit: type === 'all' ? 5 : limit
        });
      }

      res.json({
        success: true,
        query,
        data: results
      });
    } catch (error) {
      logger.error('搜索失败:', error);
      res.status(500).json({
        success: false,
        error: '搜索失败'
      });
    }
  }

  /**
   * 搜索建议
   */
  static async suggestions(req, res) {
    try {
      const { q: query, type = 'posts' } = req.query;

      if (!query || query.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const suggestions = await searchService.getSuggestions(query, type);

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      logger.error('获取建议失败:', error);
      res.status(500).json({
        success: false,
        error: '获取建议失败'
      });
    }
  }

  /**
   * 热门搜索
   */
  static async hotSearches(req, res) {
    try {
      const { limit = 10 } = req.query;

      const hotTerms = await searchService.getHotSearchTerms(parseInt(limit));

      res.json({
        success: true,
        data: hotTerms
      });
    } catch (error) {
      logger.error('获取热门搜索失败:', error);
      res.status(500).json({
        success: false,
        error: '获取热门搜索失败'
      });
    }
  }

  /**
   * 高级搜索
   */
  static async advancedSearch(req, res) {
    try {
      const {
        q: query,
        category,
        tags,
        authorId,
        sortBy,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20
      } = req.query;

      const results = await searchService.searchPosts(query, {
        category,
        tags: tags ? tags.split(',') : undefined,
        authorId,
        sortBy,
        dateFrom,
        dateTo,
        page,
        limit
      });

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('高级搜索失败:', error);
      res.status(500).json({
        success: false,
        error: '搜索失败'
      });
    }
  }

  /**
   * 重建索引（管理员）
   */
  static async reindex(req, res) {
    try {
      await searchService.reindexAll();

      res.json({
        success: true,
        message: '索引重建完成'
      });
    } catch (error) {
      logger.error('重建索引失败:', error);
      res.status(500).json({
        success: false,
        error: '重建索引失败'
      });
    }
  }
}

module.exports = SearchController;


// ==================== src/routes/search.js ====================
const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/searchController');
const auth = require('../middleware/auth');
const CacheMiddleware = require('../middleware/cache');

// 综合搜索（缓存3分钟）
router.get('/',
  CacheMiddleware.cache({ ttl: 180 }),
  SearchController.search
);

// 搜索建议（缓存5分钟）
router.get('/suggestions',
  CacheMiddleware.cache({ ttl: 300 }),
  SearchController.suggestions
);

// 热门搜索（缓存10分钟）
router.get('/hot',
  CacheMiddleware.cache({ ttl: 600 }),
  SearchController.hotSearches
);

// 高级搜索
router.get('/advanced',
  CacheMiddleware.cache({ ttl: 180 }),
  SearchController.advancedSearch
);

// 重建索引（管理员）
router.post('/reindex',
  auth.required,
  auth.isAdmin,
  SearchController.reindex
);

module.exports = router;


// ==================== 数据库钩子自动同步 ====================
// 在 models/Post.js 中添加钩子

Post.addHook('afterCreate', async (post) => {
  const searchService = require('../services/searchService');
  const author = await post.getAuthor();
  
  await searchService.indexDocument('posts', post.id, {
    id: post.id,
    title: post.title,
    content: post.content,
    authorId: post.authorId,
    authorName: author.nickname,
    tags: post.tags,
    category: post.category,
    viewCount: post.viewCount,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  });
});

Post.addHook('afterUpdate', async (post) => {
  const searchService = require('../services/searchService');
  
  await searchService.updateDocument('posts', post.id, {
    title: post.title,
    content: post.content,
    tags: post.tags,
    category: post.category,
    viewCount: post.viewCount,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    status: post.status,
    updatedAt: post.updatedAt
  });
});

Post.addHook('afterDestroy', async (post) => {
  const searchService = require('../services/searchService');
  await searchService.deleteDocument('posts', post.id);
});


// ==================== .env 配置 ====================
/*
# Elasticsearch配置
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=your_password
ELASTICSEARCH_AUTH=false
*/


// ==================== package.json 依赖 ====================
/*
{
  "dependencies": {
    "@elastic/elasticsearch": "^8.11.0"
  }
}

安装命令：
npm install @elastic/elasticsearch

安装Elasticsearch（macOS）：
brew install elasticsearch
brew services start elasticsearch

安装Elasticsearch（Docker）：
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.11.0

安装IK中文分词插件：
./bin/elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v8.11.0/elasticsearch-analysis-ik-8.11.0.zip
*/


// ==================== 前端搜索组件 ====================
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import axios from 'axios';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 获取搜索建议
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchSuggestions = async () => {
    try {
      const res = await axios.get(`/api/search/suggestions?q=${query}`);
      setSuggestions(res.data.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('获取建议失败:', error);
    }
  };

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    setShowSuggestions(false);
    
    try {
      const res = await axios.get(`/api/search?q=${searchQuery || query}`);
      setResults(res.data.data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      {/* 搜索框 */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索帖子、用户、活动..."
          className="w-full px-4 py-3 pl-12 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setResults(null);
            }}
            className="absolute right-4 top-3.5"
          >
            <X className="text-gray-400 hover:text-gray-600" size={20} />
          </button>
        )}

        {/* 搜索建议 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            {suggestions.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(item.text);
                  handleSearch(item.text);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
              >
                {item.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      {loading && <div className="text-center py-8">搜索中...</div>}
      
      {results && !loading && (
        <div className="mt-6 space-y-6">
          {/* 帖子结果 */}
          {results.posts && (
            <div>
              <h3 className="text-lg font-bold mb-4">
                帖子 ({results.posts.total})
              </h3>
              {results.posts.hits.map(post => (
                <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm mb-3">
                  <h4
                    className="font-bold mb-2"
                    dangerouslySetInnerHTML={{ __html: post.highlight?.title?.[0] || post.title }}
                  />
                  <p
                    className="text-gray-600 text-sm"
                    dangerouslySetInnerHTML={{ __html: post.highlight?.content?.[0] || post.content }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}.push({
          multi_match: {
            query,
            fields: ['title^3', 'content^2', 'tags^2', 'authorName'],
            fuzziness: 'AUTO',
            operator: 'or',
            minimum_should_match: '75%'
          }
        });
      }

      // 过滤条件
      filter.push({ term: { status: 'published' } });

      if (category) {
        filter.push({ term: { category } });
      }

      if (tags && tags.length > 0) {
        filter.push({ terms: { tags } });
      }

      if (authorId) {
        filter.push({ term: { authorId } });
      }

      if (dateFrom || dateTo) {
        const range = {};
        if (dateFrom) range.gte = dateFrom;
        if (dateTo) range.lte = dateTo;
        filter.push({ range: { createdAt: range } });
      }

      // 排序
      const sort = this.getSortConfig(sortBy);

      // 执行搜索
      const result = await client.search({
        index: 'posts',
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: {
            must: must.length > 0 ? must : undefined,
            filter: filter.length > 0 ? filter : undefined
          }
        },
        sort,
        highlight: {
          fields: {
            title: {
              pre_tags: ['<mark>'],
              post_tags: ['</mark>']
            },
            content: {
              pre_tags: ['<mark>'],
              post_tags: ['</mark>'],
              fragment_size: 150,
              number_of_fragments: 3
            }
          }
        }
      });

      return {
        total: result.hits.total.value,
        hits: result.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          ...hit._source,
          highlight: hit.highlight
        })),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.hits.total.value / limit)
      };
    } catch (error) {
      logger.error('搜索失败:', error);
      throw error;
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(query, options = {}) {
    try {
      const client = esConfig.getClient();
      if (!client) {
        throw new Error('Elasticsearch未初始化');
      }

      const { page = 1, limit = 20, department, interests } = options;

      const must = [];
      const filter = [];

      if (query) {
        must