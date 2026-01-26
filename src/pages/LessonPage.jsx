import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, CheckCircle, Play,
  Clock, AlertCircle, BookOpen, Users, MessageCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  getModuleBySlug, 
  getNextLesson,
  getPrevLesson 
} from '../data/learningModules';
import './LessonPage.css';

const LessonPage = () => {
  const { moduleSlug, lessonSlug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lesson'); // lesson | task | feed
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  const module = getModuleBySlug(moduleSlug);
  const lesson = module?.lessons.find(l => l.slug === lessonSlug);
  const nextLesson = getNextLesson(moduleSlug, lessonSlug);
  const prevLesson = getPrevLesson(moduleSlug, lessonSlug);

  useEffect(() => {
    if (lesson) {
      checkProgress();
    }
  }, [lessonSlug, moduleSlug]);

  const checkProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !lesson) return;
      
      setUserId(user.id);

      const { data } = await supabase
        .from('user_lesson_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .single();

      if (data?.status === 'completed') {
        setCompleted(true);
      } else {
        setCompleted(false);
      }
    } catch (error) {
      setCompleted(false);
    }
  };

  const markAsCompleted = async () => {
    if (!userId || !lesson) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: lesson.id,
          status: 'completed',
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (!error) {
        setCompleted(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToNextLesson = () => {
    if (nextLesson) {
      navigate(`/learning/${nextLesson.moduleSlug}/${nextLesson.slug}`);
    }
  };

  const goToPrevLesson = () => {
    if (prevLesson) {
      navigate(`/learning/${prevLesson.moduleSlug}/${prevLesson.slug}`);
    }
  };

  if (!module || !lesson) {
    return (
      <div className="lesson-not-found">
        <p>Урок не найден</p>
        <button onClick={() => navigate('/learning')}>К обучению</button>
      </div>
    );
  }

  const lessonIndex = module.lessons.findIndex(l => l.slug === lessonSlug);

  return (
    <div className="lesson-page">
      {/* Шапка */}
      <header className="lesson-header">
        <button className="back-btn" onClick={() => navigate(`/learning/${moduleSlug}`)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-info">
          <span className="module-badge" style={{ background: module.color }}>
            {module.icon} {module.title}
          </span>
          <h1>Шаг {lesson.orderIndex}. {lesson.title}</h1>
        </div>
      </header>

      {/* Табы */}
      <div className="lesson-tabs">
        <button 
          className={`tab ${activeTab === 'lesson' ? 'active' : ''}`}
          onClick={() => setActiveTab('lesson')}
        >
          <BookOpen size={18} />
          <span>Урок</span>
        </button>
        <button 
          className={`tab ${activeTab === 'task' ? 'active' : ''}`}
          onClick={() => setActiveTab('task')}
        >
          <AlertCircle size={18} />
          <span>Задание</span>
          {lesson.isStopLesson && <span className="tab-badge">!</span>}
        </button>
        <button 
          className={`tab ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <MessageCircle size={18} />
          <span>Лента</span>
        </button>
      </div>

      {/* Контент табов */}
      <div className="lesson-content">
        
        {/* ТАБ: Урок */}
        {activeTab === 'lesson' && (
          <div className="tab-content">
            {/* Видео */}
            <div className="video-wrapper">
              <div className="video-container">
                <iframe
                  src={`https://www.youtube.com/embed/${lesson.youtubeId || 'MSC-BAUrglM'}`}
                  title={lesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="video-meta">
                <span>Урок {lessonIndex + 1} из {module.lessons.length}</span>
                <span className="duration">
                  <Clock size={14} />
                  {lesson.duration}
                </span>
              </div>
            </div>

            {/* Описание */}
            <div className="lesson-description">
              <h3>О чём этот урок</h3>
              <p>
                {lesson.description || `В этом уроке мы разберём тему "${lesson.title}". 
                Вы узнаете ключевые принципы и получите практические рекомендации, 
                которые сможете применить уже сегодня.`}
              </p>
              <p>
                Посмотрите видео полностью, а затем выполните задание в следующей вкладке. 
                Это поможет закрепить материал и получить максимум пользы от обучения.
              </p>
            </div>

            {/* Кнопка перехода к заданию */}
            {lesson.isStopLesson && (
              <button 
                className="go-to-task-btn"
                onClick={() => setActiveTab('task')}
                style={{ background: module.color }}
              >
                <AlertCircle size={20} />
                Перейти к заданию
              </button>
            )}
          </div>
        )}

        {/* ТАБ: Задание */}
        {activeTab === 'task' && (
          <div className="tab-content">
            {lesson.isStopLesson && lesson.taskDescription ? (
              <>
                <div className="task-card">
                  <div className="task-header">
                    <div className="task-icon" style={{ background: module.color }}>
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h3>Задание к уроку</h3>
                      <span className="task-type">Стоп-урок</span>
                    </div>
                  </div>
                  <p className="task-text">{lesson.taskDescription}</p>
                </div>

                {/* Статус выполнения */}
                {completed ? (
                  <div className="completed-banner">
                    <CheckCircle size={24} />
                    <div>
                      <span className="completed-title">Задание выполнено!</span>
                      <span className="completed-subtitle">Можете переходить к следующему уроку</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="task-warning">
                      <AlertCircle size={18} />
                      <p>Выполните задание и отметьте урок как пройденный</p>
                    </div>
                    <button 
                      className="complete-btn"
                      onClick={markAsCompleted}
                      disabled={loading}
                      style={{ background: module.color }}
                    >
                      <CheckCircle size={20} />
                      {loading ? 'Сохранение...' : 'Отметить как пройденное'}
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="no-task">
                <CheckCircle size={48} />
                <h3>Задания нет</h3>
                <p>Этот урок не требует выполнения задания</p>
                {!completed && (
                  <button 
                    className="complete-btn"
                    onClick={markAsCompleted}
                    disabled={loading}
                    style={{ background: module.color }}
                  >
                    <CheckCircle size={20} />
                    {loading ? 'Сохранение...' : 'Отметить как пройденное'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ТАБ: Лента */}
        {activeTab === 'feed' && (
          <div className="tab-content">
            <div className="feed-empty">
              <Users size={48} />
              <h3>Лента ответов</h3>
              <p>Здесь будут отображаться ответы других участников</p>
              <span className="coming-soon">Скоро</span>
            </div>
          </div>
        )}
      </div>

      {/* Навигация внизу */}
      <div className="lesson-nav">
        <button 
          className="nav-btn prev" 
          onClick={goToPrevLesson}
          disabled={!prevLesson}
        >
          <ArrowLeft size={18} />
          Назад
        </button>

        <div className="nav-dots">
          {module.lessons.slice(0, 10).map((l, i) => (
            <div 
              key={l.id}
              className={`dot ${i === lessonIndex ? 'active' : ''} ${i < lessonIndex ? 'done' : ''}`}
              style={{ background: i <= lessonIndex ? module.color : '#e0e0e0' }}
            />
          ))}
          {module.lessons.length > 10 && <span className="more-dots">...</span>}
        </div>

        {nextLesson ? (
          <button 
            className="nav-btn next"
            onClick={goToNextLesson}
            disabled={!completed}
            style={{ 
              background: completed ? module.color : '#ccc',
              opacity: completed ? 1 : 0.6 
            }}
          >
            Далее
            <ArrowRight size={18} />
          </button>
        ) : (
          <button 
            className="nav-btn next done"
            onClick={() => navigate('/learning')}
            disabled={!completed}
            style={{ opacity: completed ? 1 : 0.6 }}
          >
            Готово
            <CheckCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonPage;
