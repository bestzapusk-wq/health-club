import { useState, useEffect } from 'react';
import { Radio, Bell, Check } from 'lucide-react';
import './StreamCountdown.css';

// Next stream: today at 19:30
function getNextStreamTime() {
  const now = new Date();
  const streamTime = new Date();
  streamTime.setHours(19, 30, 0, 0);
  
  // If stream already passed today, set for tomorrow
  if (now > streamTime) {
    streamTime.setDate(streamTime.getDate() + 1);
  }
  
  return streamTime;
}

function formatTimeLeft(ms) {
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0, isLive: true };
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds, isLive: false };
}

export default function StreamCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = getNextStreamTime() - new Date();
    return formatTimeLeft(diff);
  });
  const [reminded, setReminded] = useState(() => {
    return localStorage.getItem('stream_reminder') === 'true';
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = getNextStreamTime() - new Date();
      setTimeLeft(formatTimeLeft(diff));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRemind = () => {
    localStorage.setItem('stream_reminder', 'true');
    setReminded(true);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const { hours, minutes, seconds, isLive } = timeLeft;
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className={`stream-countdown ${isLive ? 'live' : ''}`}>
      <div className="countdown-header">
        <div className="countdown-icon">
          <Radio size={20} />
          {isLive && <span className="live-dot" />}
        </div>
        <div className="countdown-title">
          {isLive ? 'Эфир идёт сейчас!' : 'До эфира осталось'}
        </div>
      </div>

      {!isLive ? (
        <>
          <div className="countdown-timer">
            <div className="time-block">
              <span className="time-value">{pad(hours)}</span>
              <span className="time-label">час</span>
            </div>
            <span className="time-sep">:</span>
            <div className="time-block">
              <span className="time-value">{pad(minutes)}</span>
              <span className="time-label">мин</span>
            </div>
            <span className="time-sep">:</span>
            <div className="time-block">
              <span className="time-value">{pad(seconds)}</span>
              <span className="time-label">сек</span>
            </div>
          </div>

          <button 
            className={`remind-btn ${reminded ? 'reminded' : ''}`}
            onClick={handleRemind}
            disabled={reminded}
          >
            {reminded ? (
              <>
                <Check size={16} />
                Напомним за час
              </>
            ) : (
              <>
                <Bell size={16} />
                Напомнить
              </>
            )}
          </button>
        </>
      ) : (
        <a href="#" className="join-btn">
          <Radio size={18} />
          Присоединиться к эфиру
        </a>
      )}
    </div>
  );
}

