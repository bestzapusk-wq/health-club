import { X, Check, AlertTriangle, Lightbulb, Target, AlertCircle, Utensils, AlertOctagon } from 'lucide-react';
import './FoodAnalysisModal.css';

export default function FoodAnalysisModal({ isOpen, onClose, foodEntries, mealName, mealColor, error }) {
  if (!isOpen || !foodEntries || foodEntries.length === 0) return null;

  // Берём последнюю запись для анализа
  const entry = foodEntries[foodEntries.length - 1];
  
  // Если нет анализа — показываем ошибку
  const analysis = entry.analysis;
  const hasError = !analysis || error;

  return (
    <div className="food-analysis-overlay" onClick={onClose}>
      <div className="food-analysis-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="food-analysis-header" style={{ background: mealColor }}>
          <div className="food-analysis-header-content">
            <span className="food-analysis-meal">🍽️ {mealName}</span>
            <h2>Анализ вашей тарелки</h2>
          </div>
          <button className="food-analysis-close" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="food-analysis-body">
          {/* Photo - всегда показываем секцию */}
          <div className="food-analysis-photo">
            {entry.photo ? (
              <img src={entry.photo} alt="Фото еды" />
            ) : (
              <div style={{padding: '20px', background: '#f0f0f0', textAlign: 'center', color: '#666'}}>
                Нет фото
              </div>
            )}
          </div>

          {/* Text description */}
          {entry.text && (
            <div className="food-analysis-description">
              <span className="food-analysis-time">{entry.time}</span>
              <p>{entry.text}</p>
            </div>
          )}

          {/* Error state */}
          {hasError ? (
            <div className="food-analysis-error">
              <AlertOctagon size={48} color="#EF4444" />
              <h3>Не удалось проанализировать</h3>
              <p>{error || 'Произошла ошибка при анализе фото. Попробуйте ещё раз.'}</p>
              <button className="food-analysis-retry-btn" onClick={onClose}>
                Закрыть
              </button>
            </div>
          ) : (
            <>
              {/* Score */}
              <div className="food-analysis-score">
                <div className="score-circle" style={{ borderColor: getScoreColor(analysis.score) }}>
                  <span className="score-value">{analysis.score}</span>
                  <span className="score-max">/{analysis.maxScore || 10}</span>
                </div>
                <div className="score-label">
                  <Target size={16} />
                  <span>Оценка приёма пищи</span>
                </div>
              </div>

          {/* Balance Chart */}
          <div className="food-analysis-section">
            <h3>📊 Баланс тарелки</h3>
            <div className="balance-bars">
              {analysis.balance.map((item, index) => (
                <div key={index} className="balance-item">
                  <div className="balance-label">
                    <span className="balance-name">{item.name}</span>
                    <span className="balance-values">
                      <strong style={{ color: item.value < item.norm ? '#EF4444' : item.color }}>
                        ~{item.value}%
                      </strong>
                      <span className="balance-norm">(норма {item.norm}%)</span>
                    </span>
                  </div>
                  <div className="balance-bar-wrap">
                    <div 
                      className="balance-bar" 
                      style={{ 
                        width: `${Math.min(item.value * 2, 100)}%`,
                        background: item.color 
                      }}
                    />
                    <div 
                      className="balance-norm-line" 
                      style={{ left: `${item.norm * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Identified Foods */}
          {analysis.identifiedFoods && analysis.identifiedFoods.length > 0 && (
            <div className="food-analysis-section identified">
              <h3><Utensils size={18} /> Распознанные продукты</h3>
              <div className="identified-foods-list">
                {analysis.identifiedFoods.map((food, index) => (
                  <span 
                    key={index} 
                    className={`food-tag ${food.is_recommended ? 'recommended' : 'neutral'}`}
                  >
                    {food.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What's Good */}
          {analysis.good && analysis.good.length > 0 && (
            <div className="food-analysis-section good">
              <h3><Check size={18} /> Что хорошо</h3>
              <ul>
                {analysis.good.map((item, index) => (
                  <li key={index}>
                    <span className="bullet good">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing */}
          {analysis.missing && analysis.missing.length > 0 && (
            <div className="food-analysis-section missing">
              <h3><AlertCircle size={18} /> Чего не хватает</h3>
              <ul>
                {analysis.missing.map((item, index) => (
                  <li key={index}>
                    <span className="bullet missing">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {analysis.concerns && analysis.concerns.length > 0 && (
            <div className="food-analysis-section warning">
              <h3><AlertTriangle size={18} /> На что обратить внимание</h3>
              <ul>
                {analysis.concerns.map((item, index) => (
                  <li key={index}>
                    <span className="bullet warning">!</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div className="food-analysis-section recommendation">
            <h3><Lightbulb size={18} /> Рекомендация</h3>
            <p>{analysis.recommendation}</p>
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="food-analysis-footer">
          <button className="food-analysis-btn" onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 8) return '#22C55E';
  if (score >= 5) return '#F59E0B';
  return '#EF4444';
}
