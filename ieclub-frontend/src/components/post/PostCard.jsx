import React, { useState } from 'react';
import { Tag } from '../common/Tag';
import { Avatar } from '../common/Avatar';
import { Tooltip } from '../common/Tooltip';
import { Button } from '../common/Button';
import { Heart, MessageCircle, Share2, Bookmark, Shield, Send } from 'lucide-react';

export const PostCard = ({ post, onLike, onComment, onShare, detailed = false }) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(detailed);
  const [commentText, setCommentText] = useState('');

  const handleLike = () => {
    setLiked(!liked);
    onLike && onLike(post.id, !liked);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onComment && onComment(post.id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <Avatar src={post.avatar} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-bold text-lg text-gray-800 hover:text-blue-600 cursor-pointer">{post.author}</span>
              <span className="text-gray-500 text-sm">· {post.major}</span>
              <span className="text-gray-400 text-sm">· {post.time}</span>
              {post.verified && (
                <Tooltip content="已认证用户"><Shield size={16} className="text-blue-500" fill="currentColor" /></Tooltip>
              )}
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 hover:text-blue-600 cursor-pointer leading-tight">{post.title}</h3>
            <p className="text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {post.images.map((img, idx) => (<div key={idx} className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg"></div>))}
              </div>
            )}
            <div className="flex gap-2 mb-4 flex-wrap">
              <Tag variant="blue" interactive>{post.category}</Tag>
              {post.tags.map((tag, idx) => (<Tag key={idx} variant="gray" interactive>#{tag}</Tag>))}
            </div>
            <div className="flex items-center justify-between text-gray-600 pt-3 border-t">
              <div className="flex gap-6">
                <button onClick={handleLike} className={`flex items-center gap-2 transition-all hover:scale-110 ${liked ? 'text-red-500' : 'hover:text-red-500'}`}>
                  <Heart size={20} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
                  <span className="font-semibold">{post.likes + (liked ? 1 : 0)}</span>
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 hover:text-blue-500 transition-all hover:scale-110">
                  <MessageCircle size={20} strokeWidth={2} />
                  <span className="font-semibold">{post.comments}</span>
                </button>
                <button onClick={() => onShare && onShare(post.id)} className="flex items-center gap-2 hover:text-green-500 transition-all hover:scale-110">
                  <Share2 size={20} strokeWidth={2} />
                  <span className="font-semibold">分享</span>
                </button>
              </div>
              <button onClick={() => setBookmarked(!bookmarked)} className={`flex items-center gap-2 transition-all hover:scale-110 ${bookmarked ? 'text-yellow-500' : 'hover:text-yellow-500'}`}>
                <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showComments && (
        <div className="border-t bg-gray-50 p-6">
          <div className="space-y-4 mb-4">
            {post.commentsList && post.commentsList.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <Avatar src={comment.avatar} size="sm" />
                <div className="flex-1">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-sm mb-1">{comment.author}</p>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <button className="hover:text-blue-600">{comment.time}</button>
                    <button className="hover:text-blue-600">回复</button>
                    <button className="hover:text-red-600">点赞 {comment.likes}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="写下你的评论..." className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyPress={(e) => e.key === 'Enter' && handleComment()} />
            <Button variant="primary" icon={Send} onClick={handleComment}>发送</Button>
          </div>
        </div>
      )}
    </div>
  );
};