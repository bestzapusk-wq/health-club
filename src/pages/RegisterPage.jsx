import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, AlertCircle, Mail } from 'lucide-react';
import SplashScreen from '../components/register/SplashScreen';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import './RegisterPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Проверяем, есть ли уже пользователь
    const userData = localStorage.getItem('user_data');
    if (userData) {
      navigate('/');
      return;
    }

    // Проверяем OAuth callback
    const handleOAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user && !error) {
        await handleOAuthUser(session.user);
      }
    };
    handleOAuthCallback();

    // Слушаем изменения auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleOAuthUser(session.user);
      }
    });

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Обработка пользователя после OAuth
  const handleOAuthUser = async (authUser) => {
    try {
      const userEmail = authUser.email;
      const userName = authUser.user_metadata?.full_name || 
                       authUser.user_metadata?.name || 
                       userEmail?.split('@')[0] || 'User';

      // Создаём/получаем профиль через RPC
      const { data, error } = await supabase
        .rpc('get_or_create_user', { 
          p_email: userEmail, 
          p_name: userName 
        });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Не удалось получить профиль');

      const profile = data[0];

      // Сохраняем в localStorage
      const userData = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        gender: profile.gender,
        age: profile.age,
        weight: profile.weight_kg,
        height: profile.height_cm,
        surveyCompleted: profile.survey_completed,
        onboardingCompleted: profile.onboarding_completed
      };
      
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('user_name', userData.name);
      if (profile.gender) localStorage.setItem('user_gender', profile.gender);
      if (profile.onboarding_completed) localStorage.setItem('onboarding_completed', 'true');

      // Навигация
      if (!profile.onboarding_completed) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('OAuth user handling error:', err);
      setError('Ошибка авторизации. Попробуйте ещё раз.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Валидация
    if (!email || !email.includes('@')) {
      setError('Введите корректный email');
      return;
    }
    
    if (!name.trim()) {
      setError('Введите ваше имя');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const emailLower = email.toLowerCase();

      // Используем RPC функцию (обходит проблемы с кэшем PostgREST)
      const { data, error } = await supabase
        .rpc('get_or_create_user', { 
          p_email: emailLower, 
          p_name: name.trim() 
        });

      if (error) {
        console.error('RPC error:', error);
        throw new Error(error.message || 'Ошибка входа');
      }

      if (!data || data.length === 0) {
        throw new Error('Не удалось получить профиль');
      }

      const profile = data[0];
      console.log('✅ User:', profile.id);

      // Сохраняем в localStorage
      const userData = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        gender: profile.gender,
        age: profile.age,
        weight: profile.weight_kg,
        height: profile.height_cm,
        surveyCompleted: profile.survey_completed,
        onboardingCompleted: profile.onboarding_completed
      };
      
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('user_name', userData.name);
      if (profile.gender) {
        localStorage.setItem('user_gender', profile.gender);
      }
      if (profile.onboarding_completed) {
        localStorage.setItem('onboarding_completed', 'true');
      }
      
      console.log('✅ Logged in:', userData.id);
      
      setIsSubmitting(false);
      
      // Если онбординг не пройден — показываем его
      if (!profile.onboarding_completed) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Произошла ошибка');
      setIsSubmitting(false);
    }
  };

  if (showSplash) return <SplashScreen />;

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <div className="register-logo">
            <Leaf size={32} color="var(--accent)" />
          </div>
          <h1 className="register-title">Health Club</h1>
          <p className="register-subtitle">Войдите чтобы продолжить</p>
        </div>

        {error && (
          <div className="api-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Email Form */}
        <form className="login-form-simple" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Ваше имя</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как вас зовут?"
            />
          </div>

          <Button 
            type="submit"
            fullWidth 
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting || oauthLoading !== null}
          >
            <Mail size={20} />
            Войти по Email
          </Button>
        </form>

        <p className="register-hint">
          Данные сохраняются и привязываются к вашему аккаунту
        </p>
      </div>
    </div>
  );
}
