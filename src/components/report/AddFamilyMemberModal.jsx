import { useState } from 'react';
import { X } from 'lucide-react';
import { familyService } from '../../lib/familyService';
import './AddFamilyMemberModal.css';

/**
 * Модальное окно для добавления родственника
 */
const AddFamilyMemberModal = ({ userId, onClose, onAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    relation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.gender || !formData.age || !formData.relation) {
      setError('Заполните все поля');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await familyService.addFamilyMember(userId, {
        ...formData,
        age: parseInt(formData.age)
      });
      onAdded();
    } catch (err) {
      setError('Не удалось добавить. Попробуйте ещё раз.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="family-modal-overlay" onClick={onClose}>
      <div className="family-modal-content" onClick={e => e.stopPropagation()}>
        <div className="family-modal-header">
          <h2>Добавить родственника</h2>
          <button className="family-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="family-form">
          <div className="family-form-group">
            <label>Имя</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Как зовут?"
              className="family-input"
            />
          </div>

          <div className="family-form-group">
            <label>Пол</label>
            <div className="gender-buttons">
              <button
                type="button"
                className={`gender-btn ${formData.gender === 'female' ? 'active' : ''}`}
                onClick={() => handleChange('gender', 'female')}
              >
                Женский
              </button>
              <button
                type="button"
                className={`gender-btn ${formData.gender === 'male' ? 'active' : ''}`}
                onClick={() => handleChange('gender', 'male')}
              >
                Мужской
              </button>
            </div>
          </div>

          <div className="family-form-group">
            <label>Возраст</label>
            <input
              type="number"
              value={formData.age}
              onChange={e => handleChange('age', e.target.value)}
              placeholder="Сколько лет?"
              min="1"
              max="120"
              className="family-input"
            />
          </div>

          <div className="family-form-group">
            <label>Кем приходится</label>
            <select
              value={formData.relation}
              onChange={e => handleChange('relation', e.target.value)}
              className="family-select"
            >
              <option value="">Выберите...</option>
              <option value="spouse">Супруг / Супруга</option>
              <option value="child">Ребёнок</option>
              <option value="parent">Родитель</option>
              <option value="sibling">Брат / Сестра</option>
              <option value="other">Другое</option>
            </select>
          </div>

          {error && <div className="family-error">{error}</div>}

          <button 
            type="submit" 
            className="family-submit-btn"
            disabled={loading}
          >
            {loading ? 'Добавляем...' : 'Добавить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddFamilyMemberModal;
