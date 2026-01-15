import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import './SuccessAnimation.css';

const CONFETTI_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EC4899'];

export default function SuccessAnimation({ onComplete }) {
  const [confetti] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    }))
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="success-animation">
      {/* Confetti */}
      <div className="confetti-container">
        {confetti.map(c => (
          <div 
            key={c.id}
            className="confetti"
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              backgroundColor: c.color
            }}
          />
        ))}
      </div>

      {/* Circle with checkmark */}
      <div className="success-circle">
        <Check className="success-check" size={50} strokeWidth={3} />
      </div>

      {/* Text */}
      <h2 className="success-title">Добро пожаловать!</h2>
      <p className="success-subtitle">Аккаунт создан</p>
    </div>
  );
}
