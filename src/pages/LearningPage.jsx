import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Lock, CheckCircle, 
  BookOpen, Award, Trophy, Play, Video, Microscope, Dumbbell, Target
} from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { supabase } from '../lib/supabase';
import { learningModules, getTotalLessons } from '../data/learningModules';
import './LearningPage.css';

// Категории материалов
const categories = [
  { id: 'streams', icon: Video, label: 'Эфиры с Экспертами', color: '#667eea' },
  { id: 'analysis', icon: Microscope, label: 'Разборы анализов', color: '#e91e63' },
  { id: 'sport', icon: Dumbbell, label: 'Спорт и Питание', color: '#4caf50' },
  { id: 'programs', icon: Target, label: 'Точечные программы', color: '#ff9800' },
];

const LearningPage = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, status')
        .eq('user_id', user.id);

      if (data && !error) {
        const progressMap = {};
        data.forEach(p => {
          progressMap[p.lesson_id] = p.status;
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (module) => {
    const completedLessons = module.lessons.filter(
      lesson => progress[lesson.id] === 'completed'
    ).length;
    return {
      completed: completedLessons,
      total: module.lessons.length,
      percentage: Math.round((completedLessons / module.lessons.length) * 100)
    };
  };

  const getTotalProgress = () => {
    const totalLessons = getTotalLessons();
    const completedLessons = Object.values(progress).filter(s => s === 'completed').length;
    return {
      completed: completedLessons,
      total: totalLessons,
      percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    };
  };

  const totalProgress = getTotalProgress();

  return (
    <div className="learning-page">
      <main className="learning-content">
        {/* Шапка */}
        <header className="learning-header">
          <h1>Клуб здоровья Alimi Health</h1>
          <p className="header-subtitle">Ваш путь к здоровью начинается здесь</p>
        </header>

        {/* Карточка прогресса */}
        <div className="total-progress-card">
          <div className="progress-left">
            <div className="trophy-icon">
              <Trophy size={24} />
            </div>
            <span className="lessons-done">{totalProgress.completed} из {totalProgress.total} уроков</span>
          </div>
          <div className="progress-right">
            <span className="progress-label">Общий прогресс</span>
            <span className="progress-percentage">{totalProgress.percentage}%</span>
          </div>
          <div className="progress-bar-full">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${totalProgress.percentage}%` }}
            />
          </div>
        </div>

        {/* Заголовок модулей */}
        <div className="section-header">
          <h2>Программа обучения</h2>
          <span className="modules-count">{learningModules.length} модулей</span>
        </div>

        {/* Список модулей */}
        <div className="modules-list">
          {learningModules.map((module, index) => {
            const moduleProgress = getModuleProgress(module);
            const isCompleted = moduleProgress.percentage === 100;
            const isLocked = false;

            return (
              <div 
                key={module.id}
                className={`module-card-new ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => !isLocked && navigate(`/learning/${module.slug}`)}
                style={{ '--accent': module.color }}
              >
                <div className="module-accent-bar" />
                
                <div className="module-body">
                  <div className="module-top-row">
                    <div className="module-icon-circle">
                      <span>{module.icon}</span>
                    </div>
                    <div className="module-info">
                      <h3 className="module-title">{module.title}</h3>
                      <p className="module-desc">{module.description}</p>
                    </div>
                    {isCompleted ? (
                      <CheckCircle size={24} className="module-check" />
                    ) : isLocked ? (
                      <Lock size={20} className="module-lock" />
                    ) : (
                      <ChevronRight size={24} className="module-arrow" />
                    )}
                  </div>

                  <div className="module-bottom-row">
                    <div className="module-stats">
                      <span className="stat-item">
                        <BookOpen size={14} />
                        {module.lessons.length} уроков
                      </span>
                      {moduleProgress.completed > 0 && (
                        <span className="stat-item completed-stat">
                          <Play size={12} />
                          {moduleProgress.completed} пройдено
                        </span>
                      )}
                    </div>
                    <div className="module-mini-progress">
                      <div 
                        className="mini-progress-fill"
                        style={{ width: `${moduleProgress.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Категории материалов - внизу */}
        <div className="section-header" style={{ marginTop: '24px' }}>
          <h2>Материалы</h2>
        </div>
        <div className="categories-vertical">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className="category-card"
                style={{ '--cat-color': cat.color }}
                onClick={() => navigate(`/materials?category=${cat.id}`)}
              >
                <div className="category-card-icon">
                  <Icon size={22} />
                </div>
                <div className="category-card-content">
                  <span className="category-card-label">{cat.label}</span>
                </div>
                <ChevronRight size={20} className="category-card-arrow" />
              </button>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default LearningPage;
