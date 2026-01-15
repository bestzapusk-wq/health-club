import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle, ArrowRight, ClipboardList, FileUp, Heart, X, Sparkles, Gift, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import UploadModal from '../components/main/UploadModal';
import Onboarding from '../components/onboarding/Onboarding';
import HabitsTracker from '../components/habits/HabitsTracker';
import { supabase } from '../lib/supabase';
import { generateReport } from '../lib/generateReport';
import './MainPage.css';

const PROGRESS_STEPS = [
  { id: 'survey', label: 'Опросник', icon: ClipboardList },
  { id: 'upload', label: 'Анализы', icon: FileUp },
  { id: 'result', label: 'Результат', icon: CheckCircle },
];

export default function MainPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [generateError, setGenerateError] = useState(null);
  
  // Streak state
  const [streakDays, setStreakDays] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(true);
  const [todayCompleted, setTodayCompleted] = useState(false);
  
  const [progress, setProgress] = useState({
    survey: false,
    upload: false,
    submitted: false
  });

  // Check if results are ready (default to true for demo)
  // eslint-disable-next-line no-unused-vars
  const resultsReady = localStorage.getItem('results_ready') !== 'false';

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      navigate('/register');
      return;
    }

    const parsedUserData = JSON.parse(userData);
    setUserId(parsedUserData.id);
    
    const name = localStorage.getItem('user_name');
    setUserName(name || 'Пользователь');

    // Check if onboarding was completed
    const onboardingDone = localStorage.getItem('onboarding_completed');
    if (!onboardingDone) {
      setShowOnboarding(true);
    }

    setProgress({
      survey: localStorage.getItem('survey_completed') === 'true',
      upload: localStorage.getItem('upload_completed') === 'true',
      submitted: localStorage.getItem('data_submitted') === 'true'
    });

    // Загружаем количество файлов из Supabase
    if (parsedUserData.id) {
      loadUploadedFilesCount(parsedUserData.id);
      loadStreakData(parsedUserData.id);
    }
  }, [navigate]);

  // Загрузка данных о прогрессе (общее количество заполненных отчётов)
  const loadStreakData = async (uid) => {
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      
      // Загружаем ВСЕ отчёты пользователя (с submitted_at)
      const { data: reports, error } = await supabase
        .from('daily_reports')
        .select('report_date, submitted_at')
        .eq('user_id', uid)
        .not('submitted_at', 'is', null)
        .order('report_date', { ascending: true });

      if (error) {
        console.error('Error loading streak:', error);
        setStreakLoading(false);
        return;
      }

      // Считаем общее количество заполненных отчётов (максимум 7)
      const completedCount = Math.min(reports?.length || 0, 7);
      
      // Проверяем, заполнен ли отчёт сегодня
      const todayReport = reports?.find(r => r.report_date === todayKey);
      setTodayCompleted(!!todayReport);
      
      // Формируем данные для отображения кружков 1-7
      // Кружки закрашиваются по количеству заполненных отчётов
      const days = [1, 2, 3, 4, 5, 6, 7].map((dayNum) => ({
        dayNum,
        completed: dayNum <= completedCount,
        isLast: dayNum === 7
      }));

      setStreakDays(days);
      setCurrentStreak(completedCount);
    } catch (err) {
      console.error('Streak load error:', err);
    } finally {
      setStreakLoading(false);
    }
  };

  // Обработчик изменения отчёта (для обновления streak)
  const handleReportChange = () => {
    if (userId) {
      loadStreakData(userId);
    }
  };

  const loadUploadedFilesCount = async (uid) => {
    try {
      const { count, error } = await supabase
        .from('uploaded_files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid);

      if (!error && count !== null) {
        setUploadedFilesCount(count);
        if (count > 0) {
          localStorage.setItem('upload_completed', 'true');
          setProgress(prev => ({ ...prev, upload: true }));
        }
      }
    } catch (err) {
      console.error('Error loading files count:', err);
    }
  };

  // Calculate current step (0-based for array index)
  const getCurrentStep = () => {
    if (!progress.survey) return 0; // Опросник
    if (!progress.upload) return 1; // Анализы
    return 2; // Результат
  };
  const currentStep = getCurrentStep();

  const handleSaveFiles = (files) => {
    // files — массив из Supabase
    setUploadedFilesCount(files.length);
    
    if (files.length > 0) {
      localStorage.setItem('upload_completed', 'true');
      setProgress(prev => ({ ...prev, upload: true }));
    } else {
      localStorage.setItem('upload_completed', 'false');
      setProgress(prev => ({ ...prev, upload: false }));
    }
  };

  const handleSubmit = async () => {
    if (!userId || isGenerating) return;

    setIsGenerating(true);
    setGenerateError(null);

    try {
      // Вызываем Edge Function для генерации отчёта
      await generateReport(userId);

      // Успех!
      localStorage.setItem('data_submitted', 'true');
      localStorage.setItem('results_ready', 'true');
      setProgress(prev => ({ ...prev, submitted: true }));
      setShowSuccessModal(true);

    } catch (err) {
      console.error('Generate report error:', err);
      setGenerateError(err.message);
      
      // Всё равно показываем как submitted (демо-данные покажутся)
      localStorage.setItem('data_submitted', 'true');
      setProgress(prev => ({ ...prev, submitted: true }));
      setShowSuccessModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingAction = (action) => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
    
    if (action === 'survey') {
      navigate('/survey');
    } else if (action === 'upload') {
      setShowUploadModal(true);
    }
  };

  const canSubmit = progress.survey && progress.upload && !progress.submitted;

  // Get next step info
  const getNextStepInfo = () => {
    if (!progress.survey) return { text: 'Заполни опросник', action: () => navigate('/survey') };
    if (!progress.upload) return { text: 'Загрузи анализы', action: () => setShowUploadModal(true) };
    if (!progress.submitted) return { text: 'Отправь на разбор', action: handleSubmit };
    return { text: 'Жди результаты', action: null };
  };
  const nextStep = getNextStepInfo();

  // After submitted - show habits tracker
  if (progress.submitted) {
    const allCompleted = currentStreak >= 7;

    return (
      <div className="main-page">
        <Header userName={userName} />
        
        <main className="main-content">
          <div className="main-container">
            
            {/* 7 Days Streak Challenge */}
            <div className={`streak-card ${todayCompleted ? 'today-done' : ''} ${allCompleted ? 'all-done' : ''}`}>
              <div className="streak-header">
                <div className="streak-title-row">
                  <Gift size={16} className="streak-gift-icon" />
                  <h3>7 дней — подарок!</h3>
                </div>
                <div className="streak-count">
                  <span className="streak-num">{currentStreak}</span>
                  <span className="streak-label">/7</span>
                </div>
              </div>

              <div className="streak-days">
                {streakLoading ? (
                  // Skeleton при загрузке
                  [1,2,3,4,5,6,7].map(num => (
                    <div key={num} className="streak-day">
                      <div className="streak-day-circle skeleton">
                        <span>&nbsp;</span>
                      </div>
                    </div>
                  ))
                ) : (
                  streakDays.map((day) => (
                    <div 
                      key={day.dayNum} 
                      className={`streak-day ${day.completed ? 'done' : ''} ${day.isLast ? 'last' : ''}`}
                    >
                      <div className="streak-day-circle">
                        {day.dayNum === 7 ? (
                          <Gift size={14} />
                        ) : day.completed ? (
                          <span>✓</span>
                        ) : (
                          <span>{day.dayNum}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {todayCompleted && !allCompleted && (
                <div className="streak-success-msg">
                  ✓ Сегодня выполнено!
                </div>
              )}

              {allCompleted && (
                <button className="streak-claim-btn" onClick={() => navigate('/materials')}>
                  <Gift size={16} />
                  Забрать подарок!
                </button>
              )}
            </div>

            {/* Трекер привычек */}
            <HabitsTracker onReportChange={handleReportChange} />

          </div>
        </main>

        <BottomNav />

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="success-modal-overlay" onClick={() => setShowSuccessModal(false)}>
            <div className="success-modal" onClick={e => e.stopPropagation()}>
              <button className="success-modal-close" onClick={() => setShowSuccessModal(false)} aria-label="Закрыть">
                <X size={24} />
              </button>
              
              <div className="success-modal-icon">
                <Heart size={48} />
              </div>
              
              <h2>Отлично! Данные получены 🎉</h2>
              <p className="success-modal-subtitle">
                Результаты разбора будут готовы в течение 24 часов
              </p>
              
              <div className="success-modal-divider"></div>
              
              <p className="success-modal-text">
                А пока давайте сделаем первые шаги к здоровью! 
                Начните отслеживать ежедневные привычки.
              </p>
              
              <button className="success-modal-btn" onClick={() => setShowSuccessModal(false)}>
                Начать
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="main-page">
      <Header userName={userName} />
      
      <main className="main-content">
        <div className="main-container">
          
          {/* === ГОРИЗОНТАЛЬНЫЙ ПРОГРЕСС-БАР === */}
          <div className="progress-tracker">
            <div className="progress-header">
              <span className="progress-title">Твой прогресс</span>
              <span className="progress-step-label">Шаг {currentStep + 1} из 3</span>
            </div>
            
            <div className="progress-line">
              {PROGRESS_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isDone = index < currentStep;
                const isActive = index === currentStep;
                
                return (
                  <div key={step.id} className="progress-item">
                    <div className={`progress-node ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                      {isDone ? <CheckCircle size={16} /> : <Icon size={16} />}
                    </div>
                    <span className={`progress-label ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                      {step.label}
                    </span>
                    {index < PROGRESS_STEPS.length - 1 && (
                      <div className={`progress-connector ${isDone ? 'done' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {nextStep.action && (
              <button className="next-step-btn" onClick={nextStep.action}>
                <span>Следующий шаг: {nextStep.text}</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>

          {/* === Карточки задач === */}
          <div className="task-grid">
            <button 
              className={`task-card-new ${progress.survey ? 'done' : ''}`}
              onClick={() => navigate('/survey')}
            >
              <div className="task-icon">
                {progress.survey ? <CheckCircle size={24} /> : <ClipboardList size={24} />}
              </div>
              <div className="task-body">
                <span className="task-label">Опросник</span>
                <span className="task-status">
                  {progress.survey ? 'Готово ✓' : '~5 мин'}
                </span>
              </div>
              {!progress.survey && <ChevronRight size={20} className="task-chevron" />}
            </button>

            <button 
              className={`task-card-new ${progress.upload ? 'done' : ''}`}
              onClick={() => setShowUploadModal(true)}
            >
              <div className="task-icon">
                {progress.upload ? <CheckCircle size={24} /> : <FileUp size={24} />}
              </div>
              <div className="task-body">
                <span className="task-label">Анализы</span>
                <span className="task-status">
                  {progress.upload ? `${uploadedFilesCount} файл(ов) ✓` : 'Загрузить'}
                </span>
              </div>
              {!progress.upload && <ChevronRight size={20} className="task-chevron" />}
            </button>
          </div>

          {/* CTA кнопка */}
          {canSubmit && (
            <button 
              className={`cta-btn ${isGenerating ? 'loading' : ''}`} 
              onClick={handleSubmit}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={22} className="spin" />
                  <span>Генерируем отчёт...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={22} />
                  <span>Получить результаты</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          )}

        </div>
      </main>

      <BottomNav />

      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSave={handleSaveFiles}
        userId={userId}
      />

      {showOnboarding && (
        <Onboarding 
          userName={userName}
          onComplete={handleOnboardingComplete}
          onAction={handleOnboardingAction}
        />
      )}
    </div>
  );
}
