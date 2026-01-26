import { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { setReaction, removeReaction, getAvailableReactions } from '../../../lib/feedService';
import './ReactionBar.css';

export default function ReactionBar({ 
  postId, 
  userId, 
  reactions = {}, 
  userReaction,
  commentsCount = 0,
  onReactionChange,
  onCommentsClick
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const pickerRef = useRef(null);
  const longPressTimer = useRef(null);

  const availableReactions = getAvailableReactions();

  // Закрытие пикера при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Сортировка реакций по количеству
  const sortedReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalReactions = sortedReactions.reduce((sum, [_, count]) => sum + count, 0);

  // Обработка нажатия на реакцию
  const handleReactionClick = async (emoji) => {
    if (!userId) return;

    setIsAnimating(true);
    setShowPicker(false);

    const newReactions = { ...reactions };
    let newUserReaction = userReaction;

    if (userReaction === emoji) {
      // Убираем реакцию
      newReactions[emoji] = Math.max(0, (newReactions[emoji] || 1) - 1);
      if (newReactions[emoji] === 0) delete newReactions[emoji];
      newUserReaction = null;
      await removeReaction(postId, userId);
    } else {
      // Меняем реакцию
      if (userReaction && newReactions[userReaction]) {
        newReactions[userReaction]--;
        if (newReactions[userReaction] === 0) delete newReactions[userReaction];
      }
      newReactions[emoji] = (newReactions[emoji] || 0) + 1;
      newUserReaction = emoji;
      await setReaction(postId, userId, emoji);
    }

    onReactionChange(newReactions, newUserReaction);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Long press для пикера
  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Быстрый tap — ставим лайк или убираем
  const handleQuickTap = () => {
    if (showPicker) return;
    
    if (userReaction) {
      handleReactionClick(userReaction);
    } else {
      handleReactionClick('❤️');
    }
  };

  return (
    <div className="reaction-bar">
      {/* Реакции */}
      <div className="reactions-section">
        {sortedReactions.length > 0 ? (
          <div 
            className={`reactions-display ${isAnimating ? 'animating' : ''}`}
            onClick={handleQuickTap}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
          >
            {sortedReactions.slice(0, 3).map(([emoji, count]) => (
              <span 
                key={emoji} 
                className={`reaction-item ${userReaction === emoji ? 'active' : ''}`}
              >
                <span className="reaction-emoji">{emoji}</span>
                <span className="reaction-count">{count}</span>
              </span>
            ))}
            {sortedReactions.length > 3 && (
              <span className="reaction-more">+{sortedReactions.length - 3}</span>
            )}
          </div>
        ) : (
          <button 
            className="reaction-add-btn"
            onClick={handleQuickTap}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <span>❤️</span>
          </button>
        )}

        {/* Пикер */}
        {showPicker && (
          <div className="reaction-picker" ref={pickerRef}>
            {availableReactions.map(emoji => (
              <button
                key={emoji}
                className={`picker-emoji ${userReaction === emoji ? 'active' : ''}`}
                onClick={() => handleReactionClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Разделитель */}
      <div className="bar-divider" />

      {/* Комментарии */}
      <button className="comments-btn" onClick={onCommentsClick}>
        <MessageCircle size={18} />
        <span>{commentsCount}</span>
      </button>
    </div>
  );
}
