import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, FileText, ClipboardList, MessageCircle, Info, ChevronRight, LogOut, Pill, BarChart3, Edit2 } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import Button from '../components/ui/Button';
import WeightEditModal from '../components/profile/WeightEditModal';
import ProfileAvatar from '../components/profile/ProfileAvatar';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [notifications, setNotifications] = useState(false);
  
  // Модалки
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('user_data');
    if (data) {
      setUserData(JSON.parse(data));
    }
    setNotifications(localStorage.getItem('notifications_enabled') === 'true');
  }, []);

  // Расчёт ИМТ
  const calculateBMI = () => {
    const weight = userData.weight_kg || userData.weight;
    const height = userData.height_cm || userData.height;
    
    if (!weight || !height) return null;
    
    const heightM = height / 100;
    return weight / (heightM * heightM);
  };

  const getBMIStatus = () => {
    const bmi = calculateBMI();
    if (!bmi) return { text: 'Укажите вес и рост', color: '#64748B', icon: '' };
    
    if (bmi < 18.5) {
      return { text: 'Недостаточный вес', color: '#F59E0B', icon: '⚠️' };
    } else if (bmi < 25) {
      return { text: 'Здоровый вес', color: '#10B981', icon: '✓' };
    } else if (bmi < 30) {
      return { text: 'Избыточный вес', color: '#F59E0B', icon: '⚠️' };
    } else {
      return { text: 'Ожирение', color: '#EF4444', icon: '⚠️' };
    }
  };

  const bmiStatus = getBMIStatus();

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
    localStorage.clear();
    navigate('/register');
  };

  const handleWeightSave = (updatedData) => {
    setUserData(updatedData);
  };

  const menuItems = [
    { icon: User, title: 'Личные данные', action: () => navigate('/profile/edit') },
    { icon: FileText, title: 'Мои анализы', action: () => navigate('/report') },
    { icon: ClipboardList, title: 'История опросников', comingSoon: true },
    { icon: MessageCircle, title: 'Поддержка', action: () => window.open('https://wa.me/77472370208', '_blank') },
    { icon: Info, title: 'О приложении', comingSoon: true }
  ];

  const weight = userData.weight_kg || userData.weight;

  return (
    <div className="profile-page">
      {/* Новая шапка с аватаром и данными */}
      <div className="profile-header-new">
        <div className="profile-header-content">
          <ProfileAvatar
            imageUrl={userData.avatar_url}
            name={userData.name || userData.first_name}
            size="medium"
          />
          <div className="profile-info">
            <h2 className="profile-name-new">
              {userData.name || userData.first_name || 'Пользователь'}
              {userData.last_name ? ` ${userData.last_name}` : ''}
            </h2>
            <div className="profile-weight-row">
              {weight && (
                <span className="profile-weight">{weight} кг</span>
              )}
              {weight && <span className="profile-dot">•</span>}
              <span className="profile-bmi" style={{ color: bmiStatus.color }}>
                {bmiStatus.text} {bmiStatus.icon}
              </span>
            </div>
          </div>
          <button className="edit-weight-btn" onClick={() => navigate('/profile/edit')}>
            <Edit2 size={18} />
          </button>
        </div>
      </div>

      <main className="profile-content">
        
        {/* Статистика */}
        <button className="profile-feature-card" onClick={() => navigate('/profile/stats')}>
          <div className="feature-icon stats">
            <BarChart3 size={22} />
          </div>
          <div className="feature-text">
            <span className="feature-title">Моя статистика</span>
          </div>
          <ChevronRight size={20} className="feature-arrow" />
        </button>

        {/* Витамины */}
        <button className="profile-feature-card vitamins" onClick={() => navigate('/vitamins')}>
          <div className="feature-icon vitamin">
            <Pill size={22} />
          </div>
          <div className="feature-text">
            <span className="feature-title">Настроить приём витаминов</span>
          </div>
          <ChevronRight size={20} className="feature-arrow" />
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
                onClick={() => item.comingSoon ? setShowComingSoon(item.title) : item.action?.()}
              >
                <Icon size={20} className="menu-icon" />
                <span className="menu-title">{item.title}</span>
                <ChevronRight size={20} className="menu-arrow" />
              </button>
            );
          })}
        </div>

        <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
          <LogOut size={20} />
          Выйти
        </button>
      </main>

      <BottomNav />

      {/* Модалка редактирования веса */}
      <WeightEditModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        userData={userData}
        onSave={handleWeightSave}
      />

      {/* Модалка выхода */}
      {showLogoutModal && (
        <div className="profile-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-icon">👋</div>
            <h3>Выйти из аккаунта?</h3>
            <p>Вы сможете войти снова в любое время</p>
            <div className="profile-modal-actions">
              <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleLogout}>
                Выйти
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка "скоро" */}
      {showComingSoon && (
        <div className="profile-modal-overlay" onClick={() => setShowComingSoon(null)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-icon">🚧</div>
            <h3>{showComingSoon}</h3>
            <p>Этот раздел появится в ближайшем обновлении</p>
            <Button fullWidth onClick={() => setShowComingSoon(null)}>
              Понятно
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
