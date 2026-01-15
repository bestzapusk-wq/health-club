import { ChevronLeft, Clock } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import './SurveyHeader.css';

export default function SurveyHeader({ current, total, onBack }) {
  // Рассчитываем оставшееся время (~15 сек на вопрос)
  const remainingQuestions = total - current;
  const remainingMinutes = Math.max(1, Math.ceil(remainingQuestions * 0.25));
  
  return (
    <header className="survey-header">
      <div className="survey-header-top">
        <button className="survey-back" onClick={onBack} aria-label="Назад">
          <ChevronLeft size={20} />
          <span>Назад</span>
        </button>
        <h1 className="survey-title">Опросник здоровья</h1>
        <span className="survey-counter">{current}/{total}</span>
      </div>
      <ProgressBar value={current} max={total} size="sm" />
      <div className="survey-remaining">
        <Clock size={14} />
        <span>Осталось ~{remainingMinutes} мин</span>
      </div>
    </header>
  );
}
