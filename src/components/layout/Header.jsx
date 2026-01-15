import { Leaf } from 'lucide-react';
import './Header.css';

export default function Header({ userName }) {
  const initial = userName ? userName.charAt(0).toUpperCase() : '?';
  const hour = new Date().getHours();
  
  let greeting = 'Добрый день';
  if (hour < 6) greeting = 'Доброй ночи';
  else if (hour < 12) greeting = 'Доброе утро';
  else if (hour >= 18) greeting = 'Добрый вечер';

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-main">
          <div className="header-text">
            <p className="header-greeting">{greeting} 👋</p>
            <h1 className="header-name">{userName || 'Гость'}</h1>
          </div>
          <div className="header-avatar">
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
