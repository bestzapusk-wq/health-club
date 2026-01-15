import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Sunrise, Sun, Moon, Apple } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import './DiaryPage.css';

const MEAL_ICONS = {
  breakfast: { icon: Sunrise, label: 'Завтрак', color: '#F59E0B' },
  lunch: { icon: Sun, label: 'Обед', color: '#22C55E' },
  dinner: { icon: Moon, label: 'Ужин', color: '#8B5CF6' },
  snack: { icon: Apple, label: 'Перекус', color: '#EC4899' },
};

export default function DiaryPage() {
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('food_diary') || '[]');
    setMeals(saved);
  }, []);

  const deleteMeal = (id) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    localStorage.setItem('food_diary', JSON.stringify(updated));
  };

  // Группировка по дням
  const groupedByDay = meals.reduce((acc, meal) => {
    const date = new Date(meal.date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(meal);
    return acc;
  }, {});

  const today = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="diary-page">
      <header className="diary-header">
        <button className="back-btn" onClick={() => navigate('/food')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Дневник питания</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="diary-content">
        {meals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>Пока пусто</h3>
            <p>Записывайте приёмы пищи, чтобы отслеживать питание</p>
            <button className="add-first-btn" onClick={() => navigate('/food')}>
              <Plus size={20} />
              Добавить первую запись
            </button>
          </div>
        ) : (
          <>
            {Object.entries(groupedByDay).map(([date, dayMeals]) => (
              <div key={date} className="day-group">
                <h3 className="day-title">
                  {date === today ? 'Сегодня' : date}
                </h3>

                <div className="meals-list">
                  {dayMeals.map((meal) => {
                    const mealInfo = MEAL_ICONS[meal.type] || MEAL_ICONS.snack;
                    const Icon = mealInfo.icon;

                    return (
                      <div key={meal.id} className="meal-entry">
                        <div 
                          className="meal-badge"
                          style={{ backgroundColor: mealInfo.color }}
                        >
                          <Icon size={16} />
                        </div>

                        <div className="meal-info">
                          <div className="meal-header">
                            <span className="meal-type">{mealInfo.label}</span>
                            <span className="meal-time">
                              {new Date(meal.date).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {meal.content?.type === 'photo' && (
                            <img 
                              src={meal.content.data} 
                              alt="" 
                              className="meal-photo"
                            />
                          )}

                          {meal.content?.type === 'text' && (
                            <p className="meal-text">{meal.content.data}</p>
                          )}
                        </div>

                        <button 
                          className="delete-btn"
                          onClick={() => deleteMeal(meal.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
