import { useState } from 'react';
import { Droplets, Check } from 'lucide-react';
import './HabitsTracker.css';

export default function WaterTracker({ current, goal, onAdd }) {
  const [showModal, setShowModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  
  const percentage = Math.min((current / goal) * 100, 100);
  const isComplete = current >= goal;
  const liters = (current / 1000).toFixed(1);
  const goalLiters = (goal / 1000).toFixed(1);

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount);
    if (amount > 0) {
      onAdd(amount);
      setCustomAmount('');
      setShowModal(false);
    }
  };

  return (
    <>
      <div className={`tracker-card ${isComplete ? 'complete' : ''}`}>
        <div className="tracker-header">
          <div className="tracker-info">
            <div className="tracker-icon water">
              {isComplete ? <Check size={22} /> : <Droplets size={22} />}
            </div>
            <span className="tracker-label">Вода</span>
          </div>
          <span className={`tracker-value ${isComplete ? 'done' : ''}`}>
            {liters} / {goalLiters} л
          </span>
        </div>

        <div className="tracker-progress">
          <div 
            className={`tracker-progress-fill water ${isComplete ? 'complete' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="tracker-buttons">
          <button className="quick-btn" onClick={() => onAdd(250)}>
            +250 мл
          </button>
          <button className="quick-btn" onClick={() => onAdd(500)}>
            +500 мл
          </button>
          <button className="quick-btn primary" onClick={() => setShowModal(true)}>
            Свой
          </button>
        </div>
      </div>

      {showModal && (
        <div className="tracker-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="tracker-modal" onClick={e => e.stopPropagation()}>
            <h3>Добавить воду</h3>
            <input
              type="number"
              className="tracker-modal-input"
              placeholder="Количество в мл"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              autoFocus
            />
            <div className="tracker-modal-buttons">
              <button 
                className="tracker-modal-btn cancel"
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
              <button 
                className="tracker-modal-btn confirm"
                onClick={handleCustomAdd}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
