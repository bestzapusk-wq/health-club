import { Video, CheckCircle, Lock } from 'lucide-react';
import './FinalBanner.css';

export default function FinalBanner({ canSubmit, submitted, onSubmit }) {
  // Already submitted
  if (submitted) {
    return (
      <div className="final-banner submitted">
        <div className="banner-icon success">
          <CheckCircle size={28} />
        </div>
        <div className="banner-content">
          <h3>Вы зарегистрированы!</h3>
          <p>Ждите уведомление с результатами</p>
        </div>
      </div>
    );
  }

  // Can submit - main CTA
  if (canSubmit) {
    return (
      <button className="final-banner ready" onClick={onSubmit}>
        <div className="banner-icon">
          <Video size={28} />
        </div>
        <div className="banner-content">
          <h3>Попасть на эфир</h3>
          <p>и получить разбор здоровья</p>
        </div>
        <div className="banner-arrow">→</div>
        <div className="banner-shine" />
      </button>
    );
  }

  // Locked state
  return (
    <div className="final-banner locked">
      <div className="banner-icon">
        <Lock size={24} />
      </div>
      <div className="banner-content">
        <h3>Эфир с разбором здоровья</h3>
        <p>Пройдите оба шага выше</p>
      </div>
    </div>
  );
}

