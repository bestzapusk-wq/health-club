import { useNavigate } from 'react-router-dom';
import { Pill, ChevronRight } from 'lucide-react';
import './HabitsTracker.css';

export default function VitaminButton() {
  const navigate = useNavigate();

  return (
    <button className="vitamin-button" onClick={() => navigate('/vitamins')}>
      <div className="vitamin-icon">
        <Pill size={22} />
      </div>
      <div className="vitamin-text">
        <span className="vitamin-title">Напоминания о витаминах</span>
        <span className="vitamin-subtitle">Не забывайте принимать вовремя</span>
      </div>
      <ChevronRight size={20} className="vitamin-arrow" />
    </button>
  );
}
