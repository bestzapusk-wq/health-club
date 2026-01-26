import { useState } from 'react';
import { X, Scale } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import './WeightEditModal.css';

export default function WeightEditModal({ isOpen, onClose, userData, onSave }) {
  const [weight, setWeight] = useState(userData?.weight_kg || userData?.weight || '');
  const [height, setHeight] = useState(userData?.height_cm || userData?.height || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    // Валидация
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
      setError('Вес должен быть от 30 до 300 кг');
      return;
    }

    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      setError('Рост должен быть от 100 до 250 см');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Обновляем в Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          weight_kg: weightNum,
          height_cm: heightNum,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        // Продолжаем даже при ошибке Supabase - сохраняем локально
      }

      // Обновляем в localStorage
      const updatedData = {
        ...userData,
        weight: weightNum,
        height: heightNum,
        weight_kg: weightNum,
        height_cm: heightNum
      };
      localStorage.setItem('user_data', JSON.stringify(updatedData));

      onSave(updatedData);
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      setError('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="weight-modal-overlay" onClick={onClose}>
      <div className="weight-modal" onClick={e => e.stopPropagation()}>
        <button className="weight-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="weight-modal-icon">
          <Scale size={28} />
        </div>

        <h3>Обновить данные</h3>

        <div className="weight-form">
          <div className="weight-field">
            <label>Вес (кг)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="65"
              min="30"
              max="300"
            />
          </div>

          <div className="weight-field">
            <label>Рост (см)</label>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="168"
              min="100"
              max="250"
            />
          </div>

          {error && <p className="weight-error">{error}</p>}
        </div>

        <Button fullWidth onClick={handleSave} disabled={loading}>
          {loading ? 'Сохраняем...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
}
