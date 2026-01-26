// src/pages/StatsPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Flame, Trophy, Target, Zap, 
  MapPin, Award, Book, Droplets, Calendar, ChevronRight
} from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { getLevelInfo } from '../data/xpSystem';
import { ACHIEVEMENTS, RARITY_COLORS } from '../data/achievements';
import './StatsPage.css';

const StatsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [cityRanking, setCityRanking] = useState([]);
  const [userCityRank, setUserCityRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Загружаем данные из localStorage (демо режим)
    // В продакшене здесь будет загрузка из Supabase
    
    const userData = localStorage.getItem('user_data');
    const profile = userData ? JSON.parse(userData) : {};
    
    // Демо статистика
    const demoStats = {
      name: profile.name || profile.first_name || 'Пользователь',
      city: profile.city || null,
      total_xp: parseInt(localStorage.getItem('user_xp') || '250'),
      streak_current: parseInt(localStorage.getItem('streak_current') || '3'),
      streak_best: parseInt(localStorage.getItem('streak_best') || '7'),
      lessonsCompleted: parseInt(localStorage.getItem('lessons_completed') || '5'),
      tasksSubmitted: parseInt(localStorage.getItem('tasks_submitted') || '3'),
      mealsLogged: parseInt(localStorage.getItem('meals_logged') || '12'),
      total_water_ml: parseInt(localStorage.getItem('total_water') || '15000'),
    };
    
    setStats(demoStats);
    
    // Демо достижения (первые 3 получены)
    const earnedAchievements = ['streak_3', 'first_lesson', 'first_meal'];
    setAchievements(earnedAchievements);
    
    // Демо рейтинг городов
    const demoCityRanking = [
      { city: 'Алматы', total_users: 156, total_xp: 245000 },
      { city: 'Астана', total_users: 98, total_xp: 187000 },
      { city: 'Шымкент', total_users: 45, total_xp: 78000 },
      { city: 'Караганда', total_users: 34, total_xp: 56000 },
      { city: 'Актобе', total_users: 28, total_xp: 42000 },
    ];
    setCityRanking(demoCityRanking);
    
    if (demoStats.city) {
      setUserCityRank({ rank: 23, total: 156, city: demoStats.city });
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="stats-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Загрузка статистики...</span>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(stats?.total_xp || 0);

  return (
    <div className="stats-page">
      {/* Шапка */}
      <header className="stats-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Моя статистика</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="stats-content">
        {/* Уровень и XP */}
        <section className="level-section">
          <div className="level-card">
            <div className="level-icon">{levelInfo.icon}</div>
            <div className="level-info">
              <span className="level-title">{levelInfo.title}</span>
              <span className="level-number">Уровень {levelInfo.level}</span>
            </div>
            <div className="xp-badge">
              <Zap size={16} />
              <span>{stats?.total_xp || 0} XP</span>
            </div>
          </div>
          
          {levelInfo.nextLevel && (
            <div className="level-progress-wrap">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
              <span className="progress-text">
                {Math.round(levelInfo.progress)}% до уровня "{levelInfo.nextLevel.title}"
              </span>
            </div>
          )}
        </section>

        {/* Streak */}
        <section className="streak-section">
          <div className="streak-card">
            <div className="streak-icon">
              <Flame size={32} />
            </div>
            <div className="streak-info">
              <span className="streak-count">{stats?.streak_current || 0}</span>
              <span className="streak-label">дней подряд</span>
            </div>
            <div className="streak-best">
              <Trophy size={16} />
              <span>Лучший: {stats?.streak_best || 0}</span>
            </div>
          </div>
          
          {/* Визуализация недели */}
          <div className="week-dots">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => {
              const isActive = i < (stats?.streak_current % 7 || 0);
              return (
                <div key={i} className="day-dot">
                  <div className={`dot ${isActive ? 'active' : ''}`}>
                    {isActive && <Flame size={14} />}
                  </div>
                  <span>{day}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Основная статистика */}
        <section className="main-stats">
          <h2>Ваш прогресс</h2>
          <div className="stats-grid">
            <StatCard
              icon={<Book size={24} />}
              value={stats?.lessonsCompleted || 0}
              label="уроков пройдено"
              total={40}
              color="#4CAF50"
            />
            <StatCard
              icon={<Target size={24} />}
              value={stats?.tasksSubmitted || 0}
              label="заданий выполнено"
              color="#FF9800"
            />
            <StatCard
              icon={<Droplets size={24} />}
              value={`${((stats?.total_water_ml || 0) / 1000).toFixed(1)}л`}
              label="воды выпито"
              color="#2196F3"
            />
            <StatCard
              icon={<Calendar size={24} />}
              value={stats?.mealsLogged || 0}
              label="записей в дневнике"
              color="#9C27B0"
            />
          </div>
        </section>

        {/* Рейтинг городов */}
        <section className="city-section">
          <div className="section-header">
            <h2><MapPin size={20} /> Рейтинг городов</h2>
            {userCityRank && (
              <span className="your-rank">
                Вы #{userCityRank.rank} в {userCityRank.city}
              </span>
            )}
          </div>

          <div className="city-ranking">
            {cityRanking.map((city, index) => (
              <div 
                key={city.city} 
                className={`city-row ${city.city === userCityRank?.city ? 'my-city' : ''}`}
              >
                <div className="city-rank">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </div>
                <div className="city-info">
                  <span className="city-name">{city.city}</span>
                  <span className="city-users">{city.total_users} участников</span>
                </div>
                <div className="city-xp">
                  <Zap size={14} />
                  {(city.total_xp / 1000).toFixed(1)}K
                </div>
              </div>
            ))}
          </div>

          {!stats?.city && (
            <button 
              className="set-city-btn"
              onClick={() => navigate('/profile/edit')}
            >
              <MapPin size={18} />
              Укажите свой город
            </button>
          )}
        </section>

        {/* Достижения */}
        <section className="achievements-section">
          <div className="section-header">
            <h2><Award size={20} /> Достижения</h2>
            <span className="achievements-count">
              {achievements.length} / {ACHIEVEMENTS.length}
            </span>
          </div>

          <div className="achievements-grid">
            {ACHIEVEMENTS.slice(0, 12).map(achievement => {
              const earned = achievements.includes(achievement.id);
              const rarity = RARITY_COLORS[achievement.rarity];
              
              return (
                <div 
                  key={achievement.id}
                  className={`achievement-card ${earned ? 'earned' : 'locked'} ${achievement.rarity}`}
                  style={{ 
                    '--rarity-bg': rarity.bg,
                    '--rarity-text': rarity.text,
                    '--rarity-border': rarity.border
                  }}
                >
                  <div className="achievement-icon">
                    {earned ? achievement.icon : '🔒'}
                  </div>
                  <span className="achievement-title">{achievement.title}</span>
                  {earned && (
                    <span className="achievement-xp">+{achievement.xpReward} XP</span>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            className="view-all-btn"
            onClick={() => navigate('/profile/achievements')}
          >
            Все достижения
            <ChevronRight size={18} />
          </button>
        </section>

        {/* Мотивационное сообщение */}
        <section className="motivation-section">
          <div className="motivation-card">
            <span className="motivation-emoji">💪</span>
            <p className="motivation-text">
              {getMotivationMessage(stats)}
            </p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

// Компонент карточки статистики
const StatCard = ({ icon, value, label, total, color }) => (
  <div className="stat-card" style={{ '--accent-color': color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">
      {value}
      {total && <span className="stat-total">/{total}</span>}
    </div>
    <div className="stat-label">{label}</div>
    {total && (
      <div className="stat-progress">
        <div 
          className="stat-progress-fill"
          style={{ width: `${(parseInt(value) / total) * 100}%` }}
        />
      </div>
    )}
  </div>
);

// Мотивационные сообщения
const getMotivationMessage = (stats) => {
  if (!stats) return "Начните свой путь к здоровью!";
  
  if (stats.streak_current >= 7) {
    return `Невероятно! ${stats.streak_current} дней подряд — вы формируете привычку! 🔥`;
  }
  if (stats.streak_current >= 3) {
    return "Отличный старт! Ещё немного и будет неделя! 💪";
  }
  if (stats.lessonsCompleted >= 20) {
    return "Вы прошли половину обучения — так держать! 🎯";
  }
  if (stats.lessonsCompleted >= 10) {
    return "10 уроков позади — знания накапливаются! 📚";
  }
  if (stats.total_xp >= 1000) {
    return "Первая тысяча XP! Вы на правильном пути! ⭐";
  }
  return "Каждый шаг приближает вас к цели! 🚀";
};

export default StatsPage;
