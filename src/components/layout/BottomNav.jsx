import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Utensils, User, CalendarCheck } from 'lucide-react';
import './BottomNav.css';

const tabs = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/report', icon: FileText, label: 'Здоровье' },
  { path: '/learning', icon: CalendarCheck, label: 'Мой план', primary: true },
  { path: '/food', icon: Utensils, label: 'Еда' },
  { path: '/profile', icon: User, label: 'Профиль' }
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        // Для главной "/" проверяем точное совпадение, иначе она будет активна везде
        const isActive = tab.path === '/' 
          ? location.pathname === '/' 
          : location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
        return (
          <button
            key={tab.path}
            className={`nav-item ${isActive ? 'active' : ''} ${tab.primary ? 'primary' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <div className={`nav-icon-wrap ${tab.primary ? 'primary-wrap' : ''}`}>
              <Icon className="nav-icon" size={tab.primary ? 24 : 22} />
            </div>
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
