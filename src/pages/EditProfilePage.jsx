import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProfileAvatar from '../components/profile/ProfileAvatar';
import './EditProfilePage.css';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
    weight_kg: '',
    height_cm: '',
    avatar_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Пробуем получить user из localStorage (наша система)
      const userData = localStorage.getItem('user_data');
      let uid = null;

      if (userData) {
        const parsed = JSON.parse(userData);
        uid = parsed.id;
        setUserId(uid);
        
        // Заполняем форму из localStorage
        setProfile({
          first_name: parsed.name || parsed.first_name || '',
          last_name: parsed.last_name || '',
          birth_date: parsed.birth_date || '',
          gender: parsed.gender || '',
          weight_kg: parsed.weight_kg || parsed.weight || '',
          height_cm: parsed.height_cm || parsed.height || '',
          avatar_url: parsed.avatar_url || ''
        });
      }

      // Если есть userId, пробуем загрузить из Supabase
      if (uid) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single();

        if (data && !error) {
          setProfile({
            first_name: data.first_name || data.name || '',
            last_name: data.last_name || '',
            birth_date: data.birth_date || '',
            gender: data.gender || '',
            weight_kg: data.weight_kg || '',
            height_cm: data.height_cm || '',
            avatar_url: data.avatar_url || ''
          });
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleImageChange = async (file) => {
    if (!userId) {
      console.error('No user ID');
      return;
    }

    try {
      // Загружаем в Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData?.publicUrl;

      if (publicUrl) {
        // Добавляем timestamp для обхода кэша
        const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
        
        // Обновляем профиль в БД
        await supabase
          .from('profiles')
          .update({ avatar_url: urlWithTimestamp })
          .eq('id', userId);

        // Обновляем локально
        setProfile(prev => ({ ...prev, avatar_url: urlWithTimestamp }));

        // Обновляем localStorage
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsed = JSON.parse(userData);
          parsed.avatar_url = urlWithTimestamp;
          localStorage.setItem('user_data', JSON.stringify(parsed));
        }
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      throw err;
    }
  };

  const handleSave = async () => {
    if (!userId) {
      alert('Ошибка: пользователь не найден');
      return;
    }

    setLoading(true);

    try {
      // Обновляем в Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          name: profile.first_name || null, // Для совместимости
          birth_date: profile.birth_date || null,
          gender: profile.gender || null,
          weight_kg: profile.weight_kg ? parseInt(profile.weight_kg) : null,
          height_cm: profile.height_cm ? parseInt(profile.height_cm) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Save error:', error);
        alert('Ошибка сохранения');
        return;
      }

      // Обновляем localStorage
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        const updated = {
          ...parsed,
          name: profile.first_name,
          first_name: profile.first_name,
          last_name: profile.last_name,
          birth_date: profile.birth_date,
          gender: profile.gender,
          weight_kg: profile.weight_kg ? parseInt(profile.weight_kg) : null,
          height_cm: profile.height_cm ? parseInt(profile.height_cm) : null,
          weight: profile.weight_kg ? parseInt(profile.weight_kg) : null,
          height: profile.height_cm ? parseInt(profile.height_cm) : null,
          avatar_url: profile.avatar_url
        };
        localStorage.setItem('user_data', JSON.stringify(updated));
        localStorage.setItem('user_name', profile.first_name || '');
        if (profile.gender) {
          localStorage.setItem('user_gender', profile.gender);
        }
      }

      navigate('/profile');
    } catch (err) {
      console.error('Save error:', err);
      alert('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="edit-profile-page">
        <header className="edit-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1>Редактировать профиль</h1>
          <div style={{ width: 40 }} />
        </header>
        <div className="edit-loading">
          <div className="edit-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-page">
      {/* Шапка */}
      <header className="edit-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1>Редактировать профиль</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* Аватар */}
      <div className="avatar-section">
        <ProfileAvatar
          imageUrl={profile.avatar_url}
          name={profile.first_name}
          size="large"
          editable
          onImageChange={handleImageChange}
        />
        <label className="change-photo-btn">
          Изменить фото
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageChange(file);
            }}
            hidden
          />
        </label>
      </div>

      {/* Форма */}
      <div className="edit-form">
        <div className="form-group">
          <label>Имя</label>
          <input
            type="text"
            value={profile.first_name}
            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
            placeholder="Введите имя"
          />
        </div>

        <div className="form-group">
          <label>Фамилия</label>
          <input
            type="text"
            value={profile.last_name}
            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
            placeholder="Введите фамилию"
          />
        </div>

        <div className="form-group">
          <label>Дата рождения</label>
          <input
            type="date"
            value={profile.birth_date}
            onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Пол</label>
          <select
            value={profile.gender}
            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
          >
            <option value="">Выберите</option>
            <option value="female">Женский</option>
            <option value="male">Мужской</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label>Вес, кг</label>
            <input
              type="number"
              value={profile.weight_kg}
              onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
              placeholder="65"
              min="30"
              max="300"
            />
          </div>

          <div className="form-group half">
            <label>Рост, см</label>
            <input
              type="number"
              value={profile.height_cm}
              onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
              placeholder="168"
              min="100"
              max="250"
            />
          </div>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <div className="save-section">
        <button 
          className="save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
