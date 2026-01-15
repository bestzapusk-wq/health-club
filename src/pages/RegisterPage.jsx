import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, AlertCircle } from 'lucide-react';
import SplashScreen from '../components/register/SplashScreen';
import SuccessAnimation from '../components/register/SuccessAnimation';
import GenderSelect from '../components/register/GenderSelect';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { formatPhone, unformatPhone } from '../utils/formatters';
import { 
  validateName, 
  validateAge, 
  validateWeight, 
  validateHeight, 
  validatePhone, 
  validatePassword,
  validateGender 
} from '../utils/validators';
import './RegisterPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    weight: '',
    height: '',
    whatsapp: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    
    if (field === 'whatsapp') {
      value = formatPhone(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleGenderChange = (value) => {
    setFormData(prev => ({ ...prev, gender: value }));
    setTouched(prev => ({ ...prev, gender: true }));
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: null }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    let error = null;
    const value = formData[field];
    
    switch (field) {
      case 'name': error = validateName(value); break;
      case 'gender': error = validateGender(value); break;
      case 'age': error = validateAge(value); break;
      case 'weight': error = validateWeight(value); break;
      case 'height': error = validateHeight(value); break;
      case 'whatsapp': error = validatePhone(value); break;
      case 'password': error = validatePassword(value); break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const validateAll = () => {
    const fields = ['name', 'gender', 'age', 'weight', 'height', 'whatsapp', 'password'];
    let hasErrors = false;
    const newErrors = {};
    
    fields.forEach(field => {
      let error = null;
      const value = formData[field];
      
      switch (field) {
        case 'name': error = validateName(value); break;
        case 'gender': error = validateGender(value); break;
        case 'age': error = validateAge(value); break;
        case 'weight': error = validateWeight(value); break;
        case 'height': error = validateHeight(value); break;
        case 'whatsapp': error = validatePhone(value); break;
        case 'password': error = validatePassword(value); break;
      }
      
      if (error) {
        hasErrors = true;
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    setTouched(Object.fromEntries(fields.map(f => [f, true])));
    
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAll()) return;
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // Формируем email из номера телефона
      const phoneDigits = unformatPhone(formData.whatsapp);
      const email = `${phoneDigits}@health.app`;
      
      // Рассчитываем дату рождения из возраста
      const today = new Date();
      const birthYear = today.getFullYear() - parseInt(formData.age);
      const birthDate = `${birthYear}-01-01`;
      
      // 1. Регистрация в Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
      });
      
      if (authError) {
        // Обработка ошибок авторизации
        if (authError.message.includes('already registered')) {
          throw new Error('Пользователь с таким номером уже зарегистрирован');
        }
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        throw new Error('Не удалось создать аккаунт');
      }
      
      // 2. Сохраняем профиль через RPC функцию (обходит RLS)
      console.log('📤 Saving profile for user:', authData.user.id);
      
      const { error: profileError } = await supabase.rpc('update_user_profile', {
        user_id: authData.user.id,
        p_first_name: formData.name.trim(),
        p_gender: formData.gender,
        p_birth_date: birthDate,
        p_weight_kg: parseInt(formData.weight),
        p_height_cm: parseInt(formData.height),
        p_phone: phoneDigits,
      });
      
      if (profileError) {
        console.error('❌ Profile save error:', profileError);
        // Fallback: попробуем обычный upsert
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            first_name: formData.name.trim(),
            gender: formData.gender,
            birth_date: birthDate,
            weight_kg: parseInt(formData.weight),
            height_cm: parseInt(formData.height),
            phone: phoneDigits,
          });
        
        if (upsertError) {
          console.error('❌ Fallback upsert also failed:', upsertError);
        } else {
          console.log('✅ Profile saved via fallback upsert');
        }
      } else {
        console.log('✅ Profile saved successfully via RPC');
      }
      
      // 3. Сохраняем данные локально для совместимости
      const userData = {
        id: authData.user.id,
        name: formData.name.trim(),
        gender: formData.gender,
        age: parseInt(formData.age),
        weight: parseInt(formData.weight),
        height: parseInt(formData.height),
        whatsapp: formatPhone(formData.whatsapp),
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('user_gender', formData.gender);
      localStorage.setItem('user_name', formData.name.trim());
      localStorage.setItem('registration_date', new Date().toISOString());
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Registration error:', error);
      setApiError(error.message || 'Произошла ошибка при регистрации');
      setIsSubmitting(false);
    }
  };

  const handleSuccessComplete = () => {
    navigate('/');
  };

  // Вход по логину и паролю
  const handleLogin = async (e) => {
    e.preventDefault();
    setApiError(null);
    setIsSubmitting(true);

    try {
      const phoneDigits = unformatPhone(loginData.phone);
      const email = `${phoneDigits}@health.app`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          throw new Error('Неверный номер или пароль');
        }
        throw new Error(error.message);
      }

      if (data.user) {
        // Получаем профиль из базы
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userData = {
          id: data.user.id,
          name: profile?.first_name || 'Пользователь',
          gender: profile?.gender || 'female',
          age: profile?.birth_date ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear() : 25,
          weight: profile?.weight_kg || 60,
          height: profile?.height_cm || 165,
          whatsapp: profile?.phone || phoneDigits,
          createdAt: profile?.created_at || new Date().toISOString()
        };

        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('user_gender', userData.gender);
        localStorage.setItem('user_name', userData.name);

        // Проверяем заполнен ли опросник
        if (profile?.survey_completed) {
          localStorage.setItem('survey_completed', 'true');
          localStorage.setItem('data_submitted', 'true');
        }

        setIsSubmitting(false);
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setApiError(error.message || 'Ошибка входа');
      setIsSubmitting(false);
    }
  };

  if (showSplash) return <SplashScreen />;
  if (showSuccess) return <SuccessAnimation onComplete={handleSuccessComplete} />;

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <div className="register-logo">
            <Leaf size={32} color="var(--accent)" />
          </div>
          <h1 className="register-title">Регистрация</h1>
          <p className="register-subtitle">Создайте аккаунт для начала работы</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Имя <span className="required">*</span></label>
            <input
              type="text"
              className={`form-input ${touched.name && errors.name ? 'error' : ''}`}
              value={formData.name}
              onChange={handleChange('name')}
              onBlur={handleBlur('name')}
              placeholder="Ваше имя"
            />
            {touched.name && errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Пол <span className="required">*</span></label>
            <GenderSelect value={formData.gender} onChange={handleGenderChange} />
            {touched.gender && errors.gender && <span className="error-text">{errors.gender}</span>}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Возраст <span className="required">*</span></label>
              <input
                type="number"
                className={`form-input ${touched.age && errors.age ? 'error' : ''}`}
                value={formData.age}
                onChange={handleChange('age')}
                onBlur={handleBlur('age')}
                placeholder="25"
                min={14}
                max={120}
              />
              {touched.age && errors.age && <span className="error-text">{errors.age}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Вес (кг) <span className="required">*</span></label>
              <input
                type="number"
                className={`form-input ${touched.weight && errors.weight ? 'error' : ''}`}
                value={formData.weight}
                onChange={handleChange('weight')}
                onBlur={handleBlur('weight')}
                placeholder="70"
                min={30}
                max={300}
              />
              {touched.weight && errors.weight && <span className="error-text">{errors.weight}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Рост (см) <span className="required">*</span></label>
              <input
                type="number"
                className={`form-input ${touched.height && errors.height ? 'error' : ''}`}
                value={formData.height}
                onChange={handleChange('height')}
                onBlur={handleBlur('height')}
                placeholder="175"
                min={100}
                max={250}
              />
              {touched.height && errors.height && <span className="error-text">{errors.height}</span>}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">WhatsApp <span className="required">*</span></label>
            <input
              type="tel"
              className={`form-input ${touched.whatsapp && errors.whatsapp ? 'error' : ''}`}
              value={formData.whatsapp}
              onChange={handleChange('whatsapp')}
              onBlur={handleBlur('whatsapp')}
              placeholder="+7 (___) ___-__-__"
            />
            {touched.whatsapp && errors.whatsapp && <span className="error-text">{errors.whatsapp}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Пароль <span className="required">*</span></label>
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${touched.password && errors.password ? 'error' : ''}`}
                value={formData.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                placeholder="Минимум 6 символов"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {touched.password && errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {apiError && (
            <div className="api-error">
              <AlertCircle size={18} />
              <span>{apiError}</span>
            </div>
          )}

          <Button type="submit" fullWidth size="lg" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Создание аккаунта...' : 'Создать аккаунт'}
          </Button>
        </form>

        {/* Разделитель */}
        <div className="auth-divider">
          <span>или</span>
        </div>

        {/* Форма входа */}
        <div className="login-section">
          {!isLoginMode ? (
            <button 
              type="button" 
              className="login-toggle-btn"
              onClick={() => setIsLoginMode(true)}
            >
              Уже есть аккаунт? Войти
            </button>
          ) : (
            <form className="login-form" onSubmit={handleLogin}>
              <h3 className="login-title">Вход в аккаунт</h3>
              
              <div className="form-field">
                <label className="form-label">WhatsApp номер</label>
                <input
                  type="tel"
                  className="form-input"
                  value={loginData.phone}
                  onChange={(e) => setLoginData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  placeholder="+7 (___) ___-__-__"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Пароль</label>
                <input
                  type="password"
                  className="form-input"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Ваш пароль"
                />
              </div>

              {apiError && (
                <div className="api-error">
                  <AlertCircle size={18} />
                  <span>{apiError}</span>
                </div>
              )}

              <Button type="submit" fullWidth size="lg" loading={isSubmitting} disabled={isSubmitting}>
                {isSubmitting ? 'Вход...' : 'Войти'}
              </Button>

              <button 
                type="button" 
                className="back-to-register"
                onClick={() => { setIsLoginMode(false); setApiError(null); }}
              >
                ← Назад к регистрации
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
