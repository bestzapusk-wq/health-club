import { useState } from 'react';
import { User } from 'lucide-react';
import TextPost from './posts/TextPost';
import ImagePost from './posts/ImagePost';
import VideoPost from './posts/VideoPost';
import AudioPost from './posts/AudioPost';
import EventPost from './posts/EventPost';
import ReactionBar from './interactions/ReactionBar';
import CommentsSection from './interactions/CommentsSection';
import { formatPublishedTime } from '../../lib/feedService';
import './FeedPost.css';

export default function FeedPost({ post, userId, onUpdate }) {
  const [showComments, setShowComments] = useState(false);

  // Рендер контента по типу
  const renderContent = () => {
    switch (post.type) {
      case 'text':
        return <TextPost post={post} />;
      case 'image':
        return <ImagePost post={post} />;
      case 'video':
        return <VideoPost post={post} />;
      case 'audio':
        return <AudioPost post={post} />;
      case 'event':
        return <EventPost post={post} userId={userId} />;
      default:
        return <TextPost post={post} />;
    }
  };

  const handleReactionChange = (newReactions, userReaction) => {
    onUpdate({
      reactions: newReactions,
      user_reaction: userReaction
    });
  };

  const handleCommentAdd = () => {
    onUpdate({
      comments_count: post.comments_count + 1
    });
  };

  // Определяем, показывать ли автора (для эфиров не показываем)
  const showAuthor = post.type !== 'event' && post.author_name;

  return (
    <article className="feed-post">
      {/* Автор поста (не для эфиров) */}
      {showAuthor && (
        <div className="post-author">
          <div className="author-avatar">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt={post.author_name} />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="author-info">
            <span className="author-name">{post.author_name}</span>
            {post.author_role === 'expert' && (
              <span className="author-badge expert">Эксперт</span>
            )}
            {post.author_role === 'member' && (
              <span className="author-badge member">Участник клуба</span>
            )}
          </div>
        </div>
      )}

      {/* Контент поста */}
      <div className="post-content">
        {renderContent()}
      </div>

      {/* Реакции */}
      <ReactionBar 
        postId={post.id}
        userId={userId}
        reactions={post.reactions}
        userReaction={post.user_reaction}
        commentsCount={post.comments_count}
        onReactionChange={handleReactionChange}
        onCommentsClick={() => setShowComments(!showComments)}
      />

      {/* Время публикации */}
      <div className="post-time">
        {formatPublishedTime(post.published_at)}
      </div>

      {/* Комментарии */}
      {showComments && (
        <CommentsSection 
          postId={post.id}
          userId={userId}
          commentsCount={post.comments_count}
          onCommentAdd={handleCommentAdd}
        />
      )}
    </article>
  );
}
