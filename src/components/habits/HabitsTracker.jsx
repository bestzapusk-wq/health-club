import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AIFeedbackCard from './AIFeedbackCard';
import { useDailyFeedback } from '../../hooks/useDailyFeedback';
import './HabitsTracker.css';

/* eslint-disable react-hooks/exhaustive-deps */

const getTodayKey = () => new Date().toISOString().split('T')[0];

const formatDate = () => {
  const now = new Date();
  const day = now.getDate();
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${day} ${months[now.getMonth()]}`;
};

const WATER_STEP = 250; // мл за раз
const WATER_GOAL = 2500; // мл цель
const ACTIVITY_OPTIONS = [15, 30, 45, 60];
const SLEEP_OPTIONS = [5, 6, 7, 8, 9];

export default function HabitsTracker({ onReportChange }) {
  const navigate = useNavigate();
  const [water, setWater] = useState(0);
  const [activity, setActivity] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const todayKey = getTodayKey();
  
  // AI Feedback хук
  const reportData = { water_ml: water, activity_minutes: activity, sleep_hours: sleep };
  const { feedback, isLoading: feedbackLoading, generateFeedback } = useDailyFeedback(userId, todayKey, reportData, submitted);

  // Загрузка данных при монтировании
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUserId(parsed.id);
      loadTodayReport(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadTodayReport = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', uid)
        .eq('report_date', todayKey)
        .single();

      if (data && !error) {
        setWater(data.water_ml || 0);
        setActivity(data.activity_minutes);
        setSleep(data.sleep_hours);
        if (data.submitted_at) {
          setSubmitted(true);
          setSubmittedAt(data.submitted_at);
        }
      }
    } catch {
      // Запись не найдена — это ок
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newWater, newActivity, newSleep, isSubmit = false) => {
    if (!userId) return;

    const reportData = {
      user_id: userId,
      report_date: todayKey,
      water_ml: newWater,
      activity_minutes: newActivity,
      sleep_hours: newSleep,
      updated_at: new Date().toISOString(),
      ...(isSubmit ? { submitted_at: new Date().toISOString() } : {})
    };

    try {
      const { error } = await supabase
        .from('daily_reports')
        .upsert(reportData, { onConflict: 'user_id,report_date' });

      if (error) {
        console.error('Error saving report:', error);
      } else {
        // Уведомляем родителя об изменении
        if (onReportChange) {
          onReportChange();
        }
      }
    } catch (err) {
      console.error('Save error:', err);
    }

    // Также сохраняем в localStorage для совместимости
    const healthData = JSON.parse(localStorage.getItem('health_tracker_data') || '{"daily_data":{}}');
    healthData.daily_data[todayKey] = {
      water: { current: newWater, goal: WATER_GOAL },
      activity: { total_minutes: newActivity || 0, goal: 30 },
      sleep: { duration_hours: newSleep || 0 }
    };
    localStorage.setItem('health_tracker_data', JSON.stringify(healthData));
  };

  const getFilledCount = () => {
    let count = 0;
    if (water > 0) count++;
    if (activity !== null) count++;
    if (sleep !== null) count++;
    return count;
  };

  const filledCount = getFilledCount();
  const allFilled = filledCount === 3;

  const addWater = () => {
    if (water >= WATER_GOAL) return;
    const newWater = Math.min(water + WATER_STEP, WATER_GOAL);
    setWater(newWater);
    saveData(newWater, activity, sleep);
  };

  const removeWater = () => {
    if (water <= 0) return;
    const newWater = Math.max(water - WATER_STEP, 0);
    setWater(newWater);
    saveData(newWater, activity, sleep);
  };

  const selectActivity = (minutes) => {
    const newVal = activity === minutes ? null : minutes;
    setActivity(newVal);
    saveData(water, newVal, sleep);
  };

  const selectSleep = (hours) => {
    const newVal = sleep === hours ? null : hours;
    setSleep(newVal);
    saveData(water, activity, newVal);
  };

  const handleSubmit = async () => {
    if (filledCount === 0) return;
    await saveData(water, activity, sleep, true);
    setSubmitted(true);
    setSubmittedAt(new Date().toISOString());
    
    // Генерируем AI-фидбек
    generateFeedback();
  };

  const handleEdit = () => {
    setSubmitted(false);
  };

  // Загрузка
  if (loading) {
    return (
      <div className="diary-card loading">
        <div className="diary-loading">Загрузка...</div>
      </div>
    );
  }

  // Состояние "Отправлено"
  if (submitted) {
    const submitDate = submittedAt ? new Date(submittedAt) : new Date();
    const timeStr = submitDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    return (
      <>
        <div className="diary-card done">
          <div className="diary-done">
            <div className="done-badge">
              <Check size={20} strokeWidth={3} />
            </div>
            <div className="done-info">
              <span className="done-title">Отчёт отправлен</span>
              <span className="done-time">{formatDate()}, {timeStr}</span>
            </div>
            <div className="done-stats">
              <span>💧{water >= 1000 ? `${(water / 1000).toFixed(1)}л` : `${water}мл`}</span>
              <span>🏃{activity || 0}м</span>
              <span>😴{sleep || 0}ч</span>
            </div>
            <button className="edit-link" onClick={handleEdit}>Изменить</button>
          </div>
        </div>
        
        {/* AI-фидбек */}
        <AIFeedbackCard feedback={feedback} isLoading={feedbackLoading} />
      </>
    );
  }

  return (
    <div className="diary-card">
      {/* Header */}
      <div className="diary-header">
        <span className="diary-title">Дневник</span>
        <span className="diary-date">{formatDate()}</span>
      </div>

      {/* Water */}
      <div className="diary-section">
        <div className="section-top">
          <span className="section-label">💧 Вода</span>
          <span className="section-value">
            {water >= 1000 ? `${(water / 1000).toFixed(1)} л` : `${water} мл`} из {WATER_GOAL / 1000} л
          </span>
        </div>
        <div className="water-control">
          <button className="water-btn minus" onClick={removeWater} disabled={water <= 0}>−</button>
          <div className="water-bar">
            <div className="water-fill" style={{ width: `${(water / WATER_GOAL) * 100}%` }} />
          </div>
          <button className="water-btn plus" onClick={addWater} disabled={water >= WATER_GOAL}>+</button>
        </div>
      </div>

      {/* Activity */}
      <div className="diary-section">
        <div className="section-top">
          <span className="section-label">🏃 Активность</span>
          <span className="section-value">{activity ? `${activity} мин` : '—'}</span>
        </div>
        <div className="chips">
          {ACTIVITY_OPTIONS.map(min => (
            <button
              key={min}
              className={`chip ${activity === min ? 'active' : ''}`}
              onClick={() => selectActivity(min)}
            >
              {min}м
            </button>
          ))}
        </div>
      </div>

      {/* Sleep */}
      <div className="diary-section">
        <div className="section-top">
          <span className="section-label">😴 Сон</span>
          <span className="section-value">{sleep ? `${sleep} ч` : '—'}</span>
        </div>
        <div className="chips">
          {SLEEP_OPTIONS.map(h => (
            <button
              key={h}
              className={`chip ${sleep === h ? 'active' : ''}`}
              onClick={() => selectSleep(h)}
            >
              {h}{h === 9 ? '+' : 'ч'}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button 
        className={`submit-btn ${allFilled ? 'ready' : ''} ${filledCount === 0 ? 'disabled' : ''}`}
        onClick={handleSubmit}
        disabled={filledCount === 0}
      >
        {allFilled ? '✓ Отправить отчёт' : `Отправить (${filledCount}/3)`}
      </button>
    </div>
  );
}
