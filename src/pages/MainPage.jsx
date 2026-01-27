import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, ChevronDown, ChevronUp, Check } from 'lucide-react';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import ContentFeed from '../components/feed/ContentFeed';
import AIFeedbackCard from '../components/habits/AIFeedbackCard';
import { useDailyFeedback } from '../hooks/useDailyFeedback';
import { supabase } from '../lib/supabase';
import './MainPage.css';

const getTodayKey = () => new Date().toISOString().split('T')[0];

const formatDate = () => {
  const now = new Date();
  const day = now.getDate();
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${day} ${months[now.getMonth()]}`;
};

const WATER_STEP = 250;
const WATER_GOAL = 2500;
const ACTIVITY_OPTIONS = [15, 30, 45, 60];
const SLEEP_OPTIONS = [5, 6, 7, 8, 9];

// Склонение для дней
const getStreakText = (count) => {
  if (count === 0) return 'Начните сегодня!';
  if (count === 1) return 'Один день подряд';
  if (count === 2) return 'Два дня подряд';
  if (count === 3) return 'Три дня подряд';
  if (count === 4) return 'Четыре дня подряд';
  if (count === 5) return 'Пять дней подряд';
  if (count === 6) return 'Шесть дней подряд';
  if (count >= 7) return 'Семь дней! 🎁';
  return `${count} дней подряд`;
};

export default function MainPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  
  // Streak state
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(true);
  
  // Diary state
  const [water, setWater] = useState(0);
  const [activity, setActivity] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [diaryLoading, setDiaryLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  
  const todayKey = getTodayKey();
  const allCompleted = currentStreak >= 7;
  
  // AI Feedback хук
  const reportData = { water_ml: water, activity_minutes: activity, sleep_hours: sleep };
  const { feedback, isLoading: feedbackLoading, generateFeedback } = useDailyFeedback(userId, todayKey, reportData, submitted);

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    
    if (!userData) {
      navigate('/register');
      return;
    }

    const parsedUserData = JSON.parse(userData);
    setUserId(parsedUserData.id);
    
    const name = localStorage.getItem('user_name');
    setUserName(name || 'Пользователь');

    if (parsedUserData.id) {
      loadAllData(parsedUserData.id);
    } else {
      setStreakLoading(false);
      setDiaryLoading(false);
    }
  }, [navigate]);

  const loadAllData = async (uid) => {
    try {
      const todayKey = getTodayKey();
      
      // Загружаем streak
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('report_date, submitted_at')
        .eq('user_id', uid)
        .not('submitted_at', 'is', null)
        .order('report_date', { ascending: true });

      const completedCount = Math.min(reports?.length || 0, 7);
      setCurrentStreak(completedCount);
      
      // Загружаем сегодняшний отчёт
      const { data: todayReport } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', uid)
        .eq('report_date', todayKey)
        .single();

      if (todayReport) {
        setWater(todayReport.water_ml || 0);
        setActivity(todayReport.activity_minutes);
        setSleep(todayReport.sleep_hours);
        if (todayReport.submitted_at) {
          setSubmitted(true);
          setSubmittedAt(todayReport.submitted_at);
        }
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setStreakLoading(false);
      setDiaryLoading(false);
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
      await supabase
        .from('daily_reports')
        .upsert(reportData, { onConflict: 'user_id,report_date' });
    } catch (err) {
      console.error('Save error:', err);
    }
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
    setCurrentStreak(prev => Math.min(prev + 1, 7));
    setExpanded(false);
    generateFeedback();
  };

  const handleEdit = () => {
    setSubmitted(false);
    setExpanded(true);
  };

  const isLoading = streakLoading || diaryLoading;

  return (
    <div className="main-page">
      <Header userName={userName} />
      
      <main className="main-content">
        <div className="main-container">
          
          {/* Объединённый блок: Streak + Дневник */}
          <div className={`daily-block ${submitted ? 'submitted' : ''} ${allCompleted ? 'all-done' : ''}`}>
            
            {/* Заголовок с прогрессом */}
            <div 
              className="daily-block-header"
              onClick={() => !isLoading && setExpanded(!expanded)}
            >
              <div className="daily-block-left">
                {submitted ? (
                  <div className="done-check">
                    <Check size={16} strokeWidth={3} />
                  </div>
                ) : (
                  <Gift size={18} className="gift-icon" />
                )}
                <div className="daily-block-text">
                  <span className="daily-title">
                    {isLoading ? 'Загрузка...' : (
                      submitted ? 'Отчёт отправлен' : 'Дневник'
                    )}
                  </span>
                  <span className="daily-subtitle">
                    {isLoading ? '' : (
                      submitted 
                        ? `💧${water >= 1000 ? `${(water / 1000).toFixed(1)}л` : `${water}мл`} · 🏃${activity || 0}м · 😴${sleep || 0}ч`
                        : getStreakText(currentStreak)
                    )}
                  </span>
                </div>
              </div>
              
              <div className="daily-block-right">
                {!isLoading && !allCompleted && (
                  <div className="streak-badge">
                    <span>{currentStreak}</span>
                    <span className="streak-of">/7</span>
                  </div>
                )}
                {allCompleted && (
                  <button 
                    className="claim-gift-btn"
                    onClick={(e) => { e.stopPropagation(); navigate('/materials'); }}
                  >
                    <Gift size={14} />
                    Подарок!
                  </button>
                )}
                {!submitted && !isLoading && (
                  expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                )}
                {submitted && (
                  <button 
                    className="edit-btn"
                    onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                  >
                    Изменить
                  </button>
                )}
              </div>
            </div>

            {/* Раскрывающийся дневник */}
            {expanded && !submitted && (
              <div className="daily-block-content">
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
            )}
          </div>

          {/* AI-фидбек (появляется после отправки) */}
          {submitted && <AIFeedbackCard feedback={feedback} isLoading={feedbackLoading} />}

          {/* Лента контента от Алишера */}
          <ContentFeed userId={userId} />

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
