import { useState } from 'react';
import { Activity, Check, ChevronDown } from 'lucide-react';
import './HabitsTracker.css';

const ACTIVITY_TYPES = [
  { id: 'walking', label: 'Ходьба' },
  { id: 'running', label: 'Бег' },
  { id: 'workout', label: 'Тренировка' },
  { id: 'yoga', label: 'Йога' },
  { id: 'swimming', label: 'Плавание' },
  { id: 'cycling', label: 'Велосипед' },
  { id: 'other', label: 'Другое' }
];

export default function ActivityTracker({ totalMinutes, goal, onAdd }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('walking');
  const [customMinutes, setCustomMinutes] = useState('');
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  
  const percentage = Math.min((totalMinutes / goal) * 100, 100);
  const isComplete = totalMinutes >= goal;

  const handleQuickAdd = (minutes) => {
    onAdd(minutes, selectedType);
  };

  const handleCustomAdd = () => {
    const minutes = parseInt(customMinutes);
    if (minutes > 0) {
      onAdd(minutes, selectedType);
      setCustomMinutes('');
      setShowModal(false);
    }
  };

  const getTypeLabel = (id) => {
    return ACTIVITY_TYPES.find(t => t.id === id)?.label || 'Ходьба';
  };

  return (
    <>
      <div className={`tracker-card ${isComplete ? 'complete' : ''}`}>
        <div className="tracker-header">
          <div className="tracker-info">
            <div className="tracker-icon activity">
              {isComplete ? <Check size={22} /> : <Activity size={22} />}
            </div>
            <span className="tracker-label">Активность</span>
          </div>
          <span className={`tracker-value ${isComplete ? 'done' : ''}`}>
            {totalMinutes} мин сегодня
          </span>
        </div>

        <div className="activity-type-selector" onClick={() => setShowTypeSelect(!showTypeSelect)}>
          <span>Тип: {getTypeLabel(selectedType)}</span>
          <ChevronDown size={18} />
          
          {showTypeSelect && (
            <div className="activity-type-dropdown">
              {ACTIVITY_TYPES.map(type => (
                <div 
                  key={type.id}
                  className={`activity-type-option ${selectedType === type.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedType(type.id);
                    setShowTypeSelect(false);
                  }}
                >
                  {type.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tracker-progress">
          <div 
            className={`tracker-progress-fill activity ${isComplete ? 'complete' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="tracker-buttons">
          <button className="quick-btn" onClick={() => handleQuickAdd(15)}>
            +15 мин
          </button>
          <button className="quick-btn" onClick={() => handleQuickAdd(30)}>
            +30 мин
          </button>
          <button className="quick-btn primary" onClick={() => setShowModal(true)}>
            Записать
          </button>
        </div>
      </div>

      {showModal && (
        <div className="tracker-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="tracker-modal" onClick={e => e.stopPropagation()}>
            <h3>Записать активность</h3>
            
            <div className="modal-field">
              <label>Тип активности</label>
              <select 
                className="tracker-modal-input"
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
              >
                {ACTIVITY_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label>Длительность (минут)</label>
              <input
                type="number"
                className="tracker-modal-input"
                placeholder="30"
                value={customMinutes}
                onChange={e => setCustomMinutes(e.target.value)}
              />
            </div>

            <div className="tracker-modal-buttons">
              <button 
                className="tracker-modal-btn cancel"
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
              <button 
                className="tracker-modal-btn confirm"
                style={{ background: '#22C55E' }}
                onClick={handleCustomAdd}
              >
                Записать
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
