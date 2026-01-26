import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ClipboardList, Paperclip, Target, Lightbulb, CheckCircle, Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './OnboardingPage.css';

const SLIDES = [
  {
    id: 'welcome',
    illustration: '😩➡️💪',
    title: 'Устали чувствовать усталость?',
    subtitle: 'Врачи говорят "всё в норме", а сил всё равно нет?',
    highlight: 'Мы найдём причину.',
    buttonText: 'Продолжить'
  },
  {
    id: 'how-it-works',
    title: 'Как это работает?',
    steps: [
      { icon: ClipboardList, num: '1', title: 'Расскажите о себе', desc: '5 минут на вопросы о вашем самочувствии' },
      { icon: Paperclip, num: '2', title: 'Загрузите анализы', desc: 'Фото или PDF — любые анализы крови' },
      { icon: Target, num: '3', title: 'Получите рекомендации', desc: 'AI найдёт связи и покажет приоритеты' }
    ],
    buttonText: 'Понятно, начнём!'
  },
  {
    id: 'benefits',
    title: 'Что вы получите:',
    benefits: [
      { text: 'Поймёте ПОЧЕМУ нет сил', subtext: '(не просто цифры, а причины)' },
      { text: 'Увидите СВЯЗИ между симптомами', subtext: '(то, что врачи не замечают)' },
      { text: 'Узнаете ЧТО ДЕЛАТЬ первым', subtext: '(приоритеты, а не список)' }
    ],
    testimonial: {
      text: 'Наконец-то поняла почему я так устаю! За 5 минут узнала больше, чем за год походов по врачам',
      author: 'Анна, 38 лет'
    },
    buttonText: 'Хочу разобраться!'
  },
  {
    id: 'start-survey',
    title: 'Начнём с опросника',
    description: 'Это займёт около 5 минут.',
    tip: 'Чем честнее ответите — тем точнее будут рекомендации.',
    hint: {
      icon: Lightbulb,
      text: 'Можно пропустить вопрос, если не знаете ответ — это нормально'
    },
    buttonText: 'Начать опросник',
    skipText: 'Пропустить (заполню позже)'
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
      completeOnboarding(true);
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding(false);
  };

  return (
    <div className="onboarding-page">
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
        {/* Slide 1: Welcome */}
        {slide.id === 'welcome' && (
          <div className="slide slide-welcome">
            <div className="welcome-illustration">
              {slide.illustration}
            </div>
            <h1>{slide.title}</h1>
            <p className="subtitle">{slide.subtitle}</p>
            <p className="highlight">{slide.highlight}</p>
          </div>
        )}

        {/* Slide 2: How it works */}
        {slide.id === 'how-it-works' && (
          <div className="slide slide-steps">
            <h1>{slide.title}</h1>
            <div className="steps-list">
              {slide.steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="step-item">
                    <div className="step-icon">
                      <Icon size={24} />
                    </div>
                    <div className="step-content">
                      <div className="step-header">
                        <span className="step-num">{step.num}.</span>
                        <span className="step-title">{step.title}</span>
                      </div>
                      <p className="step-desc">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Slide 3: Benefits */}
        {slide.id === 'benefits' && (
          <div className="slide slide-benefits">
            <h1>{slide.title}</h1>
            <div className="benefits-list">
              {slide.benefits.map((benefit, idx) => (
                <div key={idx} className="benefit-item">
                  <CheckCircle size={20} className="benefit-check" />
                  <div>
                    <span className="benefit-text">{benefit.text}</span>
                    <span className="benefit-subtext">{benefit.subtext}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="testimonial">
              <Quote size={20} className="quote-icon" />
              <p className="testimonial-text">"{slide.testimonial.text}"</p>
              <span className="testimonial-author">— {slide.testimonial.author}</span>
            </div>
          </div>
        )}

        {/* Slide 4: Start survey */}
        {slide.id === 'start-survey' && (
          <div className="slide slide-start">
            <div className="start-icon">
              <ClipboardList size={48} />
            </div>
            <h1>{slide.title}</h1>
            <p className="description">{slide.description}</p>
            <p className="tip">{slide.tip}</p>
            <div className="hint-box">
              <Lightbulb size={18} />
              <span>{slide.hint.text}</span>
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
        
        {isLastSlide && (
          <button 
            className="onboarding-btn skip"
            onClick={handleSkip}
            disabled={isLoading}
          >
            {slide.skipText}
          </button>
        )}
      </div>
    </div>
  );
}
