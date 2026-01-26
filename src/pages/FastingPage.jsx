import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, BarChart3, StopCircle } from 'lucide-react';
import { fastingService } from '../lib/fastingService';
import BottomNav from '../components/layout/BottomNav';
import './FastingPage.css';

// Мотивационные сообщения
const motivationMessages = {
  fasting: [
    { min: 0, max: 5, emoji: '🚀', text: 'Отличный старт! Первый час — самый важный.' },
    { min: 5, max: 15, emoji: '💪', text: 'Инсулин снижается, тело готовится к сжиганию жира.' },
    { min: 15, max: 30, emoji: '🔥', text: 'Режим сжигания жира активирован!' },
    { min: 30, max: 50, emoji: '⚡', text: 'Половина пути! Аутофагия начинает работать.' },
    { min: 50, max: 70, emoji: '🧬', text: 'Клетки активно обновляются. Ты делаешь это!' },
    { min: 70, max: 90, emoji: '🏆', text: 'Финишная прямая! Осталось совсем немного.' },
    { min: 90, max: 100, emoji: '🎉', text: 'Почти готово! Ты — настоящий чемпион!' },
    { min: 100, max: Infinity, emoji: '👑', text: 'Цель достигнута! Невероятно!' },
  ]
};

// Получить мотивацию по прогрессу
const getMotivation = (progressPercent) => {
  const messages = motivationMessages.fasting;
  const message = messages.find(m => progressPercent >= m.min && progressPercent < m.max);
  return message || messages[messages.length - 1];
};

// Форматирование времени HH:MM:SS
const formatTimeHMS = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Форматировать часы коротко
const formatHoursShort = (hours) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}м`;
  if (m > 0) return `${h}ч ${m}м`;
  return `${h}ч`;
};

export default function FastingPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [settings, setSettings] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);

  // Загрузка данных
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user.id);
      loadData(user.id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async (uid) => {
    try {
      // Загружаем настройки
      const settingsData = await fastingService.getSettings(uid);
      if (settingsData) {
        setSettings({
          mode: settingsData.mode || settingsData.fasting_type || '16:8',
          isActive: settingsData.is_active
        });
      }

      // Загружаем текущую сессию
      const session = await fastingService.getCurrentSession(uid);
      setCurrentSession(session);

      // Загружаем статистику для streak
      const stats = await fastingService.getStats(uid);
      setStreak(stats?.streak || 0);
    } catch (err) {
      console.error('Error loading fasting data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Таймер
  const updateTimer = useCallback(() => {
    if (!currentSession) return;

    const started = new Date(currentSession.started_at);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - started) / 1000);
    const targetSeconds = currentSession.target_hours * 3600;
    const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
    const progressPercent = Math.min(100, (elapsedSeconds / targetSeconds) * 100);

    setElapsed(elapsedSeconds);
    setRemaining(remainingSeconds);
    setProgress(progressPercent);
  }, [currentSession]);

  useEffect(() => {
    if (!currentSession) return;

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentSession, updateTimer]);

  // Начать голодание
  const handleStartFasting = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      const mode = settings?.mode || '16:8';
      const targetHours = parseInt(mode.split(':')[0]) || 16;

      const session = await fastingService.startSession(userId, {
        fasting_type: mode,
        target_hours: targetHours
      });

      setCurrentSession(session);
    } catch (err) {
      console.error('Error starting fasting:', err);
    } finally {
      setSaving(false);
    }
  };

  // Завершить голодание
  const handleEndFasting = async () => {
    if (!currentSession) return;
    setSaving(true);

    try {
      await fastingService.endSession(currentSession.id);
      setCurrentSession(null);
      setElapsed(0);
      setRemaining(0);
      setProgress(0);
      setShowEndModal(false);
      
      // Обновляем streak
      const stats = await fastingService.getStats(userId);
      setStreak(stats?.streak || 0);
    } catch (err) {
      console.error('Error ending fasting:', err);
    } finally {
      setSaving(false);
    }
  };

  const getElapsedHours = () => elapsed / 3600;
  const targetHours = currentSession?.target_hours || parseInt(settings?.mode?.split(':')[0]) || 16;

  // Время окончания
  const getEndTime = () => {
    if (!currentSession) return '--:--';
    const started = new Date(currentSession.started_at);
    const endTime = new Date(started.getTime() + targetHours * 3600 * 1000);
    return endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="fasting-screen">
        <div className="fasting-loading">Загрузка...</div>
        <BottomNav />
      </div>
    );
  }

  // Если нет настроек — показываем приглашение настроить
  if (!settings) {
    return (
      <div className="fasting-screen">
        <header className="fasting-header">
          <button className="back-btn" onClick={() => navigate('/food')}>
            <ArrowLeft size={24} />
          </button>
          <h1>Голодание</h1>
          <div style={{ width: 80 }} />
        </header>

        <main className="fasting-content">
          <div className="fasting-not-active">
            <div className="empty-icon">🍽</div>
            <h2>Голодание не настроено</h2>
            <p>Настройте режим интервального голодания</p>
            <button 
              className="setup-btn"
              onClick={() => navigate('/profile/fasting')}
            >
              Настроить голодание
            </button>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  // SVG параметры
  const svgSize = 240;
  const strokeWidth = 12;
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;
  const dotRotation = (progress / 100) * 360;

  const motivation = getMotivation(progress);

  return (
    <div className="fasting-screen">
      {/* Header */}
      <header className="fasting-header">
        <button className="back-btn" onClick={() => navigate('/food')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Голодание</h1>
        <div className="header-actions">
          <button 
            className="icon-btn"
            onClick={() => navigate('/profile/fasting')}
            title="Настройки"
          >
            <Settings size={20} />
          </button>
          <button 
            className="icon-btn"
            onClick={() => navigate('/food/fasting/history')}
            title="История"
          >
            <BarChart3 size={20} />
          </button>
        </div>
      </header>

      <main className="fasting-content">
        {currentSession ? (
          /* Активная сессия */
          <>
            {/* Таймер */}
            <div className="timer-container">
              <div className="timer-circle">
                <svg className="progress-ring" viewBox={`0 0 ${svgSize} ${svgSize}`}>
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FCD34D" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FEF3C7" />
                      <stop offset="100%" stopColor="#FDE68A" />
                    </linearGradient>
                  </defs>
                  
                  {/* Фоновый круг */}
                  <circle
                    cx={svgSize / 2}
                    cy={svgSize / 2}
                    r="100"
                    fill="url(#bgGradient)"
                  />
                  
                  {/* Трек прогресса */}
                  <circle
                    cx={svgSize / 2}
                    cy={svgSize / 2}
                    r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                  />
                  
                  {/* Прогресс */}
                  <circle
                    className="progress-circle"
                    cx={svgSize / 2}
                    cy={svgSize / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={strokeDasharray}
                    transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
                  />
                  
                  {/* Точка на прогрессе */}
                  <circle
                    className="progress-dot"
                    cx={svgSize / 2}
                    cy={strokeWidth / 2 + 4}
                    r="8"
                    fill="#F59E0B"
                    transform={`rotate(${dotRotation} ${svgSize / 2} ${svgSize / 2})`}
                  />
                </svg>

                {/* Контент внутри круга */}
                <div className="timer-content">
                  <div className="timer-status">
                    <span className="status-icon">🔥</span>
                    <span className="status-text">ПОСТ</span>
                  </div>
                  <div className="timer-time">
                    {progress >= 100 ? formatTimeHMS(elapsed) : formatTimeHMS(remaining)}
                  </div>
                  <div className="timer-label">
                    {progress >= 100 ? 'пройдено' : 'осталось'}
                  </div>
                </div>
              </div>

              {/* Режим */}
              <div className="mode-label">Режим {settings.mode}</div>

              {/* Линейный прогресс */}
              <div className="linear-progress">
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                  <div 
                    className="progress-marker"
                    style={{ left: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="progress-labels">
                  <span>0ч</span>
                  <span className="current-time">{formatHoursShort(getElapsedHours())}</span>
                  <span>{targetHours}ч</span>
                </div>
              </div>
            </div>

            {/* Мотивация */}
            <div className="motivation-card">
              <span className="motivation-emoji">{motivation.emoji}</span>
              <p className="motivation-text">{motivation.text}</p>
            </div>

            {/* Статистика сегодня */}
            <div className="today-stats">
              <div className="stat-card start">
                <span className="stat-icon">🟢</span>
                <span className="stat-value">
                  {new Date(currentSession.started_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="stat-label">начало</span>
              </div>
              <div className="stat-card current">
                <span className="stat-icon">⏱</span>
                <span className="stat-value">{formatHoursShort(getElapsedHours())}</span>
                <span className="stat-label">прошло</span>
              </div>
              <div className="stat-card goal">
                <span className="stat-icon">🏁</span>
                <span className="stat-value">{getEndTime()}</span>
                <span className="stat-label">цель</span>
              </div>
            </div>

            {/* Кнопки */}
            <div className="fasting-actions">
              <button 
                className="end-btn"
                onClick={() => setShowEndModal(true)}
                disabled={saving}
              >
                <StopCircle size={20} />
                Завершить голодание
              </button>
              
              <button 
                className="history-btn"
                onClick={() => navigate('/food/fasting/history')}
              >
                <BarChart3 size={18} />
                История
                {streak > 0 && (
                  <span className="streak-badge">🔥 {streak} дней</span>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Нет активной сессии */
          <>
            <div className="idle-container">
              <div className="idle-circle">
                <span className="idle-icon">🍽</span>
                <span className="idle-text">Готовы к голоданию?</span>
              </div>
            </div>

            <div className="idle-info">
              <p>Начните {targetHours}-часовое голодание в режиме {settings.mode}</p>
            </div>

            <div className="fasting-actions">
              <button 
                className="start-btn"
                onClick={handleStartFasting}
                disabled={saving}
              >
                {saving ? 'Запуск...' : '▶ Начать голодание'}
              </button>
              
              <button 
                className="history-btn"
                onClick={() => navigate('/food/fasting/history')}
              >
                <BarChart3 size={18} />
                История
                {streak > 0 && (
                  <span className="streak-badge">🔥 {streak} дней</span>
                )}
              </button>
            </div>
          </>
        )}
      </main>

      <BottomNav />

      {/* Модалка завершения */}
      {showEndModal && (
        <div className="modal-overlay" onClick={() => setShowEndModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            
            <div className="end-modal-content">
              {progress >= 100 ? (
                <>
                  <div className="modal-icon success">🎉</div>
                  <h2>Отлично!</h2>
                  <p>Вы успешно завершили голодание</p>
                </>
              ) : (
                <>
                  <div className="modal-icon warning">⚠️</div>
                  <h2>Завершить досрочно?</h2>
                  <p>Вы прошли {Math.round(progress)}% от цели</p>
                </>
              )}

              <div className="modal-stats">
                <div className="modal-stat">
                  <span className="stat-value">{formatHoursShort(getElapsedHours())}</span>
                  <span className="stat-label">пройдено</span>
                </div>
                <div className="modal-stat">
                  <span className="stat-value">{targetHours}ч</span>
                  <span className="stat-label">цель</span>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="modal-confirm-btn"
                  onClick={handleEndFasting}
                  disabled={saving}
                >
                  {saving ? 'Сохранение...' : (progress >= 100 ? 'Завершить' : 'Да, завершить')}
                </button>
                {progress < 100 && (
                  <button 
                    className="modal-cancel-btn"
                    onClick={() => setShowEndModal(false)}
                  >
                    Продолжить голодание
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
