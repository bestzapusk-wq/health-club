import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Users, MessageCircle } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { getProgramById } from '../data/programs';
import './ProgramDetailPage.css';

export default function ProgramDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showFooter, setShowFooter] = useState(false);

  const program = getProgramById(id);

  // Показываем footer после прокрутки
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Показываем footer после прокрутки 300px
      setShowFooter(scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!program) {
    return (
      <div className="program-detail-page">
        <header className="program-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </button>
          <span>Программа</span>
          <div style={{ width: 40 }} />
        </header>
        <div className="program-not-found">
          <span className="not-found-icon">🔍</span>
          <h2>Программа не найдена</h2>
          <p>Возможно, она была удалена или перемещена</p>
          <button className="back-to-materials" onClick={() => navigate('/materials')}>
            Вернуться к материалам
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleWhatsApp = () => {
    const phone = '77001234567'; // Замените на реальный номер
    const message = encodeURIComponent(program.whatsapp_message);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const discount = Math.round((1 - program.price / program.old_price) * 100);

  return (
    <div className="program-detail-page">
      {/* Header */}
      <header className="program-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <span>Программа</span>
        <div style={{ width: 40 }} />
      </header>

      <main className="program-content">
        {/* Hero Section - Чистый экспертный дизайн */}
        <div className="program-hero-clean">
          {program.tag && (
            <span 
              className="program-tag-clean"
              style={{ background: `${program.tagColor}15`, color: program.tagColor }}
            >
              {program.tag}
            </span>
          )}
          
          <h1 className="program-title-clean">{program.title}</h1>
          <p className="program-subtitle-clean">{program.subtitle}</p>
          
          {program.hook && (
            <p className="program-hook-clean">{program.hook}</p>
          )}
          
          <div className="program-stats-clean">
            <div className="stat-item-clean">
              <Clock size={18} />
              <span>{program.duration}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item-clean">
              <Users size={18} />
              <span>{program.reviews_count}+ прошли</span>
            </div>
          </div>
        </div>

        {/* Video Section */}
        {program.video_url && (
          <div className="program-video-section">
            <div className="video-wrapper">
              <iframe
                src={program.video_url}
                title={`Видео о программе ${program.title}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="program-description">
          <h2>О программе</h2>
          <p>{program.full_description}</p>
        </div>

        {/* Benefits */}
        {program.benefits && program.benefits.length > 0 && (
          <div className="program-benefits">
            <h2>Результаты программы</h2>
            <ul>
              {program.benefits.map((benefit, index) => (
                <li key={index}>
                  <span className="benefit-check">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        <div className="program-steps">
          <h2 className="steps-heading">Что вас ждёт</h2>
          <div className="steps-list-clean">
            {program.steps.map((step, index) => (
              <div key={index} className="step-item-clean">
                <div className="step-number-clean">{index + 1}</div>
                <div className="step-content-clean">
                  <h4 className="step-title-clean">{step.title}</h4>
                  <p className="step-desc-clean">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Badge */}
        <div className="program-reviews">
          <Star size={20} className="star-icon" />
          <span className="reviews-count">{program.reviews_count}+</span>
          <span className="reviews-text">человек уже прошли программу</span>
        </div>
      </main>

      {/* Sticky Footer with Price - появляется после скролла */}
      <div className={`program-footer ${showFooter ? 'visible' : ''}`}>
        <div className="price-block">
          <div className="price-current">
            {formatPrice(program.price)} {program.currency}
          </div>
          {program.old_price && (
            <div className="price-old">
              <span className="old-value">{formatPrice(program.old_price)} {program.currency}</span>
              <span className="discount-badge">-{discount}%</span>
            </div>
          )}
        </div>
        <button className="cta-button" onClick={handleWhatsApp}>
          <MessageCircle size={20} />
          <span>Хочу на программу</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
