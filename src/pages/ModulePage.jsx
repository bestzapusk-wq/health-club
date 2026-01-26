import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, PlayCircle, CheckCircle, Lock, 
  Clock, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getModuleBySlug } from '../data/learningModules';
import './ModulePage.css';

const ModulePage = () => {
  const { moduleSlug } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  const module = getModuleBySlug(moduleSlug);

  useEffect(() => {
    if (module) {
      loadProgress();
    }
  }, [moduleSlug]);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, status')
        .eq('user_id', user.id);

      if (data) {
        const progressMap = {};
        data.forEach(p => {
          progressMap[p.lesson_id] = p.status;
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!module) {
    return (
      <div className="module-not-found">
        <p>Модуль не найден</p>
        <button onClick={() => navigate('/learning')}>К обучению</button>
      </div>
    );
  }

  const getLessonStatus = (lesson, index) => {
    const status = progress[lesson.id];
    if (status === 'completed') return 'completed';
    
    // Первый урок всегда доступен
    if (index === 0) return 'available';
    
    // Проверяем, завершён ли предыдущий урок
    const prevLesson = module.lessons[index - 1];
    const prevStatus = progress[prevLesson.id];
    
    if (prevStatus === 'completed') return 'available';
    return 'locked';
  };

  const completedCount = module.lessons.filter(
    l => progress[l.id] === 'completed'
  ).length;

  const progressPercentage = Math.round((completedCount / module.lessons.length) * 100);

  return (
    <div className="module-page">
      {/* Шапка с цветом модуля */}
      <header className="module-header" style={{ '--module-color': module.color }}>
        <button className="module-back-btn" onClick={() => navigate('/learning')}>
          <ArrowLeft size={24} />
        </button>
        
        <div className="module-header-content">
          <div className="module-icon-large">{module.icon}</div>
          <h1>{module.title}</h1>
          <p className="module-description">{module.description}</p>
          
          <div className="module-stats">
            <div className="module-progress-info">
              <div className="module-progress-bar-header">
                <div 
                  className="module-progress-fill-header"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span>{completedCount} из {module.lessons.length} уроков пройдено</span>
            </div>
          </div>
        </div>
      </header>

      {/* Список уроков */}
      <div className="lessons-list">
        {module.lessons.map((lesson, index) => {
          const status = getLessonStatus(lesson, index);
          const isCompleted = status === 'completed';
          const isLocked = status === 'locked';

          return (
            <div
              key={lesson.slug}
              className={`lesson-card ${status}`}
              onClick={() => !isLocked && navigate(`/learning/${moduleSlug}/${lesson.slug}`)}
            >
              <div 
                className="lesson-number"
                style={{ 
                  background: isCompleted ? module.color : isLocked ? '#e0e0e0' : '#f5f5f5',
                  color: isCompleted ? 'white' : isLocked ? '#999' : module.color
                }}
              >
                {isCompleted ? (
                  <CheckCircle size={20} />
                ) : isLocked ? (
                  <Lock size={16} />
                ) : (
                  <span>{lesson.orderIndex}</span>
                )}
              </div>

              <div className="lesson-content">
                <div className="lesson-header">
                  {lesson.isStopLesson && (
                    <span className="stop-lesson-badge">
                      <AlertCircle size={12} />
                      Стоп-урок
                    </span>
                  )}
                  <h3 className="lesson-title">{lesson.title}</h3>
                </div>
                
                {lesson.description && (
                  <p className="lesson-description">{lesson.description}</p>
                )}

                <div className="lesson-meta">
                  <span className="lesson-duration">
                    <Clock size={14} />
                    {lesson.duration}
                  </span>
                  {isCompleted && (
                    <span className="completed-badge">Пройдено</span>
                  )}
                </div>
              </div>

              {!isLocked && (
                <PlayCircle 
                  size={32} 
                  className="play-icon"
                  style={{ color: isCompleted ? '#4CAF50' : module.color }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Подсказка внизу */}
      <div className="module-hint">
        <AlertCircle size={16} />
        <span>Стоп-уроки требуют выполнения задания перед продолжением</span>
      </div>
    </div>
  );
};

export default ModulePage;
