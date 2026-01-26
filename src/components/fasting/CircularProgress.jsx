import './CircularProgress.css';

export default function CircularProgress({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  color = '#F97316',
  children 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="circular-progress-svg">
        {/* Фоновый круг */}
        <circle
          className="circular-progress-bg"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Прогресс */}
        <circle
          className="circular-progress-bar"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.5s ease'
          }}
        />
      </svg>
      <div className="circular-progress-content">
        {children}
      </div>
    </div>
  );
}
