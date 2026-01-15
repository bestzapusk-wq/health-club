import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Utensils, BookOpen, User } from 'lucide-react';
import './BottomNav.css';

const tabs = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/report', icon: FileText, label: 'Разбор' },
  { path: '/food', icon: Utensils, label: 'Еда' },
  { path: '/materials', icon: BookOpen, label: 'Материалы' },
  { path: '/profile', icon: User, label: 'Профиль' }
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
        return (
          <button
            key={tab.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <Icon className="nav-icon" size={22} />
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
