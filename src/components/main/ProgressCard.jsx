import './ProgressCard.css';

export default function ProgressCard({ completed, total }) {
  const percentage = (completed / total) * 100;
  const allDone = completed === total;

  return (
    <div className={`progress-card ${allDone ? 'all-done' : ''}`}>
      <div className="progress-text">
        <span className="progress-label">
          {allDone ? '✓ Всё готово!' : 'Ваш прогресс'}
        </span>
        <span className="progress-count">{completed} из {total}</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
