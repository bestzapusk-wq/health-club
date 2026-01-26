import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { bestPlatesData, mealTypeLabels } from '../../data/bestPlates';
import './BestPlatesCarousel.css';

const BestPlatesCarousel = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  return (
    <section className="best-plates-section">
      <div className="best-plates-header">
        <div className="best-plates-title">
          <Trophy size={20} className="trophy-icon" />
          <h2>Лучшие тарелки недели</h2>
        </div>
      </div>

      <div className="plates-carousel" ref={scrollRef}>
        {bestPlatesData.map((plate, index) => (
          <div 
            key={plate.id}
            className="plate-card"
            onClick={() => navigate(`/food/plate/${plate.id}`)}
          >
            {/* Бейдж с номером */}
            <div className="plate-rank">#{index + 1}</div>
            
            {/* Изображение */}
            <div className="plate-image">
              <img 
                src={plate.imageUrl} 
                alt={plate.dishName}
                onError={(e) => {
                  e.target.onerror = null; // предотвращаем бесконечный цикл
                  e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140"><rect fill="#f0f0f0" width="140" height="140"/><text x="50%" y="50%" fill="#999" font-size="40" text-anchor="middle" dy=".3em">🍽️</text></svg>');
                }}
              />
              {/* Тип приёма пищи */}
              <span className="meal-type-badge">
                {mealTypeLabels[plate.mealType]}
              </span>
            </div>

            {/* Информация */}
            <div className="plate-info">
              <span className="plate-owner">{plate.ownerName}</span>
              <span className="plate-dish">{plate.dishName}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BestPlatesCarousel;
