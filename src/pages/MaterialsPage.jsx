import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, ChevronRight, ChevronLeft, Star, ArrowRight, ChevronDown, Calendar, Users, ExternalLink } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { ZOOM_CALLS, STREAMS, VIDEOS, SEMINARS } from '../data/materials';
import { getAllPrograms } from '../data/programs';
import './MaterialsPage.css';

// Программы из data/programs.js
const PROGRAMS = getAllPrograms().map(p => ({
  id: p.id,
  title: p.title,
  subtitle: p.subtitle,
  description: p.short_description,
  hook: p.hook,
  price: p.price,
  oldPrice: p.old_price,
  tag: p.tag,
  tagColor: p.tagColor,
  students: p.reviews_count,
  duration: p.duration,
}));

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'seminars', label: '🎯 Семинары' },
  { id: 'streams', label: 'Эфиры' },
  { id: 'videos', label: 'Видео' },
];

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const sliderRef = useRef(null);

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 300;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToFree = () => {
    document.querySelector('.free-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="materials-page">
      <main className="materials-content">
        
        {/* === ПРОДАЮЩИЙ БЛОК: ПРОГРАММЫ === */}
        <section className="programs-section">
          <div className="programs-header">
            <div>
              <h1>Программы</h1>
              <p>Выберите свою проблему</p>
            </div>
            <div className="slider-controls">
              <button onClick={() => scrollSlider('left')} className="slider-btn">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => scrollSlider('right')} className="slider-btn">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="programs-slider" ref={sliderRef}>
            {PROGRAMS.map((program) => (
              <div 
                key={program.id} 
                className="program-card-clean"
                onClick={() => navigate(`/program/${program.id}`)}
              >
                {program.tag && (
                  <span 
                    className="program-card-tag-clean"
                    style={{ background: `${program.tagColor}15`, color: program.tagColor }}
                  >
                    {program.tag}
                  </span>
                )}
                
                <h3 className="program-card-title-clean">{program.title}</h3>
                <p className="program-card-subtitle-clean">{program.subtitle}</p>
                <p className="program-card-desc-clean">{program.description}</p>
                
                <div className="program-card-meta-clean">
                  <span className="meta-item">
                    <Clock size={14} />
                    {program.duration}
                  </span>
                  <span className="meta-item">
                    <Users size={14} />
                    {program.students}+
                  </span>
                </div>
                
                <div className="program-card-footer-clean">
                  <div className="program-card-price-clean">
                    <span className="price">{program.price.toLocaleString()} ₸</span>
                    <span className="old-price">{program.oldPrice.toLocaleString()} ₸</span>
                  </div>
                  <button className="program-card-btn-clean">
                    Подробнее <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Индикатор скролла вниз */}
          <button className="scroll-hint" onClick={scrollToFree}>
            <span>Бесплатные материалы</span>
            <ChevronDown size={20} />
          </button>
        </section>

        {/* === БЕСПЛАТНЫЕ МАТЕРИАЛЫ === */}
        <section className="free-section">
          
          {/* Фильтры */}
          <div className="filters">
            {FILTERS.map(f => (
              <button
                key={f.id}
                className={filter === f.id ? 'active' : ''}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Секция Семинаров с регистрацией */}
          {(filter === 'all' || filter === 'seminars') && (
            <SeminarsSection seminars={SEMINARS} />
          )}
          
          {(filter === 'all' || filter === 'streams') && (
            <Section 
              title="Эфиры" 
              items={STREAMS}
            />
          )}
          
          {(filter === 'all' || filter === 'videos') && (
            <VideoSection 
              title="Полезные видео" 
              items={VIDEOS}
            />
          )}
        </section>

      </main>

      <BottomNav />
    </div>
  );
}

// Секция семинаров с регистрацией (стиль как у видео)
function SeminarsSection({ seminars }) {
  const [registering, setRegistering] = useState(null);
  const [registered, setRegistered] = useState(() => {
    const stored = localStorage.getItem('registered_seminars');
    return stored ? JSON.parse(stored) : [];
  });

  const handleRegister = (seminarId, e) => {
    e.stopPropagation();
    setRegistering(seminarId);
    setTimeout(() => {
      const updated = [...registered, seminarId];
      setRegistered(updated);
      localStorage.setItem('registered_seminars', JSON.stringify(updated));
      setRegistering(null);
    }, 800);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h3>🎯 Семинары</h3>
      </div>
      <div className="cards-row">
        {seminars.map(seminar => {
          const isRegistered = registered.includes(seminar.id);
          const isLoading = registering === seminar.id;
          
          return (
            <div 
              key={seminar.id} 
              className={`video-card seminar-card ${isRegistered ? 'registered' : ''}`}
              style={{ '--accent': seminar.color }}
            >
              <div className="seminar-thumb" style={{ background: seminar.color }}>
                <span className="seminar-emoji">{seminar.emoji}</span>
                <div className="seminar-date-badge">
                  <Calendar size={12} />
                  {seminar.date}
                </div>
              </div>
              <div className="video-info">
                <h4>{seminar.title}</h4>
                <p className="video-desc">{seminar.description}</p>
                <button 
                  className={`seminar-btn ${isRegistered ? 'done' : ''} ${isLoading ? 'loading' : ''}`}
                  onClick={(e) => !isRegistered && handleRegister(seminar.id, e)}
                  disabled={isRegistered || isLoading}
                >
                  {isLoading ? '...' : isRegistered ? '✓ Записан' : 'Записаться'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Секция видео с YouTube ссылками
function VideoSection({ title, items }) {
  const openVideo = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="section">
      <div className="section-header">
        <h3>{title}</h3>
      </div>
      <div className="cards-row">
        {items.map(item => (
          <div key={item.id} className="video-card" onClick={() => openVideo(item.videoUrl)}>
            <div className="thumb">
              <img src={item.thumbnail} alt={item.title} />
              <span className="duration">
                <Clock size={12} />
                {item.duration}
              </span>
              <div className="play-overlay">
                <Play size={28} fill="white" />
              </div>
              <div className="youtube-badge">
                <ExternalLink size={12} /> YouTube
              </div>
            </div>
            <div className="video-info">
              <h4>{item.title}</h4>
              <p className="video-desc">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Секция эфиров
function Section({ title, items }) {
  return (
    <div className="section">
      <div className="section-header">
        <h3>{title}</h3>
      </div>
      <div className="cards-row">
        {items.map(item => (
          <div key={item.id} className="video-card">
            <div className="thumb">
              <img src={item.thumbnail} alt={item.title} />
              <span className="duration">
                <Clock size={12} />
                {item.duration}
              </span>
              <div className="play-overlay">
                <Play size={28} fill="white" />
              </div>
            </div>
            <div className="video-info">
              <h4>{item.title}</h4>
              {item.date && <span className="date">{item.date}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
