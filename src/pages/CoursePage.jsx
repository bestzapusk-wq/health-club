import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, BookOpen, Clock, Star, Users, Check, Lock, CreditCard, Shield } from 'lucide-react';
import { COURSES } from '../data/courses';
import './CoursePage.css';

export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const course = COURSES.find(c => c.id === id);

  if (!course) {
    return (
      <div className="course-page">
        <header className="course-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
        </header>
        <div className="course-not-found">
          <p>Курс не найден</p>
        </div>
      </div>
    );
  }

  const discount = course.oldPrice 
    ? Math.round((1 - course.price / course.oldPrice) * 100) 
    : 0;

  return (
    <div className="course-page">
      <header className="course-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <span className="header-title">{course.isFree ? 'Бесплатный курс' : 'Программа'}</span>
      </header>

      <main className="course-main">
        {/* Hero */}
        <div className="course-hero">
          <img src={course.image} alt={course.title} />
          <button className="play-trailer">
            <Play size={32} />
            <span>Смотреть трейлер</span>
          </button>
        </div>

        {/* Title */}
        <div className="course-title-block">
          <h1>{course.title}</h1>
          {course.subtitle && <p className="subtitle">{course.subtitle}</p>}
          
          {/* Stats */}
          {(course.rating || course.students) && (
            <div className="course-stats">
              {course.rating && (
                <span className="stat">
                  <Star size={16} fill="#F59E0B" color="#F59E0B" />
                  {course.rating} ({course.reviews} отзывов)
                </span>
              )}
              {course.students && (
                <span className="stat">
                  <Users size={16} />
                  {course.students} учеников
                </span>
              )}
            </div>
          )}
        </div>

        {/* For whom */}
        {course.forWhom && (
          <section className="course-section">
            <h2>Для кого этот курс:</h2>
            <ul className="for-whom-list">
              {course.forWhom.map((item, i) => (
                <li key={i}><Check size={18} /> {item}</li>
              ))}
            </ul>
          </section>
        )}

        {/* What's inside */}
        <section className="course-section">
          <h2>Что внутри:</h2>
          <div className="whats-inside">
            <div className="inside-item">
              <BookOpen size={20} />
              <span>{course.lessons} видеоуроков</span>
            </div>
            <div className="inside-item">
              <Clock size={20} />
              <span>{course.duration} контента</span>
            </div>
            {course.features && course.features.slice(1).map((f, i) => (
              <div className="inside-item" key={i}>
                <Check size={20} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Modules */}
        {course.modules && (
          <section className="course-section">
            <h2>Программа курса:</h2>
            <div className="modules-list">
              {course.modules.map((module, mi) => (
                <div key={mi} className="module">
                  <div className="module-header">
                    <span className="module-num">{mi + 1}</span>
                    <span className="module-title">{module.title}</span>
                  </div>
                  <div className="module-lessons">
                    {module.lessons.map((lesson, li) => (
                      <div key={li} className="lesson">
                        <Lock size={14} />
                        <span>Урок {li + 1}: {lesson}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="course-bottom">
        {course.isFree ? (
          <button className="cta-btn free">
            <Play size={20} />
            Начать бесплатно
          </button>
        ) : (
          <>
            <div className="price-block">
              <div className="prices">
                <span className="current-price">{course.price.toLocaleString()} ₸</span>
                {course.oldPrice && (
                  <span className="original-price">{course.oldPrice.toLocaleString()} ₸</span>
                )}
              </div>
              {discount > 0 && <span className="discount">-{discount}%</span>}
            </div>
            <button className="cta-btn paid">
              <CreditCard size={20} />
              Купить курс
            </button>
            <div className="payment-info">
              <Shield size={14} />
              <span>Безопасная оплата • Kaspi / карта / рассрочка</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

