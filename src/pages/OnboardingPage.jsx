import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './OnboardingPage.css';

const SLIDES = [
  {
    id: 'welcome',
    type: 'welcome',
    icon: '🌿',
    title: 'Добро пожаловать\nв Клуб Alimi Health',
    subtitle: 'Ваше здоровье начинается здесь',
    description: 'Персональный подход к восстановлению под руководством нутрициолога с 13-летним опытом',
    buttonText: 'Далее'
  },
  {
    id: 'features',
    type: 'features',
    title: 'Что вас ждёт в клубе',
    features: [
      {
        icon: '📋',
        title: 'Персональный план восстановления',
        description: 'Составленный под ваши анализы и симптомы'
      },
      {
        icon: '🎬',
        title: 'Записи эфиров и видео-уроки',
        description: 'База знаний о здоровье в удобном формате'
      },
      {
        icon: '💬',
        title: 'Обратная связь от нутрициологов',
        description: 'Ответы на ваши вопросы'
      },
      {
        icon: '📊',
        title: 'Подробный контроль здоровья',
        description: 'Трекеры, дневники, прогресс'
      }
    ],
    buttonText: 'Интересно!'
  },
  {
    id: 'tools',
    type: 'features',
    title: 'Умные инструменты клуба',
    features: [
      {
        icon: '🔬',
        title: 'Нейро-сканер питания',
        description: 'AI анализирует фото вашей еды'
      },
      {
        icon: '📰',
        title: 'Лента новостей клуба',
        description: 'Свежий контент и анонсы'
      },
      {
        icon: '💊',
        title: 'Трекер привычек и витаминов',
        description: 'Не забудете ничего важного'
      },
      {
        icon: '🏆',
        title: 'Личные и командные челленджи',
        description: 'Мотивация через сообщество'
      }
    ],
    buttonText: 'Начать!'
  }
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;

  const completeOnboarding = async (goToSurvey = true) => {
    setIsLoading(true);
    
    try {
      // Получаем userId
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        
        // Обновляем профиль в Supabase
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
        
        // Обновляем localStorage
        user.onboardingCompleted = true;
        localStorage.setItem('user_data', JSON.stringify(user));
      }
      
      localStorage.setItem('onboarding_completed', 'true');
      
      if (goToSurvey) {
        navigate('/survey');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Error completing onboarding:', err);
      navigate(goToSurvey ? '/survey' : '/');
    }
  };

  const handleNext = () => {
    if (isLastSlide) {
      completeOnboarding(false);
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const isLightTheme = slide.type !== 'welcome';

  return (
    <div className={`onboarding-page ${isLightTheme ? 'light-theme' : ''}`}>
      {/* Progress dots */}
      <div className="onboarding-progress">
        {SLIDES.map((_, idx) => (
          <div 
            key={idx} 
            className={`progress-dot ${idx === currentSlide ? 'active' : ''} ${idx < currentSlide ? 'done' : ''}`}
          />
        ))}
      </div>

      <div className="onboarding-content">
        {/* Slide: Welcome */}
        {slide.type === 'welcome' && (
          <div className="slide slide-welcome">
            <div className="welcome-icon">
              {slide.icon}
            </div>
            <h1 className="welcome-title">{slide.title}</h1>
            <p className="welcome-subtitle">{slide.subtitle}</p>
            <p className="welcome-description">{slide.description}</p>
          </div>
        )}

        {/* Slide: Features */}
        {slide.type === 'features' && (
          <div className="slide slide-features">
            <h2 className="features-title">{slide.title}</h2>
            <div className="features-list">
              {slide.features.map((feature, idx) => (
                <div key={idx} className="feature-card">
                  <span className="feature-icon">{feature.icon}</span>
                  <div className="feature-content">
                    <div className="feature-title">{feature.title}</div>
                    <div className="feature-desc">{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Bottom actions */}
      <div className="onboarding-actions">
        <button 
          className="onboarding-btn primary"
          onClick={handleNext}
          disabled={isLoading}
        >
          {isLoading ? 'Загрузка...' : slide.buttonText}
          {!isLoading && <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
}
