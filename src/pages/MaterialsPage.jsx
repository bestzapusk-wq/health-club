import { useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Clock, ArrowRight, Users, Dumbbell, Target } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { streams, sportContent } from '../data/materials';
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

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  
  // Рефы для секций
  const streamsRef = useRef(null);
  const analysisRef = useRef(null);
  const sportRef = useRef(null);
  const programsRef = useRef(null);

  // Скролл к нужной секции при открытии
  useEffect(() => {
    if (urlCategory) {
      const refMap = {
        'streams': streamsRef,
        'analysis': analysisRef,
        'sport': sportRef,
        'programs': programsRef,
      };
      
      const targetRef = refMap[urlCategory];
      if (targetRef?.current) {
        setTimeout(() => {
          targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [urlCategory]);

  // Получаем thumbnail из YouTube
  const getThumbnail = (item) => {
    if (item.thumbnail) return item.thumbnail;
    if (item.youtubeId) return `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
    return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400';
  };

  // Группируем по категориям для отображения секциями
  const healthStreams = streams.filter(s => s.category === 'health');
  const analysisStreams = streams.filter(s => s.category === 'analysis');

  return (
    <div className="materials-page">
      <main className="materials-content">

        {/* === ЗАГОЛОВОК СТРАНИЦЫ === */}
        <header className="materials-header">
          <h1>Материалы</h1>
          <p>Эфиры, разборы и тренировки</p>
        </header>

        {/* === ЭФИРЫ И МАТЕРИАЛЫ === */}
        <section className="free-section materials-top">
          
          {/* Секция: Эфиры о здоровье */}
          <div className="section" ref={streamsRef}>
            <div className="section-header">
              <h3>Эфиры о здоровье</h3>
            </div>
            <div className="cards-row">
              {healthStreams.map(stream => (
                <StreamCard 
                  key={stream.id} 
                  stream={stream} 
                  onClick={() => navigate(`/stream/${stream.id}`)}
                  getThumbnail={getThumbnail}
                />
              ))}
            </div>
          </div>

          {/* Секция: Разборы анализов */}
          <div className="section" ref={analysisRef}>
            <div className="section-header">
              <h3>Разборы анализов</h3>
            </div>
            <div className="cards-row">
              {analysisStreams.map(stream => (
                <StreamCard 
                  key={stream.id} 
                  stream={stream} 
                  onClick={() => navigate(`/stream/${stream.id}`)}
                  getThumbnail={getThumbnail}
                />
              ))}
            </div>
          </div>

          {/* Секция: Спорт */}
          <div className="section" ref={sportRef}>
            <div className="section-header">
              <h3>
                <Dumbbell size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Спорт и Питание
              </h3>
            </div>
            <div className="cards-row">
              {sportContent.map(item => (
                <StreamCard 
                  key={item.id} 
                  stream={item} 
                  onClick={() => navigate(`/stream/${item.id}`)}
                  getThumbnail={getThumbnail}
                />
              ))}
            </div>
          </div>

          {/* Секция: Точечные программы */}
          <div className="section programs-grid-section" ref={programsRef}>
            <div className="section-header">
              <h3>
                <Target size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Точечные программы
              </h3>
            </div>
            <div className="programs-grid-full">
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
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}

// Компонент карточки эфира
function StreamCard({ stream, onClick, getThumbnail }) {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="video-card" onClick={onClick}>
      <div className="thumb">
        {stream.youtubeId ? (
          <img src={getThumbnail(stream)} alt={stream.title} />
        ) : (
          <div className="thumb-placeholder">
            <Play size={32} />
          </div>
        )}
        <span className="duration">
          <Clock size={12} />
          {stream.duration}
        </span>
        <div className="play-overlay">
          <Play size={28} fill="white" />
        </div>
        {!stream.youtubeId && (
          <div className="coming-soon-badge">Скоро</div>
        )}
      </div>
      <div className="video-info">
        <h4>{stream.title}</h4>
        <span className="date">{formatDate(stream.date)}</span>
        {stream.files && stream.files.length > 0 && (
          <span className="has-materials">📎 Есть материалы</span>
        )}
      </div>
    </div>
  );
}
