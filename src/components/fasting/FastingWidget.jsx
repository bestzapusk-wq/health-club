import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './FastingWidget.css';

// Парсим режим голодания "16:8" → { fastingHours: 16, eatingHours: 8 }
const parseMode = (mode) => {
  const [fasting, eating] = mode.split(':').map(Number);
  return { fastingHours: fasting, eatingHours: eating };
};

// Парсим время "12:00" → { hours: 12, minutes: 0 }
const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

// Форматируем секунды в "H:MM"
const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

export default function FastingWidget({ userId }) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('fasting');
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const cached = localStorage.getItem('fasting_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.isActive) {
          setSettings(parsed);
        }
      }

      const { data, error } = await supabase
        .from('fasting_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error && data.is_active) {
        const settingsData = {
          mode: data.mode,
          startTime: data.eating_window_start?.substring(0, 5) || '12:00',
          isActive: data.is_active
        };
        setSettings(settingsData);
        localStorage.setItem('fasting_settings', JSON.stringify(settingsData));
      } else if (!cached || error) {
        setSettings(null);
      }
    } catch (err) {
      console.error('Error loading fasting settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePhaseAndTime = useCallback(() => {
    if (!settings) return;

    const { fastingHours, eatingHours } = parseMode(settings.mode);
    const { hours: startHour, minutes: startMinute } = parseTime(settings.startTime);

    const now = new Date();

    const eatingStart = new Date(now);
    eatingStart.setHours(startHour, startMinute, 0, 0);

    const eatingEnd = new Date(eatingStart);
    eatingEnd.setHours(eatingStart.getHours() + eatingHours);

    const nowMs = now.getTime();
    const eatingStartMs = eatingStart.getTime();
    const eatingEndMs = eatingEnd.getTime();

    let currentPhase;
    let secondsLeft;
    let phaseProgress;

    if (nowMs >= eatingStartMs && nowMs < eatingEndMs) {
      currentPhase = 'eating';
      secondsLeft = Math.floor((eatingEndMs - nowMs) / 1000);
      const totalEatingSeconds = eatingHours * 3600;
      const elapsedEating = totalEatingSeconds - secondsLeft;
      phaseProgress = (elapsedEating / totalEatingSeconds) * 100;
    } else {
      currentPhase = 'fasting';
      
      let fastingEndTime;
      
      if (nowMs >= eatingEndMs) {
        fastingEndTime = new Date(eatingStart);
        fastingEndTime.setDate(fastingEndTime.getDate() + 1);
      } else {
        fastingEndTime = eatingStart;
      }

      secondsLeft = Math.floor((fastingEndTime.getTime() - nowMs) / 1000);
      const totalFastingSeconds = fastingHours * 3600;
      const elapsedFasting = totalFastingSeconds - secondsLeft;
      phaseProgress = (elapsedFasting / totalFastingSeconds) * 100;
    }

    setPhase(currentPhase);
    setTimeLeft(Math.max(0, secondsLeft));
    setProgress(Math.min(100, Math.max(0, phaseProgress)));
  }, [settings]);

  useEffect(() => {
    if (!settings) return;

    calculatePhaseAndTime();
    
    const interval = setInterval(() => {
      calculatePhaseAndTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [settings, calculatePhaseAndTime]);

  if (loading) {
    return null;
  }

  // Нет настроек — показываем плашку для настройки
  if (!settings || !settings.isActive) {
    return (
      <button className="fasting-card-compact setup" onClick={() => navigate('/profile/fasting')}>
        <div className="fasting-card-icon setup">
          <span>🍽️</span>
        </div>
        <div className="fasting-card-content">
          <span className="fasting-card-title">Интервальное голодание</span>
          <span className="fasting-card-subtitle">Настроить режим питания</span>
        </div>
        <ChevronRight size={20} className="fasting-card-arrow" />
      </button>
    );
  }

  // Есть настройки — показываем компактную плашку со статусом
  const isFasting = phase === 'fasting';
  const displayTime = formatTime(timeLeft);

  // Мини-прогресс бар
  const progressWidth = `${Math.min(100, progress)}%`;

  return (
    <button className={`fasting-card-compact ${phase}`} onClick={() => navigate('/food/fasting')}>
      <div className={`fasting-card-icon ${phase}`}>
        <Clock size={22} />
      </div>
      <div className="fasting-card-content">
        <div className="fasting-card-header-row">
          <span className="fasting-card-title">
            {isFasting ? 'Голодание' : 'Окно питания'}
          </span>
          <span className="fasting-card-time">{displayTime}</span>
        </div>
        <div className="fasting-card-progress">
          <div className="fasting-card-progress-bar" style={{ width: progressWidth }}></div>
        </div>
        <span className="fasting-card-subtitle">
          {isFasting ? 'Осталось до окна питания' : 'Осталось до голодания'}
        </span>
      </div>
      <ChevronRight size={20} className="fasting-card-arrow" />
    </button>
  );
}
