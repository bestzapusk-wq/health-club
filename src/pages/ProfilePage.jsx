import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, FileText, ClipboardList, MessageCircle, Info, ChevronRight, LogOut, Calendar, CheckCircle, BookOpen, Flame, Heart, Pill } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [notifications, setNotifications] = useState(false);
  const [stats, setStats] = useState({
    daysInApp: 0,
    tasksCompleted: 0,
    diaryEntries: 0,
    streak: 0
  });

  useEffect(() => {
    const data = localStorage.getItem('user_data');
    if (data) {
      setUserData(JSON.parse(data));
    }
    setNotifications(localStorage.getItem('notifications_enabled') === 'true');

    // Calculate statistics
    calculateStats();
  }, []);

  const calculateStats = () => {
    // Days in app (from registration date)
    const regDate = localStorage.getItem('registration_date');
    let daysInApp = 1;
    if (regDate) {
      const diff = Date.now() - new Date(regDate).getTime();
      daysInApp = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
    }

    // Tasks completed
    const completedTasks = localStorage.getItem('completed_daily_tasks');
    let tasksCompleted = 0;
    if (completedTasks) {
      const tasks = JSON.parse(completedTasks);
      tasksCompleted = Object.values(tasks).flat().length;
    }

    // Diary entries
    const diary = localStorage.getItem('food_diary');
    const diaryEntries = diary ? JSON.parse(diary).length : 0;

    // Calculate streak (simplified - based on consecutive days with tasks)
    const streak = Math.min(daysInApp, 7); // Placeholder

    setStats({
      daysInApp,
      tasksCompleted,
      diaryEntries,
      streak
    });
  };

  const toggleNotifications = async () => {
    if (!notifications && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotifications(true);
        localStorage.setItem('notifications_enabled', 'true');
      }
    } else {
      const newValue = !notifications;
      setNotifications(newValue);
      localStorage.setItem('notifications_enabled', String(newValue));
    }
  };

  const handleLogout = () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      localStorage.clear();
      navigate('/register');
    }
  };

  const menuItems = [
    { icon: User, title: 'Личные данные' },
    { icon: FileText, title: 'Мои анализы' },
    { icon: ClipboardList, title: 'История опросников' },
    { icon: MessageCircle, title: 'Поддержка' },
    { icon: Info, title: 'О приложении' }
  ];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {userData.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <h2 className="profile-name">{userData.name || 'Пользователь'}</h2>
        <p className="profile-phone">{userData.whatsapp || ''}</p>
      </div>

      <main className="profile-content">
        
        {/* Statistics Card */}
        <div className="stats-card">
          <h3>📊 Твоя статистика</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">
                <Calendar size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.daysInApp}</span>
                <span className="stat-label">дней в приложении</span>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <CheckCircle size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.tasksCompleted}</span>
                <span className="stat-label">выполнено заданий</span>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">
                <BookOpen size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.diaryEntries}</span>
                <span className="stat-label">записей в дневнике</span>
              </div>
            </div>
            
            <div className="stat-item highlight">
              <div className="stat-icon fire">
                <Flame size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.streak}</span>
                <span className="stat-label">дней подряд 🔥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vitamins Button */}
        <button className="vitamins-btn" onClick={() => navigate('/vitamins')}>
          <Pill size={20} />
          <span>Настроить приём витаминов</span>
          <ChevronRight size={20} />
        </button>

        {/* Notifications toggle */}
        <div className="notifications-toggle">
          <Bell size={22} />
          <span>Уведомления</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={notifications}
              onChange={toggleNotifications}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Menu */}
        <div className="profile-menu">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button 
                key={index}
                className="menu-item"
                onClick={() => alert(`Раздел "${item.title}" в разработке`)}
              >
                <Icon size={20} className="menu-icon" />
                <span className="menu-title">{item.title}</span>
                <ChevronRight size={20} className="menu-arrow" />
              </button>
            );
          })}
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          Выйти
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
