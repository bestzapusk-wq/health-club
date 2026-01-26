import { useState } from 'react';
import { Sparkles, ClipboardList, FileUp, ArrowRight, Check } from 'lucide-react';
import './Onboarding.css';

const STEPS = [
  {
    id: 1,
    icon: Sparkles,
    title: 'Добро пожаловать!',
    subtitle: 'Давай настроим твой путь к здоровью',
    description: 'Всего 3 шага — и ты получишь персональные рекомендации по здоровью',
    buttonText: 'Начать',
    color: '#22C55E',
  },
  {
    id: 2,
    icon: ClipboardList,
    title: 'Расскажи о себе',
    subtitle: 'Заполни короткий опросник',
    description: 'Это займёт около 5 минут. Так мы поймём твоё состояние здоровья и подберём рекомендации.',
    buttonText: 'Пройти опросник',
    action: 'survey',
    color: '#8B5CF6',
  },
  {
    id: 3,
    icon: FileUp,
    title: 'Загрузи анализы',
    subtitle: 'Если есть — отлично, нет — не страшно',
    description: 'Свежие анализы помогут дать более точные рекомендации. Нет анализов? Расскажем какие сдать.',
    buttonText: 'Загрузить',
    skipText: 'Пока пропустить',
    action: 'upload',
    color: '#3B82F6',
  },
];

export default function Onboarding({ userName, onComplete, onAction }) {
  const [step, setStep] = useState(0);
  const currentStep = STEPS[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (currentStep.action) {
      onAction(currentStep.action);
    } else if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        {/* Progress indicator */}
        <div className="onboarding-progress">
          {STEPS.map((s, i) => (
            <div 
              key={s.id}
              className={`progress-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="onboarding-content">
          <div 
            className="onboarding-icon"
            style={{ background: `${currentStep.color}15`, color: currentStep.color }}
          >
            <Icon size={48} />
          </div>

          {step === 0 && userName && (
            <p className="onboarding-greeting">Привет, {userName}! 👋</p>
          )}

          <h1 className="onboarding-title">{currentStep.title}</h1>
          <p className="onboarding-subtitle">{currentStep.subtitle}</p>
          <p className="onboarding-desc">{currentStep.description}</p>
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          <button 
            className="onboarding-btn primary"
            style={{ background: currentStep.color }}
            onClick={handleNext}
          >
            {currentStep.buttonText}
            <ArrowRight size={20} />
          </button>

          {currentStep.skipText && (
            <button className="onboarding-btn secondary" onClick={handleSkip}>
              {currentStep.skipText}
            </button>
          )}
        </div>

        {/* Steps indicator */}
        <div className="onboarding-dots">
          {STEPS.map((s, i) => (
            <span 
              key={s.id}
              className={`dot ${i === step ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

