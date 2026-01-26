import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Clock, ChevronRight, Check, Bell, Target, Sparkles, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fastingService } from '../lib/fastingService';
import Button from '../components/ui/Button';
import './FastingSettingsPage.css';

// Режимы голодания с полными данными
const FASTING_MODES = [
  { 
    id: '12:12', 
    label: '12:12', 
    fastingHours: 12,
    eatingHours: 12,
    difficulty: 'easy',
    difficultyLabel: 'Легко',
    description: '12 часов голодания, 12 часов приема пищи',
    benefits: ['Для начинающих', 'Минимальное ограничение', 'Хорошая отправная точка'],
    recommended: false
  },
  { 
    id: '14:10', 
    label: '14:10', 
    fastingHours: 14,
    eatingHours: 10,
    difficulty: 'medium',
    difficultyLabel: 'Средне',
    description: '14 часов голодания, 10 часов приема пищи',
    benefits: ['Потеря веса', 'Лучший сон', 'Повышенная энергия'],
    recommended: false
  },
  { 
    id: '16:8', 
    label: '16:8', 
    fastingHours: 16,
    eatingHours: 8,
    difficulty: 'medium',
    difficultyLabel: 'Средне',
    description: '16 часов голодания, 8 часов приема пищи',
    benefits: ['Сжигание жира', 'Аутофагия', 'Ясность ума'],
    recommended: true  // Единственный рекомендуемый!
  },
  { 
    id: '18:6', 
    label: '18:6', 
    fastingHours: 18,
    eatingHours: 6,
    difficulty: 'hard',
    difficultyLabel: 'Сложно',
    description: '18 часов голодания, 6 часов приема пищи',
    benefits: ['Максимальная потеря жира', 'Кетоз', 'Преимущества долголетия'],
    recommended: false
  }
];

// Предустановленные времена начала
const TIME_PRESETS = [
  { id: 'morning', time: '08:00', label: 'Утро', icon: '🌅' },
  { id: 'noon', time: '12:00', label: 'Полдень', icon: '☀️' },
  { id: 'evening', time: '20:00', label: 'Вечер', icon: '🌙' }
];

export default function FastingSettingsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: intro, 1: goal, 2: schedule, 3: complete
  const [selectedMode, setSelectedMode] = useState('16:8');
  const [selectedTimePreset, setSelectedTimePreset] = useState('noon');
  const [customTime, setCustomTime] = useState('12:00');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);
  const [showDifferenceModal, setShowDifferenceModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user.id);
      checkExistingSettings(user.id);
    } else {
      setLoading(false);
    }
  }, []);

  const checkExistingSettings = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('fasting_settings')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (data && !error) {
        setHasExistingSettings(true);
        setSelectedMode(data.mode || '16:8');
        const startTime = data.eating_window_start?.substring(0, 5) || '12:00';
        setCustomTime(startTime);
        
        const preset = TIME_PRESETS.find(p => p.time === startTime);
        if (preset) {
          setSelectedTimePreset(preset.id);
          setUseCustomTime(false);
        } else {
          setUseCustomTime(true);
        }
        
        setStep(1);
      }
    } catch {
      // Настройки не найдены
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setSaving(true);

    try {
      const startTime = useCustomTime 
        ? customTime 
        : TIME_PRESETS.find(p => p.id === selectedTimePreset)?.time || '12:00';

      const settings = {
        user_id: userId,
        mode: selectedMode,
        eating_window_start: startTime + ':00',
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('fasting_settings')
        .upsert(settings, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving fasting settings:', error);
      }

      localStorage.setItem('fasting_settings', JSON.stringify({
        mode: selectedMode,
        startTime,
        isActive: true
      }));

      setStep(3);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getScheduleInfo = () => {
    const mode = FASTING_MODES.find(m => m.id === selectedMode);
    const startTime = useCustomTime 
      ? customTime 
      : TIME_PRESETS.find(p => p.id === selectedTimePreset)?.time || '12:00';
    
    if (!mode) return { fastingStart: '--:--', fastingEnd: '--:--' };

    const [hours, minutes] = startTime.split(':').map(Number);
    const fastingStartHours = (hours + mode.eatingHours) % 24;
    const fastingStart = `${fastingStartHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return { 
      eatingStart: startTime, 
      eatingEnd: fastingStart,
      fastingStart,
      fastingEnd: startTime
    };
  };

  const handleNext = () => {
    if (step < 3) {
      if (step === 2) {
        handleSave();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleStartFasting = async () => {
    if (!userId) {
      navigate('/food/fasting');
      return;
    }

    try {
      const targetHours = parseInt(selectedMode.split(':')[0]) || 16;
      
      await fastingService.startSession(userId, {
        fasting_type: selectedMode,
        target_hours: targetHours
      });

      navigate('/food/fasting');
    } catch (err) {
      console.error('Error starting fasting session:', err);
      navigate('/food/fasting');
    }
  };

  const canProceed = () => {
    if (step === 1) return !!selectedMode;
    if (step === 2) return useCustomTime ? !!customTime : !!selectedTimePreset;
    return true;
  };

  if (loading) {
    return (
      <div className="fasting-onboarding">
        <div className="fasting-loading">Загрузка...</div>
      </div>
    );
  }

  const schedule = getScheduleInfo();
  const currentMode = FASTING_MODES.find(m => m.id === selectedMode);

  return (
    <div className="fasting-onboarding">
      {/* Header */}
      <header className="fasting-ob-header">
        <button className="fasting-ob-back" onClick={step === 3 ? handleClose : handleBack}>
          {step === 0 ? <X size={24} /> : <ArrowLeft size={24} />}
        </button>
        <h1 className="fasting-ob-title">
          {step === 0 && 'Периодическое голодание'}
          {step === 1 && 'Выберите цель'}
          {step === 2 && 'Установите расписание'}
          {step === 3 && 'Готово!'}
        </h1>
      </header>

      {/* Content */}
      <main className="fasting-ob-content">
        
        {/* Step 0: Intro */}
        {step === 0 && (
          <div className="fasting-intro-screen">
            <div className="intro-hero">
              <div className="intro-icon-circle">
                <Clock size={48} />
              </div>
              <h2>Преобразуйте свое здоровье с помощью интервального голодания</h2>
              <p>
                Откройте силу ограничения по времени приема пищи. 
                Выберите свое окно голодания и начните свое путешествие 
                к лучшему здоровью сегодня.
              </p>
            </div>

            <div className="intro-dots">
              <span className="dot active"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        {/* Step 1: Select Goal/Mode */}
        {step === 1 && (
          <div className="fasting-goal-screen">
            <div className="fasting-modes-grid">
              {FASTING_MODES.map(mode => (
                <button
                  key={mode.id}
                  className={`fasting-mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  {mode.recommended && (
                    <span className="mode-recommended">Рекомендуется</span>
                  )}
                  
                  <div className="mode-card-header">
                    <span className="mode-card-label">{mode.label}</span>
                    <span className={`mode-difficulty-badge ${mode.difficulty}`}>
                      {mode.difficultyLabel}
                    </span>
                  </div>
                  
                  <p className="mode-card-desc">{mode.description}</p>
                  
                  <div className="mode-benefits">
                    {mode.benefits.map((benefit, idx) => (
                      <span key={idx} className="benefit-tag">{benefit}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <button 
              className="difference-btn"
              onClick={() => setShowDifferenceModal(true)}
            >
              <HelpCircle size={18} />
              В чём разница?
            </button>
          </div>
        )}
        
        {/* Модалка "В чём разница?" */}
        {showDifferenceModal && (
          <div className="modal-overlay" onClick={() => setShowDifferenceModal(false)}>
            <div className="modal-sheet difference-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              
              <div className="modal-header">
                <h2>Как выбрать режим?</h2>
              </div>

              <div className="modal-body">
                <div className="difference-item">
                  <span className="diff-ratio">12:12</span>
                  <p>Идеально для начала. Просто не ешь 12 часов — например, с 20:00 до 08:00. Минимальный стресс для организма.</p>
                </div>

                <div className="difference-item">
                  <span className="diff-ratio">14:10</span>
                  <p>Лёгкое усиление. Пропускаешь поздний ужин или ранний завтрак. Уже заметный эффект на вес и энергию.</p>
                </div>

                <div className="difference-item recommended">
                  <span className="diff-ratio">16:8</span>
                  <span className="diff-badge">Оптимально</span>
                  <p>Золотой стандарт. Обычно пропускают завтрак, едят с 12:00 до 20:00. Баланс эффективности и комфорта.</p>
                </div>

                <div className="difference-item">
                  <span className="diff-ratio">18:6</span>
                  <p>Продвинутый уровень. Два приёма пищи в день. Максимальный эффект, но требует привычки.</p>
                </div>
              </div>

              <div className="modal-footer">
                <button className="close-btn" onClick={() => setShowDifferenceModal(false)}>
                  Понятно
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="fasting-schedule-screen">
            <div className="schedule-section">
              <h3>Предлагаемое время начала</h3>
              <p className="schedule-hint">Выберите, когда вы хотите начать свое окно голодания</p>
              
              <div className="time-presets-grid">
                {TIME_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    className={`time-preset-card ${!useCustomTime && selectedTimePreset === preset.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTimePreset(preset.id);
                      setUseCustomTime(false);
                    }}
                  >
                    <span className="preset-icon">{preset.icon}</span>
                    <span className="preset-time">{preset.time}</span>
                    <span className="preset-label">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="schedule-section">
              <h3>Пользовательское время</h3>
              <p className="schedule-hint">Или установите свое предпочтительное время начала</p>
              
              <button 
                className={`custom-time-card ${useCustomTime ? 'selected' : ''}`}
                onClick={() => setUseCustomTime(true)}
              >
                <Clock size={24} />
                <div className="custom-time-info">
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => {
                      setCustomTime(e.target.value);
                      setUseCustomTime(true);
                    }}
                    className="custom-time-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </button>
            </div>

            {/* Preview - новый дизайн */}
            <div className="schedule-summary">
              <h3>Ваше расписание</h3>
              
              <div className="schedule-row eating">
                <span className="schedule-icon">🍽</span>
                <span className="schedule-label">Едим:</span>
                <span className="schedule-time">{schedule.eatingStart} – {schedule.eatingEnd}</span>
              </div>
              
              <div className="schedule-row fasting">
                <span className="schedule-icon">⏸</span>
                <span className="schedule-label">Пост:</span>
                <span className="schedule-time">{schedule.fastingStart} – {schedule.fastingEnd}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="fasting-complete-screen">
            <div className="complete-hero">
              <div className="complete-icon-circle">
                <Check size={48} />
              </div>
              <h2>Настройка голодания завершена!</h2>
              <p>
                Ваш персональный план голодания готов. 
                Давайте вместе достигнем ваших целей здоровья.
              </p>
            </div>

            <div className="complete-summary">
              <h4><Target size={20} /> Ваш план голодания</h4>
              
              <div className="summary-row">
                <span className="summary-icon"><Sparkles size={18} /></span>
                <div className="summary-info">
                  <span className="summary-label">Голодание</span>
                  <span className="summary-value">{selectedMode}</span>
                </div>
              </div>
              
              <div className="summary-row">
                <span className="summary-icon"><Clock size={18} /></span>
                <div className="summary-info">
                  <span className="summary-label">Расписание</span>
                  <span className="summary-value">
                    Начать голодание: {schedule.fastingStart}<br/>
                    Закончить голодание: {schedule.fastingEnd}
                  </span>
                </div>
              </div>
              
              <div className="summary-row">
                <span className="summary-icon"><Bell size={18} /></span>
                <div className="summary-info">
                  <span className="summary-label">Уведомления</span>
                  <span className="summary-value">Вовремя</span>
                </div>
              </div>
            </div>

            <div className="complete-tips">
              <h4>Полезные советы</h4>
              <ul>
                <li>Во время поста можно пить воду, чай и чёрный кофе</li>
                <li>В окно еды фокусируйтесь на питательных продуктах</li>
                <li>Слушайте тело — последовательность важнее совершенства</li>
              </ul>
            </div>

            <div className="complete-next-steps">
              <h4>Что дальше?</h4>
              <div className="next-step-item">
                <span className="step-number">1</span>
                <span>Ваше первое окно голодания начинается сейчас. Удачи!</span>
              </div>
              <div className="next-step-item">
                <span className="step-number">2</span>
                <span>Прогресс отображается на главной странице</span>
              </div>
              <div className="next-step-item">
                <span className="step-number">3</span>
                <span>Настройки можно изменить в любое время</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fasting-ob-footer">
        {step === 0 && (
          <>
            <Button fullWidth onClick={handleNext}>
              Начать <ChevronRight size={20} />
            </Button>
            <p className="fasting-disclaimer">
              Проконсультируйтесь с врачом перед началом любой программы голодания, 
              особенно если у вас есть проблемы со здоровьем.
            </p>
          </>
        )}
        
        {(step === 1 || step === 2) && (
          <Button 
            fullWidth 
            onClick={handleNext}
            disabled={!canProceed() || saving}
            loading={saving}
          >
            Далее <ChevronRight size={20} />
          </Button>
        )}
        
        {step === 3 && (
          <Button fullWidth onClick={handleStartFasting} className="btn-success">
            Начать моё голодание
          </Button>
        )}
      </footer>
    </div>
  );
}
