import { CheckCircle, Clock } from 'lucide-react';
import './SuccessBanner.css';

export default function SuccessBanner() {
  return (
    <div className="success-banner">
      <div className="success-icon">
        <CheckCircle size={24} />
      </div>
      <div className="success-content">
        <h4>Данные отправлены!</h4>
        <p><Clock size={14} /> Результаты в течение 24 часов</p>
      </div>
    </div>
  );
}

