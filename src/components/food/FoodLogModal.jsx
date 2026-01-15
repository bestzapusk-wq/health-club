import { useState, useRef } from 'react';
import { X, Camera, Image, Type, Sunrise, Sun, Moon, Apple, ArrowLeft, Check } from 'lucide-react';
import './FoodLogModal.css';

const MEAL_TYPES = [
  { id: 'breakfast', icon: Sunrise, label: 'Завтрак', color: '#F59E0B' },
  { id: 'lunch', icon: Sun, label: 'Обед', color: '#22C55E' },
  { id: 'dinner', icon: Moon, label: 'Ужин', color: '#8B5CF6' },
  { id: 'snack', icon: Apple, label: 'Перекус', color: '#EC4899' },
];

export default function FoodLogModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [mealType, setMealType] = useState(null);
  const [content, setContent] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const resetAndClose = () => {
    setStep(1);
    setMealType(null);
    setContent(null);
    setTextInput('');
    setShowTextInput(false);
    onClose();
  };

  const handleSelectMeal = (type) => {
    setMealType(type);
    setStep(2);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        setContent({ type: 'photo', data: imageData });
        saveMeal({ type: 'photo', data: imageData });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const contentData = { type: 'text', data: textInput.trim() };
      setContent(contentData);
      saveMeal(contentData);
      setShowTextInput(false);
    }
  };

  const saveMeal = (contentData) => {
    const meals = JSON.parse(localStorage.getItem('food_diary') || '[]');
    const newMeal = {
      id: Date.now(),
      type: mealType.id,
      label: mealType.label,
      content: contentData,
      date: new Date().toISOString(),
    };
    meals.unshift(newMeal);
    localStorage.setItem('food_diary', JSON.stringify(meals));
    setContent(contentData);
    setStep(3);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div className="food-log-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Скрытые инпуты для файлов */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* ШАГ 1: Выбор типа приёма пищи */}
        {step === 1 && (
          <>
            <div className="modal-header">
              <h3>Что записываем?</h3>
              <button className="close-btn" onClick={resetAndClose}>
                <X size={24} />
              </button>
            </div>

            <div className="meal-types-grid">
              {MEAL_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    className="meal-type-btn"
                    style={{ '--meal-color': type.color }}
                    onClick={() => handleSelectMeal(type)}
                  >
                    <Icon size={32} />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ШАГ 2: Выбор способа добавления */}
        {step === 2 && !showTextInput && (
          <>
            <div className="modal-header">
              <button className="back-btn" onClick={() => setStep(1)}>
                <ArrowLeft size={20} />
              </button>
              <h3>{mealType?.label}</h3>
              <button className="close-btn" onClick={resetAndClose}>
                <X size={24} />
              </button>
            </div>

            <p className="modal-subtitle">Как добавить?</p>

            <div className="input-options">
              <button className="input-option" onClick={handleTakePhoto}>
                <Camera size={24} />
                <span>Сделать фото</span>
              </button>

              <button className="input-option" onClick={handleUploadPhoto}>
                <Image size={24} />
                <span>Загрузить из галереи</span>
              </button>

              <button className="input-option" onClick={() => setShowTextInput(true)}>
                <Type size={24} />
                <span>Написать текстом</span>
              </button>
            </div>
          </>
        )}

        {/* ШАГ 2.5: Ввод текстом */}
        {step === 2 && showTextInput && (
          <>
            <div className="modal-header">
              <button className="back-btn" onClick={() => setShowTextInput(false)}>
                <ArrowLeft size={20} />
              </button>
              <h3>{mealType?.label}</h3>
              <button className="close-btn" onClick={resetAndClose}>
                <X size={24} />
              </button>
            </div>

            <p className="modal-subtitle">Что съели?</p>

            <textarea
              className="text-input"
              placeholder="Например: Овсянка с бананом и мёдом, чай"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={4}
              autoFocus
            />

            <button 
              className="submit-btn"
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
            >
              Сохранить
            </button>
          </>
        )}

        {/* ШАГ 3: Успех */}
        {step === 3 && (
          <div className="success-state">
            <div className="success-icon">
              <Check size={32} />
            </div>
            <h3>{mealType?.label} добавлен!</h3>
            
            {content?.type === 'photo' && (
              <img src={content.data} alt="" className="preview-image" />
            )}
            
            {content?.type === 'text' && (
              <p className="preview-text">{content.data}</p>
            )}
            
            <p className="success-time">
              {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>
            
            <button className="done-btn" onClick={resetAndClose}>
              Готово
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
