import { Check, X } from 'lucide-react';
import './YesNoButtons.css';

export default function YesNoButtons({ image, onYes, onNo }) {
  return (
    <div className="yesno-container">
      {image && (
        <div className="yesno-image">
          <img src={image} alt="Symptom illustration" loading="lazy" />
        </div>
      )}
      <div className="yesno-buttons">
        <button className="yesno-btn yesno-yes" onClick={onYes}>
          <Check size={20} />
          Да, это про меня
        </button>
        <button className="yesno-btn yesno-no" onClick={onNo}>
          <X size={20} />
          Нет, не про меня
        </button>
      </div>
    </div>
  );
}
