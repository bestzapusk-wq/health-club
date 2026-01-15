import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Play, Flame } from 'lucide-react';
import { COURSES } from '../../data/courses';
import './CoursesSection.css';

export default function CoursesSection() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  
  const freeCourses = COURSES.filter(c => c.isFree);
  const paidCourses = COURSES.filter(c => !c.isFree);

  const openCourse = (id) => {
    navigate(`/course/${id}`);
  };

  return (
    <div className="courses-section">
      {/* Filter */}
      <div className="courses-filter">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button 
          className={filter === 'free' ? 'active' : ''}
          onClick={() => setFilter('free')}
        >
          Бесплатные
        </button>
        <button 
          className={filter === 'paid' ? 'active' : ''}
          onClick={() => setFilter('paid')}
        >
          Программы
        </button>
      </div>

      {/* Free courses */}
      {(filter === 'all' || filter === 'free') && freeCourses.length > 0 && (
        <div className="courses-group">
          <h3>💚 Бесплатно</h3>
          <div className="courses-grid free">
            {freeCourses.map(course => (
              <FreeCourseCard key={course.id} course={course} onClick={() => openCourse(course.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Paid courses */}
      {(filter === 'all' || filter === 'paid') && paidCourses.length > 0 && (
        <div className="courses-group">
          <h3>⭐ Программы восстановления</h3>
          
          {/* Featured - first paid course */}
          <FeaturedCourseCard course={paidCourses[0]} onClick={() => openCourse(paidCourses[0].id)} />
          
          {/* Grid - rest */}
          {paidCourses.length > 1 && (
            <div className="courses-grid paid">
              {paidCourses.slice(1).map(course => (
                <PaidCourseCard key={course.id} course={course} onClick={() => openCourse(course.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FreeCourseCard({ course, onClick }) {
  return (
    <button className="course-card free" onClick={onClick}>
      <div className="course-image">
        <img src={course.image} alt={course.title} />
        <span className="free-badge">Бесплатно</span>
        {course.tag && <span className="course-tag">{course.tag}</span>}
      </div>
      <div className="course-info">
        <h4>{course.title}</h4>
        <p>{course.description}</p>
        <div className="course-meta">
          <span><BookOpen size={14} /> {course.lessons} уроков</span>
          <span><Clock size={14} /> {course.duration}</span>
        </div>
      </div>
      <div className="course-btn free">
        <Play size={16} /> Смотреть
      </div>
    </button>
  );
}

function FeaturedCourseCard({ course, onClick }) {
  return (
    <button className="course-card featured" onClick={onClick}>
      <div className="course-image large">
        <img src={course.image} alt={course.title} />
        {course.tag && (
          <span className="course-tag hot">
            <Flame size={14} /> {course.tag}
          </span>
        )}
      </div>
      
      <div className="course-content">
        <h3>{course.title}</h3>
        {course.subtitle && <p className="subtitle">{course.subtitle}</p>}
        <p className="description">{course.description}</p>
        
        {course.features && (
          <div className="course-features">
            {course.features.slice(0, 4).map((f, i) => (
              <div key={i} className="feature">{f}</div>
            ))}
          </div>
        )}
        
        <div className="course-price">
          <span className="price">{course.price.toLocaleString()} ₸</span>
          {course.oldPrice && (
            <span className="old-price">{course.oldPrice.toLocaleString()} ₸</span>
          )}
        </div>
        
        <div className="course-btn paid">Подробнее</div>
      </div>
    </button>
  );
}

function PaidCourseCard({ course, onClick }) {
  return (
    <button className="course-card paid" onClick={onClick}>
      <div className="course-image">
        <img src={course.image} alt={course.title} />
        {course.tag && <span className="course-tag">{course.tag}</span>}
      </div>
      <div className="course-info">
        <h4>{course.title}</h4>
        {course.subtitle && <p className="subtitle">{course.subtitle}</p>}
        <div className="course-meta">
          <span><BookOpen size={14} /> {course.lessons} уроков</span>
        </div>
        <div className="course-price">
          <span className="price">{course.price.toLocaleString()} ₸</span>
          {course.oldPrice && (
            <span className="old-price">{course.oldPrice.toLocaleString()} ₸</span>
          )}
        </div>
      </div>
    </button>
  );
}

