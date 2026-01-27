import { useState, useRef } from 'react';
import { X, Camera, Video, Send } from 'lucide-react';
import './CreatePostModal.css';

const CreatePostModal = ({ isOpen, onClose }) => {
  const [text, setText] = useState('');
  const [media, setMedia] = useState(null);
  const [category, setCategory] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    { id: 'result', icon: '🎯', name: 'Результат' },
    { id: 'question', icon: '❓', name: 'Вопрос' },
    { id: 'recipe', icon: '🥗', name: 'Рецепт' },
    { id: 'motivation', icon: '💪', name: 'Мотивация' }
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMedia({ file, url, type: file.type.startsWith('video') ? 'video' : 'image' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Пока демо — просто показываем успех
    setTimeout(() => {
      console.log({ text, media, category, isAnonymous });
      setIsSubmitting(false);
      
      // Сброс формы
      setText('');
      setMedia(null);
      setCategory(null);
      setIsAnonymous(false);
      
      // Закрываем модалку
      onClose();
      
      // Показываем уведомление
      alert('Пост отправлен на модерацию!');
    }, 500);
  };

  const handleClose = () => {
    if (text || media) {
      if (window.confirm('Вы уверены? Введённые данные будут потеряны.')) {
        setText('');
        setMedia(null);
        setCategory(null);
        setIsAnonymous(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const canSubmit = text.trim().length > 0 && category && !isSubmitting;

  if (!isOpen) return null;

  return (
    <div className="create-post-overlay" onClick={handleClose}>
      <div className="create-post-modal" onClick={e => e.stopPropagation()}>
        {/* Шапка */}
        <div className="create-post-header">
          <button className="create-post-close" onClick={handleClose}>
            <X size={20} />
          </button>
          <h2>Новый пост</h2>
          <div style={{ width: 32 }} />
        </div>

        {/* Текст */}
        <textarea
          className="create-post-textarea"
          placeholder="Расскажите о своём прогрессе, поделитесь результатом или задайте вопрос сообществу..."
          value={text}
          onChange={e => setText(e.target.value.slice(0, 500))}
          rows={4}
        />
        <div className={`create-post-counter ${text.length > 450 ? 'warning' : ''} ${text.length >= 500 ? 'error' : ''}`}>
          {text.length}/500
        </div>

        {/* Кнопки медиа */}
        <div className="create-post-media-buttons">
          <button className="create-post-media-btn" onClick={() => {
            fileInputRef.current.accept = 'image/*';
            fileInputRef.current?.click();
          }}>
            <Camera size={20} />
            Фото
          </button>
          <button className="create-post-media-btn" onClick={() => {
            fileInputRef.current.accept = 'video/*';
            fileInputRef.current?.click();
          }}>
            <Video size={20} />
            Видео
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            hidden
          />
        </div>

        {/* Превью медиа */}
        {media && (
          <div className="create-post-media-preview">
            {media.type === 'image' ? (
              <img src={media.url} alt="Preview" />
            ) : (
              <video src={media.url} controls />
            )}
            <button className="create-post-media-remove" onClick={() => setMedia(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Категории */}
        <div className="create-post-category-label">Категория</div>
        <div className="create-post-category-grid">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`create-post-category-option ${category === cat.id ? 'selected' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              <span className="create-post-category-icon">{cat.icon}</span>
              <span className="create-post-category-name">{cat.name}</span>
            </div>
          ))}
        </div>

        {/* Анонимность */}
        <label className="create-post-anonymous">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={e => setIsAnonymous(e.target.checked)}
          />
          <span>Опубликовать анонимно</span>
        </label>

        {/* Кнопка отправки */}
        <button
          className="create-post-submit"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            'Отправка...'
          ) : (
            <>
              <Send size={18} />
              Отправить на модерацию
            </>
          )}
        </button>

        <p className="create-post-note">
          Пост появится в ленте после проверки
        </p>
      </div>
    </div>
  );
};

export default CreatePostModal;
