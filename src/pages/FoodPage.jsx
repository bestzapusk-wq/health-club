import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Utensils, Coffee, Sun, Moon, Apple, Eye, Trash2, Edit3 } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import AddFoodModal from '../components/food/AddFoodModal';
import FoodAnalysisModal from '../components/food/FoodAnalysisModal';
import './FoodPage.css';

const MEALS = [
  { id: 'breakfast', name: 'Завтрак', icon: Coffee, color: '#F59E0B' },
  { id: 'lunch', name: 'Обед', icon: Sun, color: '#22C55E' },
  { id: 'dinner', name: 'Ужин', icon: Moon, color: '#8B5CF6' },
  { id: 'snack', name: 'Перекус', icon: Apple, color: '#EC4899' },
];

const formatDate = (date) => {
  const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  const months = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЯ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
  
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  const prefix = isToday ? 'СЕГОДНЯ' : isYesterday ? 'ВЧЕРА' : '';
  const dayName = days[date.getDay()];
  const dayNum = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  
  return `${prefix}${prefix ? ' | ' : ''}${dayName}, ${dayNum} ${month}.`;
};

const getDateKey = (date) => date.toISOString().split('T')[0];

export default function FoodPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState(() => {
    const stored = localStorage.getItem('food_tracker');
    return stored ? JSON.parse(stored) : {};
  });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [lastSavedEntry, setLastSavedEntry] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // {mealId, entryIndex}

  const dateKey = getDateKey(currentDate);
  const todayMeals = meals[dateKey] || {};

  const changeDate = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + delta);
    setCurrentDate(newDate);
  };

  const openAddModal = (meal) => {
    setSelectedMeal(meal);
    setShowAddModal(true);
  };

  const openAnalysisModal = (meal) => {
    setSelectedMeal(meal);
    setShowAnalysisModal(true);
  };

  const handleSaveFood = (foodEntry) => {
    if (!selectedMeal) return;

    const updated = {
      ...meals,
      [dateKey]: {
        ...todayMeals,
        [selectedMeal.id]: [...(todayMeals[selectedMeal.id] || []), foodEntry]
      }
    };
    setMeals(updated);
    localStorage.setItem('food_tracker', JSON.stringify(updated));
    
    // Автоматически показываем результат анализа если есть анализ
    if (foodEntry.analysis) {
      const currentMeal = selectedMeal;
      setLastSavedEntry(foodEntry); // Сохраняем для передачи в модалку
      setTimeout(() => {
        setSelectedMeal(currentMeal);
        setShowAnalysisModal(true);
      }, 300);
    }
  };

  const getMealSummary = (mealId) => {
    const items = todayMeals[mealId] || [];
    if (items.length === 0) return null;
    
    const item = items[0];
    // Показываем текст если есть, или время записи
    if (item.text) {
      return item.text;
    }
    return `Добавлено в ${item.time}`;
  };

  const getMealItems = (mealId) => {
    const items = todayMeals[mealId] || [];
    // Если есть свежесохранённая запись для этого meal — обновляем/добавляем её
    if (lastSavedEntry && selectedMeal?.id === mealId) {
      // Заменяем запись с тем же id на свежую (с фото)
      const updatedItems = items.map(item => 
        item.id === lastSavedEntry.id ? lastSavedEntry : item
      );
      // Если записи нет — добавляем
      const exists = items.some(item => item.id === lastSavedEntry.id);
      if (!exists) {
        return [...updatedItems, lastSavedEntry];
      }
      return updatedItems;
    }
    return items;
  };

  // Удаление записи
  const handleDeleteEntry = (mealId, entryIndex) => {
    const mealEntries = todayMeals[mealId] || [];
    const updatedEntries = mealEntries.filter((_, idx) => idx !== entryIndex);
    
    const updated = {
      ...meals,
      [dateKey]: {
        ...todayMeals,
        [mealId]: updatedEntries
      }
    };
    
    // Если записей не осталось, удаляем ключ
    if (updatedEntries.length === 0) {
      delete updated[dateKey][mealId];
    }
    
    setMeals(updated);
    localStorage.setItem('food_tracker', JSON.stringify(updated));
    setShowDeleteConfirm(null);
  };

  return (
    <div className="food-page">
      <header className="food-header">
        <h1>Дневник питания</h1>
      </header>

      {/* Date Selector */}
      <div className="date-selector">
        <div className="date-display">
          <Utensils size={18} />
          <span>{formatDate(currentDate)}</span>
        </div>
        <div className="date-arrows">
          <button onClick={() => changeDate(-1)} aria-label="Предыдущий день">
            <ChevronLeft size={22} />
          </button>
          <button onClick={() => changeDate(1)} aria-label="Следующий день">
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="food-nav">
        <button className="food-nav-btn active" onClick={() => navigate('/food')}>
          <Utensils size={20} />
          <span>Дневник</span>
        </button>
        <button className="food-nav-btn" onClick={() => navigate('/food/plan')}>
          <Apple size={20} />
          <span>План питания</span>
        </button>
      </div>

      <main className="food-content">
        {/* Meals List */}
        <div className="meals-list">
          {MEALS.map(meal => {
            const Icon = meal.icon;
            const summary = getMealSummary(meal.id);
            const items = getMealItems(meal.id);
            const hasItems = items.length > 0;

            return (
              <div key={meal.id} className={`meal-card ${hasItems ? 'has-items' : ''}`}>
                <div className="meal-info" onClick={() => hasItems && openAnalysisModal(meal)}>
                  <div className="meal-icon" style={{ background: `${meal.color}15`, color: meal.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="meal-text">
                    <span className="meal-name">{meal.name}</span>
                    {hasItems ? (
                      <span className="meal-summary">{summary}</span>
                    ) : (
                      <span className="meal-empty">—</span>
                    )}
                  </div>
                </div>

                {hasItems ? (
                  <div className="meal-actions">
                    <button 
                      className="meal-view-btn"
                      onClick={() => openAnalysisModal(meal)}
                    >
                      <Eye size={16} />
                      <span>Разбор</span>
                    </button>
                    <button 
                      className="meal-delete-btn"
                      onClick={() => setShowDeleteConfirm({ mealId: meal.id, entryIndex: 0 })}
                      aria-label="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    className="meal-add-btn"
                    style={{ background: meal.color }}
                    onClick={() => openAddModal(meal)}
                  >
                    <Plus size={18} />
                    <span>Добавить</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Food Modal */}
      <AddFoodModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveFood}
        mealName={selectedMeal?.name || ''}
        mealColor={selectedMeal?.color || '#4A90E2'}
        mealType={selectedMeal?.id || 'lunch'}
      />

      {/* Food Analysis Modal */}
      <FoodAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => {
          setShowAnalysisModal(false);
          setLastSavedEntry(null); // Очищаем после закрытия
        }}
        foodEntries={selectedMeal ? getMealItems(selectedMeal.id) : []}
        mealName={selectedMeal?.name || ''}
        mealColor={selectedMeal?.color || '#4A90E2'}
      />

      <BottomNav />

      {/* Модалка подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="delete-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">🗑️</div>
            <h3>Удалить запись?</h3>
            <p>Это действие нельзя отменить</p>
            <div className="delete-modal-actions">
              <button 
                className="delete-modal-cancel"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Отмена
              </button>
              <button 
                className="delete-modal-confirm"
                onClick={() => handleDeleteEntry(showDeleteConfirm.mealId, showDeleteConfirm.entryIndex)}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
