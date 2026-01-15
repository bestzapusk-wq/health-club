import { Leaf } from 'lucide-react';
import './SplashScreen.css';

export default function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <Leaf size={48} strokeWidth={2} />
        </div>
        <h1 className="splash-title">Health Club</h1>
        <p className="splash-subtitle">Ваш путь к здоровью</p>
        <div className="splash-spinner"></div>
      </div>
    </div>
  );
}
