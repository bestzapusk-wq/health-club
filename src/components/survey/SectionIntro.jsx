import { ChevronRight } from 'lucide-react';
import './SectionIntro.css';

export default function SectionIntro({ icon, title, desc, onContinue }) {
  return (
    <div className="section-intro fade-in">
      <div className="section-icon">{icon}</div>
      <h2 className="section-title">{title}</h2>
      <p className="section-desc">{desc}</p>
      <button className="section-continue" onClick={onContinue}>
        Продолжить
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
