import './SuccessOverlay.css';

export default function SuccessOverlay() {
  return (
    <div className="success-overlay">
      <div className="success-content">
        <div className="success-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="white"/>
            <path 
              d="M14 24L21 31L34 18" 
              stroke="#22C55E" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="success-check"
            />
          </svg>
        </div>
        <h2 className="success-title">Добро пожаловать!</h2>
        <p className="success-text">Регистрация прошла успешно</p>
      </div>
    </div>
  );
}

