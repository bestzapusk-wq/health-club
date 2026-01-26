import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Users, Star } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { getAllPrograms } from '../data/programs';
import './ProgramsListPage.css';

const programs = getAllPrograms();

export default function ProgramsListPage() {
  const navigate = useNavigate();

  return (
    <div className="programs-list-page">
      {/* Шапка */}
      <header className="programs-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <div className="header-text">
          <h1>Точечные программы</h1>
          <p>Решение конкретных проблем со здоровьем</p>
        </div>
      </header>

      <main className="programs-content">
        <div className="programs-grid">
          {programs.map((program) => (
            <div
              key={program.id}
              className="program-card"
              onClick={() => navigate(`/program/${program.id}`)}
            >
              {program.tag && (
                <span 
                  className="program-tag"
                  style={{ background: program.tagColor }}
                >
                  {program.tag}
                </span>
              )}
              
              <div className="program-icon">
                {program.id.includes('stomach') && '🫃'}
                {program.id.includes('gallbladder') && '🟢'}
                {program.id.includes('gut') && '🦠'}
              </div>
              
              <h3 className="program-title">{program.title}</h3>
              <p className="program-subtitle">{program.subtitle}</p>
              <p className="program-hook">{program.hook}</p>
              
              <div className="program-meta">
                <span className="meta-item">
                  <Clock size={14} />
                  {program.duration}
                </span>
                <span className="meta-item">
                  <Users size={14} />
                  {program.reviews_count}+ участников
                </span>
              </div>

              <div className="program-footer">
                <div className="program-price">
                  <span className="price-current">{program.price.toLocaleString()} ₸</span>
                  {program.old_price && (
                    <span className="price-old">{program.old_price.toLocaleString()} ₸</span>
                  )}
                </div>
                <ChevronRight size={20} className="arrow" />
              </div>
            </div>
          ))}
        </div>

        <div className="programs-info">
          <div className="info-card">
            <Star size={24} />
            <div>
              <h4>Персональный подход</h4>
              <p>Каждая программа адаптируется под ваши анализы и состояние здоровья</p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
