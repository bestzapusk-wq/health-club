import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, AlertCircle, Mail } from 'lucide-react';
import SplashScreen from '../components/register/SplashScreen';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import './RegisterPage.css';

// SVG иконки для OAuth
const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'apple' | 'google' | null
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
      setOauthLoading(null);
    }
  };

  // Sign in with Apple
  const handleAppleSignIn = async () => {
    setError('');
    setOauthLoading('apple');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Apple sign in error:', err);
      setError('Ошибка входа через Apple');
      setOauthLoading(null);
    }
  };

  // Sign in with Google
  const handleGoogleSignIn = async () => {
    setError('');
    setOauthLoading('google');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Ошибка входа через Google');
      setOauthLoading(null);
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

        {/* OAuth Buttons */}
        <div className="oauth-buttons">
          <button 
            className="oauth-button apple-button"
            onClick={handleAppleSignIn}
            disabled={oauthLoading !== null}
          >
            {oauthLoading === 'apple' ? (
              <span className="oauth-loading">Загрузка...</span>
            ) : (
              <>
                <span className="oauth-icon"><AppleIcon /></span>
                Войти через Apple
              </>
            )}
          </button>

          <button 
            className="oauth-button google-button"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading !== null}
          >
            {oauthLoading === 'google' ? (
              <span className="oauth-loading">Загрузка...</span>
            ) : (
              <>
                <span className="oauth-icon"><GoogleIcon /></span>
                Войти через Google
              </>
            )}
          </button>
        </div>

        <div className="auth-divider">
          <span>или</span>
        </div>

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
