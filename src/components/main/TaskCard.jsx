import { Check, ChevronRight } from 'lucide-react';
import './TaskCard.css';

export default function TaskCard({ step, title, subtitle, completed, onClick }) {
  return (
    <button 
      className={`task-card ${completed ? 'completed' : ''}`}
      onClick={onClick}
    >
      <div className={`task-step ${completed ? 'done' : ''}`}>
        {completed ? <Check size={18} /> : step}
      </div>
      
      <div className="task-info">
        <span className="task-title">{title}</span>
        <span className="task-subtitle">{subtitle}</span>
      </div>
      
      <ChevronRight size={20} className="task-arrow" />
    </button>
  );
}

