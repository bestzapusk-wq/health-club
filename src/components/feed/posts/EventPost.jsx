import { useState, useEffect } from 'react';
import { Calendar, Bell, Check, ExternalLink } from 'lucide-react';
import { formatEventDate, hasReminder, setReminder, removeReminder } from '../../../lib/feedService';
import './EventPost.css';

export default function EventPost({ post, userId }) {
  const [reminded, setReminded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Проверяем, установлено ли напоминание
  useEffect(() => {
    const checkReminder = async () => {
      if (userId) {
        const has = await hasReminder(post.id, userId);
        setReminded(has);
      }
    };
    checkReminder();
  }, [post.id, userId]);

  const handleReminder = async () => {
    if (!userId || loading) return;

    setLoading(true);
    
    if (reminded) {
      await removeReminder(post.id, userId);
      setReminded(false);
    } else {
      await setReminder(post.id, userId);
      setReminded(true);
    }
    
    setLoading(false);
  };

  const handleJoin = () => {
    if (post.event_link) {
      window.open(post.event_link, '_blank');
    }
  };

  // Проверяем, прошло ли событие
  const eventDate = new Date(post.event_datetime);
  const isPast = eventDate < new Date();
  const isToday = eventDate.toDateString() === new Date().toDateString();

  return (
    <div className={`event-post ${isPast ? 'past' : ''}`}>
      {/* Лейбл */}
      <div className="event-label">
        <Calendar size={14} />
        <span>{isPast ? 'ПРОШЕДШИЙ ЭФИР' : isToday ? 'СЕГОДНЯ' : 'ПРЯМОЙ ЭФИР'}</span>
      </div>

      {/* Название */}
      <h3 className="event-title">{post.event_title}</h3>

      {/* Дата и время */}
      <div className="event-datetime">
        📆 {formatEventDate(post.event_datetime)}
      </div>

      {/* Описание */}
      {post.text && (
        <p className="event-description">{post.text}</p>
      )}

      {/* Кнопки */}
      <div className="event-actions">
        {!isPast ? (
          <>
            <button 
              className={`event-remind-btn ${reminded ? 'reminded' : ''}`}
              onClick={handleReminder}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading" />
              ) : reminded ? (
                <>
                  <Check size={18} />
                  <span>Напомню!</span>
                </>
              ) : (
                <>
                  <Bell size={18} />
                  <span>Напомнить</span>
                </>
              )}
            </button>

            {isToday && post.event_link && (
              <button className="event-join-btn" onClick={handleJoin}>
                <ExternalLink size={16} />
                <span>Присоединиться</span>
              </button>
            )}
          </>
        ) : (
          <button className="event-watch-btn" onClick={handleJoin}>
            <span>Смотреть запись</span>
          </button>
        )}
      </div>
    </div>
  );
}
