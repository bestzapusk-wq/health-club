import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Check, ChevronRight, Loader2, FileCheck, ClipboardList, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateReport } from '../lib/generateReport';
import './UpdateReportPage.css';

// Только симптомы (yesno вопросы)
const SYMPTOM_QUESTIONS = [
  { id: 's1', text: 'Слабость, повышенная утомляемость?', image: 'https://static.tildacdn.com/tild6461-6539-4266-b730-343037346539/1.png', symptom: 'fatigue' },
  { id: 's2', text: 'Хроническая усталость?', image: 'https://static.tildacdn.com/tild3264-3735-4638-b537-363630623534/5.png', symptom: 'chronic_fatigue' },
  { id: 's3', text: 'Раздражительность, перепады настроения?', image: 'https://static.tildacdn.com/tild6364-3533-4330-b339-396265613936/3.png', symptom: 'irritability' },
  { id: 's4', text: 'Сухость слизистых (губы, нос, глаза)?', image: 'https://static.tildacdn.com/tild3365-6430-4966-a262-636338666432/49.png', symptom: 'dry_mucous' },
  { id: 's5', text: 'Тёмные круги под глазами?', image: 'https://static.tildacdn.com/tild6230-6639-4461-a336-366165303865/30.jpeg', symptom: 'dark_circles' },
  { id: 's6', text: 'Частые простуды, вирусные заболевания?', image: 'https://static.tildacdn.com/tild3263-6232-4361-a565-316632363864/59.png', symptom: 'frequent_colds' },
  { id: 's7', text: 'Отёки лица, век, ног?', image: 'https://static.tildacdn.com/tild3562-3031-4465-a264-386530376636/29.jpeg', symptom: 'edema' },
  { id: 's8', text: 'Бледная кожа?', image: 'https://static.tildacdn.com/tild3861-6263-4139-b637-646230613034/33.jpeg', symptom: 'pale_skin' },
  { id: 's9', text: 'Тяга к сладкому и мучному?', image: 'https://static.tildacdn.com/tild6466-3131-4366-a131-623362303562/52.jpeg', symptom: 'sugar_cravings' },
  { id: 's10', text: 'Постоянное чувство голода?', image: 'https://static.tildacdn.com/tild3863-3035-4230-b764-346664653036/54.png', symptom: 'constant_hunger' },
  { id: 's11', text: 'Ломкость, выпадение волос?', image: 'https://static.tildacdn.com/tild6462-3138-4166-b431-356138613434/41.jpeg', symptom: 'hair_loss' },
  { id: 's12', text: 'Мышечные боли, судороги?', image: 'https://static.tildacdn.com/tild3839-3631-4730-a262-653837373063/44.jpeg', symptom: 'muscle_pain' },
  { id: 's13', text: 'Непереносимость холода?', image: 'https://static.tildacdn.com/tild6234-6163-4534-b038-663763323833/45.png', symptom: 'cold_intolerance' },
  { id: 's14', text: 'Вздутие, тяжесть в животе?', image: 'https://static.tildacdn.com/tild3061-3132-4139-b939-623333663563/62.png', symptom: 'bloating' },
  { id: 's15', text: 'Изжога, рефлюкс?', image: 'https://static.tildacdn.com/tild6332-3265-4465-b564-613737336661/63.png', symptom: 'reflux' },
  { id: 's16', text: 'Запоры?', image: 'https://static.tildacdn.com/tild3262-6539-4238-b539-363132653030/64.png', symptom: 'constipation' },
  { id: 's17', text: 'Потливость днём и ночью?', image: 'https://static.tildacdn.com/tild3938-6132-4336-b431-303437333531/69.png', symptom: 'sweating' },
  { id: 's18', text: 'Проблемы со сном?', image: 'https://static.tildacdn.com/tild6564-6535-4036-a339-333961663632/71.jpeg', symptom: 'sleep_problems' },
  { id: 's19', text: 'Головокружение при вставании?', image: 'https://static.tildacdn.com/tild3138-3735-4034-b033-623133376639/7.png', symptom: 'orthostatic' },
  { id: 's20', text: 'Апатия, низкая мотивация?', image: 'https://static.tildacdn.com/tild6562-6531-4364-b364-323935383837/9.png', symptom: 'apathy' },
];

export default function UpdateReportPage() {
  const navigate = useNavigate();
  // 'menu' | 'symptoms' | 'upload' | 'generating'
  const [step, setStep] = useState('menu');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [files, setFiles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUserId(parsed.id);
    }
  }, []);

  const currentQuestion = SYMPTOM_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / SYMPTOM_QUESTIONS.length) * 100;

  const handleAnswer = (answer) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    if (currentQuestionIndex < SYMPTOM_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Опросник завершён, возвращаемся в меню
      setSurveyCompleted(true);
      setStep('menu');
    }
  };

  const handleBack = () => {
    if (step === 'menu') {
      navigate(-1);
      return;
    }
    if (step === 'upload') {
      setStep('menu');
      return;
    }
    if (step === 'symptoms') {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      } else {
        setStep('menu');
      }
      return;
    }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!userId) {
      setError('Пользователь не найден');
      return;
    }

    setStep('generating');
    setIsGenerating(true);
    setError(null);

    try {
      // 1. Загружаем файлы в Storage и сохраняем в БД
      for (const file of files) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileType = fileExt === 'pdf' ? 'pdf' : 'image';
        const filePath = `${userId}/${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('health-files')
          .upload(filePath, file);

        if (!uploadError) {
          // Сохраняем запись в БД
          await supabase.from('uploaded_files').insert({
            user_id: userId,
            file_name: file.name,
            file_type: fileType,
            file_size: file.size,
            file_path: filePath
          });
        }
      }

      // 3. Сохраняем ответы опросника (симптомы) если был пройден
      if (surveyCompleted && Object.keys(answers).length > 0) {
        await supabase.from('survey_responses').insert({
          user_id: userId,
          answers: answers,
          is_update: true,
          symptoms_only: true,
          completed_at: new Date().toISOString()
        });
      }

      // 4. Генерируем новый разбор
      await generateReport(userId);

      // 5. Переходим на страницу разбора
      navigate('/report');

    } catch (err) {
      console.error('Error updating report:', err);
      setError('Произошла ошибка. Попробуйте ещё раз.');
      setStep('upload');
    } finally {
      setIsGenerating(false);
    }
  };

  // Экран генерации
  if (step === 'generating') {
    return (
      <div className="update-report-page">
        <div className="generating-state">
          <div className="generating-icon">
            <Loader2 size={48} className="spinning" />
          </div>
          <h2>Обновляем анализ</h2>
          <p>AI анализирует ваши данные...</p>
          <p className="generating-hint">Это займёт 1-2 минуты</p>
        </div>
      </div>
    );
  }

  // Экран загрузки файлов
  if (step === 'upload') {
    return (
      <div className="update-report-page">
        <header className="update-header">
          <button className="back-btn" onClick={handleBack}>
            <ArrowLeft size={22} />
          </button>
          <span className="header-title">Загрузка анализов</span>
          <div style={{ width: 40 }} />
        </header>

        <main className="update-content">
          <div className="upload-section">
            <div className="upload-icon">📄</div>
            <h2>Загрузите новые анализы</h2>
            <p>Добавьте PDF или фото результатов анализов</p>

            <label className="upload-area">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Upload size={32} />
              <span>Нажмите чтобы выбрать файлы</span>
            </label>

            {files.length > 0 && (
              <div className="files-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <FileCheck size={18} />
                    <span className="file-name">{file.name}</span>
                    <button 
                      className="remove-file-btn"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="error-message">{error}</div>
            )}

            <button 
              className="submit-btn"
              onClick={handleSubmit}
              disabled={(files.length === 0 && !surveyCompleted) || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="spinning" />
                  Загружаем...
                </>
              ) : (
                <>
                  Обновить анализ
                  <ChevronRight size={18} />
                </>
              )}
            </button>

            <button 
              className="skip-btn"
              onClick={() => navigate(-1)}
            >
              Отмена
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Экран опросника (симптомы)
  if (step === 'symptoms') {
    return (
      <div className="update-report-page">
        <header className="update-header">
          <button className="back-btn" onClick={handleBack}>
            <ArrowLeft size={22} />
          </button>
          <span className="header-title">Симптомы</span>
          <span className="header-progress">{currentQuestionIndex + 1}/{SYMPTOM_QUESTIONS.length}</span>
        </header>

        {/* Progress bar */}
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <main className="update-content">
          <div className="question-card">
            {currentQuestion.image && (
              <div className="question-image">
                <img src={currentQuestion.image} alt="" />
              </div>
            )}
            
            <h2 className="question-text">{currentQuestion.text}</h2>

            <div className="yesno-buttons">
              <button 
                className="yesno-btn yes"
                onClick={() => handleAnswer(true)}
              >
                <Check size={20} />
                Да, есть
              </button>
              <button 
                className="yesno-btn no"
                onClick={() => handleAnswer(false)}
              >
                Нет
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Экран меню (выбор действия)
  return (
    <div className="update-report-page">
      <header className="update-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={22} />
        </button>
        <span className="header-title">Обновить анализ</span>
        <div style={{ width: 40 }} />
      </header>

      <main className="update-content">
        <div className="menu-section">
          <h2>Что хотите сделать?</h2>
          <p>Пройдите опросник и загрузите анализы для обновления</p>

          <div className="menu-cards">
            {/* Опросник */}
            <button 
              className={`menu-card ${surveyCompleted ? 'completed' : ''}`}
              onClick={() => {
                setCurrentQuestionIndex(0);
                setAnswers({});
                setSurveyCompleted(false);
                setStep('symptoms');
              }}
            >
              <div className="menu-card-icon">
                {surveyCompleted ? <Check size={28} /> : <ClipboardList size={28} />}
              </div>
              <div className="menu-card-content">
                <span className="menu-card-title">Пройти опросник</span>
                <span className="menu-card-subtitle">
                  {surveyCompleted ? 'Пройден — нажмите чтобы пройти заново' : 'Обновить симптомы'}
                </span>
              </div>
              <ChevronRight size={20} className="menu-card-arrow" />
            </button>

            {/* Загрузка анализов */}
            <button 
              className={`menu-card ${files.length > 0 ? 'completed' : ''}`}
              onClick={() => setStep('upload')}
            >
              <div className="menu-card-icon">
                {files.length > 0 ? <Check size={28} /> : <FileText size={28} />}
              </div>
              <div className="menu-card-content">
                <span className="menu-card-title">Загрузить анализы</span>
                <span className="menu-card-subtitle">
                  {files.length > 0 ? `Загружено ${files.length} файл(ов)` : 'PDF или фото'}
                </span>
              </div>
              <ChevronRight size={20} className="menu-card-arrow" />
            </button>
          </div>

          {/* Кнопка "Обновить анализ" */}
          <button 
            className="submit-btn main-submit"
            onClick={handleSubmit}
            disabled={!surveyCompleted && files.length === 0}
          >
            Обновить анализ
            <ChevronRight size={18} />
          </button>

          {!surveyCompleted && files.length === 0 && (
            <p className="menu-hint">Пройдите опросник или загрузите анализы</p>
          )}
        </div>
      </main>
    </div>
  );
}
