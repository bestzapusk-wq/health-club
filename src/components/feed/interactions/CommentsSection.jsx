import { useState, useEffect, useRef } from 'react';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
import { getComments, addComment, formatPublishedTime } from '../../../lib/feedService';
import './CommentsSection.css';

export default function CommentsSection({ postId, userId, commentsCount, onCommentAdd }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  // Загрузка комментариев
  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    const data = await getComments(postId);
    setComments(data);
    setLoading(false);
  };

  // Отправка комментария
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userId || sending) return;

    setSending(true);
    
    // Оптимистичное обновление
    const tempComment = {
      id: `temp-${Date.now()}`,
      user_name: 'Вы',
      text: newComment.trim(),
      created_at: new Date().toISOString()
    };
    
    setComments(prev => [...prev, tempComment]);
    setNewComment('');
    
    const { success, comment } = await addComment(postId, userId, newComment.trim());
    
    if (success) {
      // Заменяем временный комментарий на реальный
      setComments(prev => prev.map(c => 
        c.id === tempComment.id ? { ...c, id: comment?.id || tempComment.id } : c
      ));
      onCommentAdd();
    } else {
      // Убираем временный комментарий при ошибке
      setComments(prev => prev.filter(c => c.id !== tempComment.id));
    }
    
    setSending(false);
  };

  // Показываем только 2 последних по умолчанию
  const displayedComments = expanded ? comments : comments.slice(-2);
  const hasMore = comments.length > 2;

  return (
    <div className="comments-section">
      {loading ? (
        <div className="comments-loading">
          <div className="comment-skeleton" />
          <div className="comment-skeleton" />
        </div>
      ) : (
        <>
          {/* Кнопка "показать все" */}
          {hasMore && !expanded && (
            <button 
              className="comments-show-all"
              onClick={() => setExpanded(true)}
            >
              <ChevronDown size={16} />
              <span>Показать все {comments.length} комментариев</span>
            </button>
          )}

          {/* Список комментариев */}
          <div className="comments-list">
            {displayedComments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">
                  {comment.avatar_url ? (
                    <img src={comment.avatar_url} alt="" />
                  ) : (
                    <span>{comment.user_name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">{comment.user_name}</span>
                    <span className="comment-time">
                      {formatPublishedTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Свернуть */}
          {expanded && hasMore && (
            <button 
              className="comments-collapse"
              onClick={() => setExpanded(false)}
            >
              <ChevronUp size={16} />
              <span>Свернуть</span>
            </button>
          )}

          {/* Поле ввода */}
          <form className="comment-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Написать комментарий..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!userId || sending}
            />
            <button 
              type="submit" 
              className={`comment-send-btn ${newComment.trim() ? 'active' : ''}`}
              disabled={!newComment.trim() || !userId || sending}
            >
              <Send size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
