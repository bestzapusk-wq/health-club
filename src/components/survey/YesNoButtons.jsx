import { useState } from 'react';
import { Check, X } from 'lucide-react';
import './YesNoButtons.css';

export default function YesNoButtons({ image, onYes, onNo }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="yesno-container">
      {image && !imageError && (
        <div className={`yesno-image ${imageLoaded ? 'loaded' : 'loading'}`}>
          {!imageLoaded && <div className="yesno-image-skeleton" />}
          <img 
            src={image} 
            alt="Symptom illustration" 
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
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
