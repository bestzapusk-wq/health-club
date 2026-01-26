import { X } from 'lucide-react';
import Button from '../ui/Button';
import './EndFastingModal.css';

export default function EndFastingModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  elapsedHours,
  plannedHours,
  loading 
}) {
  if (!isOpen) return null;

  const percentage = Math.round((elapsedHours / plannedHours) * 100);

  return (
    <div className="end-fasting-overlay" onClick={onClose}>
      <div className="end-fasting-modal" onClick={e => e.stopPropagation()}>
        <button className="end-fasting-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="end-fasting-icon">🍽️</div>
        
        <h3>Завершить голодание?</h3>
        
        <div className="end-fasting-stats">
          <div className="stat-row">
            <span className="stat-label">Прошло:</span>
            <span className="stat-value">{elapsedHours.toFixed(1)} ч</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Из запланированных:</span>
            <span className="stat-value">{plannedHours} ч</span>
          </div>
          <div className="stat-row highlight">
            <span className="stat-label">Выполнено:</span>
            <span className="stat-value">{percentage}%</span>
          </div>
        </div>

        {percentage < 100 && (
          <p className="end-fasting-note">
            Вы можете продолжить — до цели осталось {(plannedHours - elapsedHours).toFixed(1)} ч
          </p>
        )}

        <div className="end-fasting-actions">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Продолжить
          </Button>
          <Button onClick={onConfirm} loading={loading}>
            Завершить
          </Button>
        </div>
      </div>
    </div>
  );
}
