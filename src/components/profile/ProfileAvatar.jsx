import { useState } from 'react';
import { Camera } from 'lucide-react';
import './ProfileAvatar.css';

const ProfileAvatar = ({ 
  imageUrl, 
  name, 
  size = 'medium', 
  editable = false,
  onImageChange 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const sizeClasses = {
    small: 'avatar-small',
    medium: 'avatar-medium',
    large: 'avatar-large'
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Валидация типа
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Валидация размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5MB');
      return;
    }

    setIsLoading(true);
    try {
      await onImageChange?.(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Ошибка загрузки изображения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`profile-avatar ${sizeClasses[size]}`}>
      <div className="avatar-container">
        <div className="avatar-inner">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="avatar-image" />
          ) : (
            <div className="avatar-placeholder">
              <span className="avatar-initials">{getInitials(name)}</span>
            </div>
          )}

          {isLoading && (
            <div className="avatar-loading">
              <div className="avatar-spinner" />
            </div>
          )}
        </div>

        {editable && !isLoading && (
          <label className="avatar-edit-btn">
            <Camera size={16} />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              hidden
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default ProfileAvatar;
