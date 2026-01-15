import './ProgressBar.css';

export default function ProgressBar({ 
  value = 0, 
  max = 100, 
  size = 'md',
  showLabel = false,
  className = '' 
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`progress-wrapper ${className}`}>
      <div className={`progress-bar progress-${size}`}>
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-label">{Math.round(percentage)}%</span>
      )}
    </div>
  );
}

