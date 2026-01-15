import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Flame, ChevronLeft, ChevronRight, Check, X, Heart, FileText, Plus, ChevronRight as ArrowRight, Trash2, Loader } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { getAllRecipes } from '../lib/recipesService';
import './MealPlanPage.css';

const MEAL_TYPES = [
  { id: 'breakfast', name: 'Завтрак' },
  { id: 'lunch', name: 'Обед' },
  { id: 'dinner', name: 'Ужин' },
  { id: 'snack', name: 'Перекус' },
];

const MEAL_NAMES = {
  breakfast: 'завтрак',
  lunch: 'обед',
  dinner: 'ужин',
  snack: 'перекус'
};

// Fallback рецепты на случай ошибки загрузки
const FALLBACK_RECIPES = [
  {
    id: 'fallback-1',
    name: 'Омлет с авокадо',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
    time: 15,
    calories: 320,
    tags: ['Быстро', 'Белок'],
    meal: 'breakfast',
    ingredients: ['2 яйца', '1/2 авокадо', 'Соль, перец'],
    steps: ['Взбейте яйца', 'Приготовьте на сковороде', 'Добавьте авокадо']
  },
];

export default function MealPlanPage() {
  const navigate = useNavigate();
  const [day, setDay] = useState(1);
  const [activeMeal, setActiveMeal] = useState('breakfast');
  const [viewMode, setViewMode] = useState('swiper'); // 'swiper' | 'list'
  
  // Рецепты из Supabase
  const [allRecipes, setAllRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // Выбранные и пропущенные
  const [selectedRecipes, setSelectedRecipes] = useState(() => {
    const stored = localStorage.getItem('meal_plan');
    return stored ? JSON.parse(stored) : [];
  });
  const [skipped, setSkipped] = useState([]);
  
  // Состояния свайпа
  const [swiping, setSwiping] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    return !localStorage.getItem('meal_swipe_hint_seen');
  });
  
  const cardRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Загрузка рецептов из Supabase
  useEffect(() => {
    async function loadRecipes() {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        const data = await getAllRecipes();
        setAllRecipes(data.all);
      } catch (error) {
        console.error('Failed to load recipes:', error);
        setLoadError('Не удалось загрузить рецепты');
        setAllRecipes(FALLBACK_RECIPES);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadRecipes();
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    localStorage.setItem('meal_plan', JSON.stringify(selectedRecipes));
  }, [selectedRecipes]);

  const today = new Date();
  const currentDate = new Date(today);
  currentDate.setDate(today.getDate() + day - 1);
  const dateStr = currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  // Получить выбранные рецепты для текущего дня и приёма пищи
  const getSelectedForMeal = (mealId) => {
    return selectedRecipes.filter(r => r.day === day && r.meal === mealId);
  };

  const currentMealSelected = getSelectedForMeal(activeMeal);

  // Фильтруем рецепты: только для текущего типа, убираем уже выбранные и пропущенные
  const availableRecipes = allRecipes.filter(r => 
    r.meal === activeMeal && 
    !selectedRecipes.some(s => s.id === r.id && s.meal === activeMeal && s.day === day) &&
    !skipped.some(s => s.id === r.id && s.meal === activeMeal && s.day === day)
  );
  const currentRecipe = availableRecipes[0];

  // Все рецепты этого типа
  const allMealRecipes = allRecipes.filter(r => r.meal === activeMeal);
  
  // Проверяем сколько рецептов ещё НЕ выбрано (без учёта пропущенных)
  const notSelectedRecipes = allMealRecipes.filter(r => 
    !selectedRecipes.some(s => s.id === r.id && s.meal === activeMeal && s.day === day)
  );
  
  // Определяем какой режим показывать
  const showSwiper = viewMode === 'swiper' || currentMealSelected.length === 0;
  const hasAvailableRecipes = availableRecipes.length > 0;
  const hasMoreToSelect = notSelectedRecipes.length > 0; // Есть ли ещё невыбранные

  const handleSwipe = (direction) => {
    if (!currentRecipe) return;
    setSwiping(direction);
    
    // Скрываем подсказку после первого свайпа
    if (showSwipeHint) {
      setShowSwipeHint(false);
      localStorage.setItem('meal_swipe_hint_seen', 'true');
    }
    
    setTimeout(() => {
      if (direction === 'right') {
        const newSelected = [...selectedRecipes, { ...currentRecipe, day, meal: activeMeal }];
        setSelectedRecipes(newSelected);
      } else if (direction === 'left') {
        setSkipped([...skipped, { id: currentRecipe.id, day, meal: activeMeal }]);
      }
      setSwiping(null);
      setDragOffset({ x: 0, y: 0 });
    }, 300);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = (touch.clientY - startPos.current.y) * 0.3;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (Math.abs(dragOffset.x) > 100) {
      handleSwipe(dragOffset.x > 0 ? 'right' : 'left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleAddMore = () => {
    // Сбрасываем пропущенные для текущего дня и приёма пищи
    setSkipped(skipped.filter(s => !(s.day === day && s.meal === activeMeal)));
    setViewMode('swiper');
  };

  const handleDone = () => {
    setViewMode('list');
  };

  const handleRemoveRecipe = (recipeId) => {
    setSelectedRecipes(selectedRecipes.filter(r => 
      !(r.id === recipeId && r.day === day && r.meal === activeMeal)
    ));
    setDetailRecipe(null);
  };

  const openRecipeDetails = (recipe) => {
    setDetailRecipe(recipe);
  };

  // При смене таба проверяем есть ли выбранные
  const handleMealChange = (mealId) => {
    setActiveMeal(mealId);
    setSkipped([]);
    const mealSelected = selectedRecipes.filter(r => r.day === day && r.meal === mealId);
    if (mealSelected.length > 0) {
      setViewMode('list');
    } else {
      setViewMode('swiper');
    }
  };

  // Вычисляем rotation и opacity на основе перетаскивания
  const rotation = dragOffset.x * 0.1;
  const cardStyle = isDragging || swiping ? {
    transform: swiping === 'left' 
      ? 'translateX(-150%) rotate(-30deg)' 
      : swiping === 'right' 
        ? 'translateX(150%) rotate(30deg)' 
        : `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
    transition: swiping ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
    opacity: swiping ? 0 : 1
  } : {};

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="meal-plan-page">
        <header className="meal-plan-header">
          <button className="back-btn" onClick={() => navigate('/food')} aria-label="Назад">
            <ArrowLeft size={22} />
          </button>
          <span className="header-title">Загрузка...</span>
          <div style={{ width: 36 }} />
        </header>
        
        <div className="loading-container">
          <Loader size={40} className="loading-spinner" />
          <p>Загружаем рецепты...</p>
        </div>
        
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="meal-plan-page">
      {/* Header */}
      <header className="meal-plan-header">
        <button className="back-btn" onClick={() => navigate('/food')} aria-label="Назад">
          <ArrowLeft size={22} />
        </button>
        <div className="header-center">
          <button className="day-arrow" onClick={() => setDay(Math.max(1, day - 1))} aria-label="Предыдущий день">
            <ChevronLeft size={20} />
          </button>
          <span className="header-title">День {day}, {dateStr}</span>
          <button className="day-arrow" onClick={() => setDay(day + 1)} aria-label="Следующий день">
            <ChevronRight size={20} />
          </button>
        </div>
        <div style={{ width: 36 }} />
      </header>

      {/* Error Banner */}
      {loadError && (
        <div className="error-banner">
          <span>⚠️ {loadError}</span>
        </div>
      )}

      {/* Meal Type Tabs */}
      <div className="meal-tabs-container">
        <div className="meal-tabs">
          {MEAL_TYPES.map(meal => {
            const selected = getSelectedForMeal(meal.id).length > 0;
            const isActive = activeMeal === meal.id;
            return (
              <button
                key={meal.id}
                className={`meal-tab ${isActive ? 'active' : ''} ${selected ? 'selected' : ''}`}
                onClick={() => handleMealChange(meal.id)}
              >
                {selected && <Check size={14} className="tab-check" />}
                <span>{meal.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      {showSwiper && hasAvailableRecipes ? (
        <>
          {/* Подсказка о свайпах */}
          {showSwipeHint && (
            <div className="swipe-hint">
              <span>👈 Свайпни влево — не хочу</span>
              <span>Свайпни вправо — хочу! 👉</span>
            </div>
          )}
          
          {/* Swiper Mode */}
          <div className="cards-area">
            <div 
              ref={cardRef}
              className={`recipe-card ${swiping ? `swiping-${swiping}` : ''}`}
              style={cardStyle}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Swipe indicators */}
              <div 
                className="swipe-indicator nope" 
                style={{ opacity: Math.min(1, Math.max(0, -dragOffset.x / 100)) }}
              >
                <X size={24} />
                <span>НЕТ</span>
              </div>
              <div 
                className="swipe-indicator like" 
                style={{ opacity: Math.min(1, Math.max(0, dragOffset.x / 100)) }}
              >
                <Heart size={24} />
                <span>ДА</span>
              </div>

              {/* Recipe Image */}
              <div className="recipe-image-container">
                <img 
                  src={currentRecipe.image} 
                  alt={currentRecipe.name}
                  className="recipe-image"
                  draggable={false}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
                  }}
                />
                {/* Counter badge */}
                <div className="recipe-counter">
                  {allRecipes.filter(r => r.meal === activeMeal).length - availableRecipes.length + 1} из {allRecipes.filter(r => r.meal === activeMeal).length}
                </div>
              </div>

              {/* Recipe Info */}
              <div className="recipe-info">
                <h2 className="recipe-title">{currentRecipe.name}</h2>
                <div className="recipe-meta">
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>{currentRecipe.time} мин</span>
                  </div>
                  {currentRecipe.calories > 0 && (
                    <div className="meta-item">
                      <Flame size={16} />
                      <span>{currentRecipe.calories} ккал</span>
                    </div>
                  )}
                </div>
                {currentRecipe.tags && currentRecipe.tags.length > 0 && (
                  <div className="recipe-tags">
                    {currentRecipe.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="recipe-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className="action-btn btn-skip" 
              onClick={() => handleSwipe('left')}
            >
              <X size={24} />
              <span>Нет</span>
            </button>
            <button 
              className="action-btn btn-like" 
              onClick={() => handleSwipe('right')}
            >
              <Heart size={24} />
              <span>Да!</span>
            </button>
            <button 
              className="action-btn btn-recipe" 
              onClick={() => openRecipeDetails(currentRecipe)}
            >
              <FileText size={24} />
              <span>Инфо</span>
            </button>
          </div>

          {/* Done button if already has selections */}
          {currentMealSelected.length > 0 && (
            <div className="done-button-container">
              <button className="done-button" onClick={handleDone}>
                <Check size={16} />
                <span>К списку ({currentMealSelected.length})</span>
              </button>
            </div>
          )}
        </>
      ) : showSwiper && !hasAvailableRecipes && currentMealSelected.length === 0 ? (
        /* No recipes at all */
        <div className="cards-area">
          <div className="no-recipes-card">
            <div className="no-recipes-emoji">🍽️</div>
            <h3>Рецепты закончились</h3>
            <p>Для этого приёма пищи пока нет доступных рецептов</p>
          </div>
        </div>
      ) : (
        /* List Mode */
        <div className="selected-list-container">
          <div className="selected-list-header">
            <h2>Ваш {MEAL_NAMES[activeMeal]}:</h2>
          </div>

          <div className="selected-recipes-list">
            {currentMealSelected.map(recipe => (
              <button 
                key={recipe.id} 
                className="selected-recipe-card"
                onClick={() => openRecipeDetails(recipe)}
              >
                <img 
                  src={recipe.image} 
                  alt={recipe.name}
                  className="selected-recipe-image"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
                  }}
                />
                <div className="selected-recipe-info">
                  <div className="selected-recipe-title">{recipe.name}</div>
                  <div className="selected-recipe-time">
                    <Clock size={14} />
                    <span>{recipe.time} мин</span>
                  </div>
                </div>
                <ArrowRight size={20} className="selected-recipe-arrow" />
              </button>
            ))}

            {/* Add more button */}
            {hasMoreToSelect ? (
              <button className="add-more-btn" onClick={handleAddMore}>
                <Plus size={20} />
                <span>Добавить ещё рецепт</span>
              </button>
            ) : (
              <div className="all-selected-msg">
                ✅ Все рецепты для {MEAL_NAMES[activeMeal]}а выбраны!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {detailRecipe && (
        <div className="recipe-detail-overlay" onClick={() => setDetailRecipe(null)}>
          <div className="recipe-detail-modal" onClick={e => e.stopPropagation()}>
            <header className="detail-header">
              <button className="detail-back" onClick={() => setDetailRecipe(null)}>
                <ArrowLeft size={22} />
                <span>Рецепт</span>
              </button>
              <button className="detail-close" onClick={() => setDetailRecipe(null)}>
                <X size={22} />
              </button>
            </header>

            <div className="detail-content">
              <div className="detail-image-container">
                <img 
                  src={detailRecipe.image} 
                  alt={detailRecipe.name}
                  className="detail-image"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
                  }}
                />
              </div>

              <div className="detail-info">
                <div className="detail-card">
                  <h1 className="detail-title">{detailRecipe.name}</h1>
                  <div className="detail-meta">
                    <div className="detail-meta-item">
                      <Clock size={16} />
                      <span>{detailRecipe.time} мин</span>
                    </div>
                    {detailRecipe.calories > 0 && (
                      <div className="detail-meta-item">
                        <Flame size={16} />
                        <span>{detailRecipe.calories} ккал</span>
                      </div>
                    )}
                  </div>

                  {detailRecipe.description && (
                    <p className="detail-description">{detailRecipe.description}</p>
                  )}
                </div>
              </div>

              {detailRecipe.ingredients && detailRecipe.ingredients.length > 0 && (
                <div className="detail-section">
                  <h3>Ингредиенты</h3>
                  <ul className="detail-ingredients">
                    {detailRecipe.ingredients.map((ing, i) => (
                      <li key={i}>{typeof ing === 'string' ? ing : ing.name || ing.ingredient}</li>
                    ))}
                  </ul>
                </div>
              )}

              {detailRecipe.steps && detailRecipe.steps.length > 0 && (
                <div className="detail-section">
                  <h3>Приготовление</h3>
                  <ol className="detail-steps">
                    {detailRecipe.steps.map((step, i) => (
                      <li key={i}>{typeof step === 'string' ? step : step.description || step.step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Remove button - only if this recipe is selected */}
              {currentMealSelected.some(r => r.id === detailRecipe.id) && (
                <button 
                  className="remove-recipe-btn"
                  onClick={() => handleRemoveRecipe(detailRecipe.id)}
                >
                  <Trash2 size={18} />
                  <span>Убрать из плана</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
