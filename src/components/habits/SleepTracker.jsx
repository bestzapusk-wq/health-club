import { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';
import './HabitsTracker.css';

const QUALITY_EMOJIS = [
  { value: 1, emoji: '😫', label: 'Плохо' },
  { value: 2, emoji: '😐', label: 'Так себе' },
  { value: 3, emoji: '😊', label: 'Хорошо' },
  { value: 4, emoji: '😴', label: 'Отлично' }
];

const calculateDuration = (bedtime, wakeup) => {
  if (!bedtime || !wakeup) return 0;
  
  const [bedH, bedM] = bedtime.split(':').map(Number);
  const [wakeH, wakeM] = wakeup.split(':').map(Number);
  
  let bedMinutes = bedH * 60 + bedM;
  let wakeMinutes = wakeH * 60 + wakeM;
  
  // Если встал раньше чем лёг - значит сон через полночь
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  
  const durationMinutes = wakeMinutes - bedMinutes;
  return durationMinutes / 60;
};

const formatDuration = (hours) => {
  if (!hours) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
};

export default function SleepTracker({ data, onUpdate }) {
  const [bedtime, setBedtime] = useState(data.bedtime || '');
  const [wakeup, setWakeup] = useState(data.wakeup || '');
  const [quality, setQuality] = useState(data.quality || 0);

  useEffect(() => {
    setBedtime(data.bedtime || '');
    setWakeup(data.wakeup || '');
    setQuality(data.quality || 0);
  }, [data]);

  const handleTimeChange = (type, value) => {
    if (type === 'bedtime') {
      setBedtime(value);
      const duration = calculateDuration(value, wakeup);
      onUpdate({ bedtime: value, wakeup, duration_hours: duration, quality });
    } else {
      setWakeup(value);
      const duration = calculateDuration(bedtime, value);
      onUpdate({ bedtime, wakeup: value, duration_hours: duration, quality });
    }
  };

  const handleQualityChange = (value) => {
    setQuality(value);
    const duration = calculateDuration(bedtime, wakeup);
    onUpdate({ bedtime, wakeup, duration_hours: duration, quality: value });
  };

  const duration = calculateDuration(bedtime, wakeup);
  const isGoodSleep = duration >= 7 && duration <= 9;
  const isBadSleep = duration > 0 && duration < 6;

  return (
    <div className="tracker-card sleep-tracker">
      <div className="tracker-header">
        <div className="tracker-info">
          <div className="tracker-icon sleep">
            <Moon size={22} />
          </div>
          <span className="tracker-label">Сон</span>
        </div>
        <span className={`tracker-value ${isGoodSleep ? 'done' : ''} ${isBadSleep ? 'warning' : ''}`}>
          {formatDuration(duration)}
        </span>
      </div>

      <div className="sleep-times">
        <div className="sleep-time-field">
          <label>Лёг</label>
          <input
            type="time"
            value={bedtime}
            onChange={e => handleTimeChange('bedtime', e.target.value)}
            className="sleep-time-input"
          />
        </div>
        <div className="sleep-time-divider">→</div>
        <div className="sleep-time-field">
          <label>Встал</label>
          <input
            type="time"
            value={wakeup}
            onChange={e => handleTimeChange('wakeup', e.target.value)}
            className="sleep-time-input"
          />
        </div>
      </div>

      <div className="sleep-quality">
        <span className="sleep-quality-label">Качество сна:</span>
        <div className="sleep-quality-buttons">
          {QUALITY_EMOJIS.map(q => (
            <button
              key={q.value}
              className={`quality-btn ${quality === q.value ? 'active' : ''}`}
              onClick={() => handleQualityChange(q.value)}
              title={q.label}
            >
              {q.emoji}
            </button>
          ))}
        </div>
      </div>

      {isBadSleep && (
        <div className="sleep-warning">
          ⚠️ Рекомендуется спать 7-8 часов
        </div>
      )}
    </div>
  );
}
