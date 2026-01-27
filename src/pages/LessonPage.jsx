import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, CheckCircle, Play,
  Clock, AlertCircle, BookOpen, Users, MessageCircle, Heart, Camera, Video
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  getModuleBySlug, 
  getNextLesson,
  getPrevLesson 
} from '../data/learningModules';
import './LessonPage.css';

// Демо данные ответов других участников
const demoAnswers = [
  {
    id: 1,
    author: 'Айгуль М.',
    avatar: null,
    text: '1. Пить воду утром натощак\n2. Спать не менее 7 часов\n3. Двигаться каждый день минимум 30 минут',
    media: null,
    likes: 12,
    isLiked: false,
    date: '2 часа назад'
  },
  {
    id: 2,
    author: 'Марат К.',
    avatar: null,
    text: 'Главное что понял — нужно начинать с малого и не пытаться изменить всё сразу. Постепенность — ключ к успеху!',
    media: { type: 'image', url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400' },
    likes: 8,
    isLiked: true,
    date: '5 часов назад'
  },
  {
    id: 3,
    author: 'Динара С.',
    avatar: null,
    text: 'Для меня открытие — что сон влияет на всё остальное. Буду ложиться раньше 🌙',
    media: null,
    likes: 24,
    isLiked: false,
    date: 'Вчера'
  }
];

const LessonPage = () => {
  const { moduleSlug, lessonSlug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lesson'); // lesson | task | feed
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // Состояние формы ответа
  const [answer, setAnswer] = useState('');
  const [media, setMedia] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const fileInputRef = useRef(null);
  
  // Состояние ленты
  const [feedAnswers, setFeedAnswers] = useState(demoAnswers);

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

  // Отправка ответа
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    
    console.log({ answer, media, isPrivate });
    setAnswerSubmitted(true);
    
    // После отправки ответа отмечаем урок как выполненный
    if (!completed) {
      await markAsCompleted();
    }
  };

  // Лайк ответа
  const handleLike = (id) => {
    setFeedAnswers(prev => prev.map(a => 
      a.id === id 
        ? { ...a, isLiked: !a.isLiked, likes: a.isLiked ? a.likes - 1 : a.likes + 1 }
        : a
    ));
  };

  // Обработка файла
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? 'video' : 'image'
      });
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
          <div className="tab-content task-content">
            {/* Заголовок задания */}
            <div className="task-header">
              <div className="task-icon" style={{ background: module.color }}>
                <Clock size={20} />
              </div>
              <div className="task-info">
                <h3>Задание к уроку</h3>
                <span className="task-badge">Стоп-урок</span>
              </div>
            </div>

            <p className="task-question">
              {lesson.taskDescription || 'Запишите 3 главных принципа, которые вы усвоили из урока'}
            </p>

            {/* Если ответ уже отправлен */}
            {answerSubmitted ? (
              <div className="completed-banner">
                <CheckCircle size={24} />
                <div>
                  <span className="completed-title">Ответ отправлен!</span>
                  <span className="completed-subtitle">Можете переходить к следующему уроку</span>
                </div>
              </div>
            ) : (
              /* Форма ответа */
              <div className="answer-form">
                <textarea
                  className="answer-textarea"
                  placeholder="Напишите ваш ответ..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value.slice(0, 1000))}
                />
                <div className="char-count">{answer.length}/1000</div>

                <div className="media-buttons">
                  <button className="media-btn" onClick={() => fileInputRef.current?.click()}>
                    <Camera size={16} />
                    Фото
                  </button>
                  <button className="media-btn" onClick={() => fileInputRef.current?.click()}>
                    <Video size={16} />
                    Видео
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    hidden
                  />
                </div>

                {media && (
                  <div className="media-preview">
                    {media.type === 'image' ? (
                      <img src={media.url} alt="" />
                    ) : (
                      <video src={media.url} controls />
                    )}
                    <button className="media-remove" onClick={() => setMedia(null)}>✕</button>
                  </div>
                )}

                <label className="privacy-toggle">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                  />
                  Не показывать в ленте
                </label>

                <button
                  className="submit-answer-btn"
                  disabled={!answer.trim() || loading}
                  onClick={handleSubmitAnswer}
                  style={{ background: module.color }}
                >
                  <CheckCircle size={18} />
                  {loading ? 'Отправка...' : 'Отправить ответ'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ТАБ: Лента */}
        {activeTab === 'feed' && (
          <div className="tab-content feed-content">
            <div className="feed-title">
              <h3>Лента ответов</h3>
              <p>Ответы других участников</p>
            </div>

            {feedAnswers.length === 0 ? (
              <div className="empty-feed">
                <div className="empty-feed-icon">💬</div>
                <p>Лента ответов пуста</p>
                <span>Здесь будут отображаться ответы других участников</span>
              </div>
            ) : (
              feedAnswers.map(item => (
                <div key={item.id} className="answer-card">
                  <div className="answer-header">
                    <div className="answer-avatar">
                      {item.avatar ? (
                        <img src={item.avatar} alt="" />
                      ) : (
                        item.author.split(' ').map(n => n[0]).join('')
                      )}
                    </div>
                    <div className="answer-author">
                      <div className="answer-name">{item.author}</div>
                      <div className="answer-date">{item.date}</div>
                    </div>
                  </div>

                  <div className="answer-text">{item.text}</div>

                  {item.media && (
                    <div className="answer-media">
                      {item.media.type === 'image' ? (
                        <img src={item.media.url} alt="" />
                      ) : (
                        <video src={item.media.url} controls />
                      )}
                    </div>
                  )}

                  <div className="answer-actions">
                    <button
                      className={`like-btn ${item.isLiked ? 'liked' : ''}`}
                      onClick={() => handleLike(item.id)}
                    >
                      <Heart size={16} fill={item.isLiked ? '#e91e63' : 'none'} />
                      {item.likes}
                    </button>
                  </div>
                </div>
              ))
            )}
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
