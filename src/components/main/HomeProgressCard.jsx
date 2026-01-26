import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Target, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './HomeProgressCard.css';

export default function HomeProgressCard({ userId }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    surveyCompleted: false,
    filesUploaded: false,
    analysisReady: false,
    analysisProcessing: false,
    findingsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadStatus();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadStatus = async () => {
    try {
      // Проверяем опросник
      const surveyLocal = localStorage.getItem('survey_completed') === 'true';
      let surveyDB = false;
      
      const { data: surveyData } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', userId)
        .or('family_member_id.is.null,profile_type.eq.self')
        .limit(1);
      
      surveyDB = surveyData && surveyData.length > 0;

      // Проверяем файлы
      const { data: filesData } = await supabase
        .from('uploaded_files')
        .select('id')
        .eq('user_id', userId)
        .or('family_member_id.is.null,profile_type.eq.self')
        .limit(1);
      
      const filesUploaded = filesData && filesData.length > 0;

      // Проверяем анализ
      const { data: analysisData } = await supabase
        .from('analysis_results')
        .select('status, critical_markers, warning_markers')
        .eq('user_id', userId)
        .or('family_member_id.is.null,profile_type.eq.self')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let analysisReady = false;
      let analysisProcessing = false;
      let findingsCount = 0;

      if (analysisData) {
        if (analysisData.status === 'completed' || analysisData.status === 'ready') {
          analysisReady = true;
          const criticalCount = analysisData.critical_markers?.length || 0;
          const warningCount = analysisData.warning_markers?.length || 0;
          findingsCount = criticalCount + warningCount;
        } else if (analysisData.status === 'processing') {
          analysisProcessing = true;
        }
      }

      setStatus({
        surveyCompleted: surveyLocal || surveyDB,
        filesUploaded,
        analysisReady,
        analysisProcessing,
        findingsCount
      });
    } catch (err) {
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="home-progress-card loading">
        <Loader2 size={24} className="spinner" />
      </div>
    );
  }

  // Всё готово — показываем карточку с результатом
  if (status.analysisReady) {
    return (
      <div className="home-progress-card ready" onClick={() => navigate('/report')}>
        <div className="progress-icon ready">
          <Target size={24} />
        </div>
        <div className="progress-content">
          <h3>Ваш разбор готов!</h3>
          <p>
            {status.findingsCount > 0 
              ? `Найдено ${status.findingsCount} важных находок`
              : 'Посмотрите результаты'
            }
          </p>
        </div>
        <ChevronRight size={20} className="progress-arrow" />
      </div>
    );
  }

  // Анализ в процессе
  if (status.analysisProcessing) {
    return (
      <div className="home-progress-card processing">
        <div className="progress-icon processing">
          <Loader2 size={24} className="spinner" />
        </div>
        <div className="progress-content">
          <h3>AI анализирует данные</h3>
          <p>Это займёт 1-2 минуты</p>
        </div>
      </div>
    );
  }

  // Пока не заполнены И опросник И анализы — показываем эту карточку
  if (!status.surveyCompleted || !status.filesUploaded) {
    return (
      <div className="home-progress-card health-cta" onClick={() => navigate('/report')}>
        <div className="health-cta-icon">
          <ClipboardList size={28} />
        </div>
        <div className="health-cta-content">
          <h3>Получите разбор здоровья</h3>
          <p>Пройдите опросник и загрузите анализы, чтобы получить персональный AI-разбор</p>
        </div>
        <button className="health-cta-btn">
          Начать
          <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // Всё загружено, но анализ не запущен — кнопка получить результаты
  return (
    <div className="home-progress-card ready-to-analyze" onClick={() => navigate('/report')}>
      <div className="progress-icon ready">
        <Target size={24} />
      </div>
      <div className="progress-content">
        <h3>Всё готово!</h3>
        <p>Нажмите чтобы получить разбор здоровья</p>
      </div>
      <div className="progress-action">
        <span>Получить</span>
        <ChevronRight size={18} />
      </div>
    </div>
  );
}
