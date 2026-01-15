import { ChevronLeft } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import './SurveyHeader.css';

export default function SurveyHeader({ current, total, onBack }) {
  return (
    <header className="survey-header">
      <div className="survey-header-top">
        <button className="survey-back" onClick={onBack}>
          <ChevronLeft size={20} />
          <span>Назад</span>
        </button>
        <h1 className="survey-title">Опросник здоровья</h1>
        <span className="survey-counter">{current}/{total}</span>
      </div>
      <ProgressBar value={current} max={total} size="sm" />
    </header>
  );
}
