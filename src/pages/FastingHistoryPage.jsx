import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { fastingService } from '../lib/fastingService';
import BottomNav from '../components/layout/BottomNav';
import './FastingHistoryPage.css';

// Форматирование даты
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return 'Сегодня';
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
  
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

// Форматирование времени
const formatTime = (dateStr) => {
  if (!dateStr) return '--:--';
  return new Date(dateStr).toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Статус конфиг
const getStatusConfig = (status) => {
  switch (status) {
    case 'in_progress':
      return { icon: '⏳', label: 'В процессе', color: '#3B82F6', bg: '#EFF6FF' };
    case 'completed':
      return { icon: '✅', label: 'Выполнено', color: '#10B981', bg: '#ECFDF5' };
    case 'early':
      return { icon: '⚠️', label: 'Досрочно', color: '#F59E0B', bg: '#FFFBEB' };
    case 'missed':
      return { icon: '❌', label: 'Пропущено', color: '#EF4444', bg: '#FEF2F2' };
    default:
      return { icon: '○', label: 'Завершено', color: '#6B7280', bg: '#F9FAFB' };
  }
};

// Компонент статистики
function StatsCard({ stats, monthProgress }) {
  const monthGoal = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, monthGoal - monthProgress);
  const progressPercent = Math.min((monthProgress / monthGoal) * 100, 100);

  return (
    <div className="stats-card">
      <div className="stats-header">
        <span className="stats-icon">🔥</span>
        <span className="stats-title">Твой прогресс</span>
      </div>

      <div className="stats-grid">
        <div className="stat-item highlight">
          <span className="stat-value">{stats?.streak || 0}</span>
          <span className="stat-badge">🔥</span>
          <span className="stat-label">дней подряд</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats?.totalHours || 0}ч</span>
          <span className="stat-label">всего часов</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats?.successRate || 0}%</span>
          <span className="stat-label">успешных</span>
        </div>
      </div>

      <div className="month-progress">
        <div className="month-progress-bar">
          <div 
            className="month-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="month-progress-info">
          <span>{monthProgress} из {monthGoal} дней в этом месяце</span>
          {daysLeft > 0 && (
            <span className="days-left">До цели: {daysLeft}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Компонент календаря
function CalendarCard({ month, data, onMonthChange }) {
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getDayStatus = (day) => {
    const dateKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return data[dateKey] || null;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '🟢';
      case 'early': return '🟡';
      case 'missed': return '🔴';
      case 'in_progress': return '⏳';
      default: return null;
    }
  };

  const prevMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    if (next <= new Date()) {
      onMonthChange(next);
    }
  };

  const monthName = month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const today = new Date();
  const isCurrentMonth = month.getMonth() === today.getMonth() && 
                         month.getFullYear() === today.getFullYear();

  return (
    <div className="calendar-card">
      <div className="calendar-nav">
        <button className="calendar-nav-btn" onClick={prevMonth}>
          <ChevronLeft size={20} />
        </button>
        <span className="calendar-month-name">{monthName}</span>
        <button 
          className="calendar-nav-btn"
          onClick={nextMonth}
          disabled={isCurrentMonth}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <span key={day} className="calendar-weekday">{day}</span>
        ))}
      </div>

      <div className="calendar-days">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day empty" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const status = getDayStatus(day);
          const isToday = today.getDate() === day && 
                         today.getMonth() === month.getMonth() &&
                         today.getFullYear() === month.getFullYear();
          const isFuture = new Date(month.getFullYear(), month.getMonth(), day) > today;
          
          return (
            <div 
              key={day} 
              className={`calendar-day ${status || ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`}
            >
              <span className="calendar-day-number">{day}</span>
              {status && !isFuture && (
                <span className="calendar-day-status">{getStatusIcon(status)}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span className="legend-item">🟢 Выполнено</span>
        <span className="legend-item">🟡 Частично</span>
        <span className="legend-item">🔴 Пропущено</span>
      </div>
    </div>
  );
}

// Элемент истории
function HistoryItem({ item }) {
  const isInProgress = item.status === 'in_progress';
  const statusConfig = getStatusConfig(item.status);
  
  // Рассчитываем прогресс для in_progress
  const calcProgress = () => {
    if (!isInProgress) return item.completion_percent || 0;
    const started = new Date(item.started_at);
    const now = new Date();
    const elapsedHours = (now - started) / (1000 * 60 * 60);
    return Math.min(100, Math.round((elapsedHours / item.target_hours) * 100));
  };

  const currentProgress = calcProgress();
  const elapsedHours = isInProgress 
    ? (new Date() - new Date(item.started_at)) / (1000 * 60 * 60)
    : parseFloat(item.actual_hours || 0);

  return (
    <div className="history-item" style={{ backgroundColor: statusConfig.bg }}>
      <div className="history-item-header">
        <div className="history-item-date">
          <span className="history-status-icon">{statusConfig.icon}</span>
          <span className="history-date-text">{formatDate(item.started_at)}</span>
        </div>
        <span className="history-status-label" style={{ color: statusConfig.color }}>
          {statusConfig.label}
        </span>
      </div>

      {isInProgress ? (
        <div className="history-in-progress">
          <div className="history-progress-container">
            <div className="history-progress-bar">
              <div 
                className="history-progress-fill"
                style={{ 
                  width: `${currentProgress}%`,
                  background: statusConfig.color 
                }}
              />
            </div>
            <span className="history-progress-text">
              {Math.floor(elapsedHours)}ч/{item.target_hours}ч
            </span>
          </div>
          <div className="history-time-range">
            Начало: {formatTime(item.started_at)} → Цель: {formatTime(item.scheduled_end)}
          </div>
        </div>
      ) : (
        <div className="history-completed">
          <span className="history-fasting-type">{item.fasting_type || item.mode || '16:8'}</span>
          <span className="history-duration">
            {item.actual_hours 
              ? `${Math.floor(parseFloat(item.actual_hours))}ч ${Math.round((parseFloat(item.actual_hours) % 1) * 60)}м` 
              : '—'}
          </span>
          <span className="history-percent" style={{ color: statusConfig.color }}>
            {item.completion_percent || 0}%
          </span>
        </div>
      )}
    </div>
  );
}

// Пустое состояние
function EmptyState({ onStart }) {
  return (
    <div className="history-empty-state">
      <div className="history-empty-illustration">
        <span className="history-empty-icon">🍽</span>
      </div>
      <h3>Пока нет истории</h3>
      <p>Начни своё первое голодание и отслеживай прогресс здесь</p>
      <button className="history-start-btn" onClick={onStart}>
        Начать голодание
      </button>
    </div>
  );
}

export default function FastingHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [monthProgress, setMonthProgress] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      loadData(user.id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async (uid) => {
    try {
      const [historyData, statsData] = await Promise.all([
        fastingService.getHistory(uid, 50),
        fastingService.getStats(uid)
      ]);
      
      setHistory(historyData || []);
      
      // Подсчитываем общее количество часов
      const totalHours = (historyData || []).reduce((sum, s) => {
        return sum + parseFloat(s.actual_hours || 0);
      }, 0);
      
      setStats({
        ...statsData,
        totalHours: Math.round(totalHours)
      });

      // Строим данные для календаря
      buildCalendarData(historyData || []);
      
      // Считаем прогресс месяца
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthSessions = (historyData || []).filter(s => {
        const d = new Date(s.started_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      
      // Уникальные дни с голоданием
      const uniqueDays = new Set(thisMonthSessions.map(s => 
        new Date(s.started_at).getDate()
      ));
      setMonthProgress(uniqueDays.size);
      
    } catch (err) {
      console.error('Error loading fasting history:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildCalendarData = (sessions) => {
    const data = {};
    
    sessions.forEach(session => {
      const date = new Date(session.started_at);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      // Приоритет статусов
      if (!data[dateKey] || 
          session.status === 'in_progress' || 
          (session.status === 'completed' && data[dateKey] !== 'in_progress')) {
        data[dateKey] = session.status;
      }
    });
    
    setCalendarData(data);
  };

  return (
    <div className="fasting-history-page">
      {/* Header */}
      <header className="fh-header">
        <button className="fh-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>История голоданий</h1>
        <div style={{ width: 36 }} />
      </header>

      <main className="fh-content">
        {loading ? (
          <div className="fh-loading">Загрузка...</div>
        ) : (
          <>
            {/* Статистика */}
            <StatsCard stats={stats} monthProgress={monthProgress} />

            {/* Календарь */}
            <CalendarCard 
              month={selectedMonth}
              data={calendarData}
              onMonthChange={setSelectedMonth}
            />

            {/* Список истории */}
            <div className="history-list">
              <h3 className="history-list-title">Последние голодания</h3>
              {history.length > 0 ? (
                history.slice(0, 10).map(item => (
                  <HistoryItem key={item.id} item={item} />
                ))
              ) : (
                <EmptyState onStart={() => navigate('/food/fasting')} />
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
