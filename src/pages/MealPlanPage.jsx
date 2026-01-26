import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { 
  ArrowLeft, Settings, Clock, ChevronLeft, ChevronRight, 
  Check, X, Heart, Info, Plus, Trash2, Loader, Beef, Wheat, Droplet
} from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { getAllRecipes } from '../lib/recipesService';
import './MealPlanPage.css';

// Meal types with icons
const MEAL_TYPES = [
  { id: 'breakfast', name: 'Завтрак', icon: '🍳' },
  { id: 'lunch', name: 'Обед', icon: '🥗' },
  { id: 'dinner', name: 'Ужин', icon: '🍝' },
  { id: 'snack', name: 'Перекус', icon: '🍎' },
];

const MEAL_NAMES = {
  breakfast: 'завтрак',
  lunch: 'обед',
  dinner: 'ужин',
  snack: 'перекус'
};

// Fallback recipes
const FALLBACK_RECIPES = [
  {
    id: 'fallback-1',
    name: 'Омлет с авокадо',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
    time: 15,
    protein: 18,
    fats: 22,
    carbs: 12,
    tags: ['Быстро', 'Белок'],
    meal: 'breakfast',
    ingredients: [
      { name: '2 яйца', amount: '' },
      { name: 'Авокадо', amount: '1/2 шт' },
      { name: 'Соль, перец', amount: 'по вкусу' }
    ],
    steps: ['Взбейте яйца', 'Приготовьте на сковороде', 'Добавьте нарезанное авокадо']
  },
];

// Swipeable Card Component
const SwipeableCard = ({ recipe, onLike, onSkip }) => {
  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 300, friction: 20 }
  }));

  const bind = useDrag(({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    const trigger = vx > 0.2;
    const dir = xDir < 0 ? -1 : 1;

    if (!active && trigger && Math.abs(mx) > 50) {
      // Swipe completed
      api.start({
        x: dir * 500,
        rotate: dir * 30,
        scale: 1,
        config: { tension: 200, friction: 25 }
      });
      setTimeout(() => {
        if (dir === 1) {
          onLike();
        } else {
          onSkip();
        }
        api.start({ x: 0, rotate: 0, scale: 1, immediate: true });
      }, 200);
    } else {
      api.start({
        x: active ? mx : 0,
        rotate: active ? mx / 15 : 0,
        scale: active ? 1.02 : 1,
        immediate: name => active && name === 'x',
      });
    }
  }, { axis: 'x' });

  // Calculate indicator opacity
  const likeOpacity = x.to(x => Math.min(Math.max(x / 100, 0), 1));
  const nopeOpacity = x.to(x => Math.min(Math.max(-x / 100, 0), 1));

  return (
    <animated.div
      {...bind()}
      style={{
        x,
        rotate,
        scale,
        touchAction: 'pan-y',
      }}
      className="swipeable-card"
    >
      {/* LIKE indicator */}
      <animated.div 
        className="swipe-indicator like"
        style={{ opacity: likeOpacity }}
      >
        <Heart size={48} fill="currentColor" />
        <span>ДОБАВИТЬ</span>
      </animated.div>

      {/* NOPE indicator */}
      <animated.div 
        className="swipe-indicator nope"
        style={{ opacity: nopeOpacity }}
      >
        <X size={48} strokeWidth={3} />
        <span>ПРОПУСТИТЬ</span>
      </animated.div>

      {/* Card content */}
      <div className="swipe-card">
        <div className="card-image">
          <img 
            src={recipe.image} 
            alt={recipe.name}
            draggable={false}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
            }}
          />
          <div className="image-gradient" />
          
          {/* Meal type badge - only show if meal type exists */}
          {MEAL_TYPES.find(m => m.id === recipe.meal) && (
            <div className="meal-type-badge">
              {MEAL_TYPES.find(m => m.id === recipe.meal)?.icon} {MEAL_TYPES.find(m => m.id === recipe.meal)?.name}
            </div>
          )}
        </div>

        <div className="card-content">
          <h2 className="card-title">{recipe.name}</h2>
          
          <div className="card-meta">
            <span className="meta-item">
              <Clock size={16} />
              {recipe.time} мин
            </span>
            {recipe.protein > 0 && (
              <span className="meta-item">
                <Beef size={16} />
                {recipe.protein}г
              </span>
            )}
            {recipe.fats > 0 && (
              <span className="meta-item">
                <Droplet size={16} />
                {recipe.fats}г
              </span>
            )}
            {recipe.carbs > 0 && (
              <span className="meta-item">
                <Wheat size={16} />
                {recipe.carbs}г
              </span>
            )}
          </div>

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="card-tags">
              {recipe.tags.slice(0, 4).map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </animated.div>
  );
};

// Meal Tabs Component
const MealTabs = ({ activeTab, onTabChange, selectedCounts }) => {
  return (
    <div className="meal-tabs">
      {MEAL_TYPES.map(tab => (
        <button
          key={tab.id}
          className={`meal-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.name}</span>
          
          {selectedCounts[tab.id] > 0 && (
            <span className="tab-count">{selectedCounts[tab.id]}</span>
          )}
        </button>
      ))}
    </div>
  );
};

// Day Navigation Component
const DayNavigation = ({ monthName, onPrevMonth, onNextMonth, onBack }) => {
  return (
    <div className="day-navigation">
      <button className="nav-btn back" onClick={onBack}>
        <ArrowLeft size={22} />
      </button>

      <div className="day-selector">
        <button className="day-arrow-btn" onClick={onPrevMonth}>
          <ChevronLeft size={18} />
        </button>
        <div className="day-info">
          <span className="day-number">{monthName}</span>
        </div>
        <button className="day-arrow-btn" onClick={onNextMonth}>
          <ChevronRight size={18} />
        </button>
      </div>

      <button className="nav-btn settings">
        <Settings size={20} />
      </button>
    </div>
  );
};

// Selection Progress Component
const SelectionProgress = ({ current, total, mealType }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="selection-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="progress-text">
        Просмотрено {current} из {total} на {MEAL_NAMES[mealType]}
      </span>
    </div>
  );
};


// Recipe Detail Modal
const RecipeDetailModal = ({ recipe, isOpen, onClose, onAddToMeal, isSelected, onRemove }) => {
  if (!isOpen || !recipe) return null;

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  return (
    <div className="recipe-modal-overlay" onClick={onClose}>
      <div className="recipe-modal" onClick={e => e.stopPropagation()}>
        
        <div className="modal-image">
          <img 
            src={recipe.image} 
            alt={recipe.name}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
            }}
          />
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          <h1>{recipe.name}</h1>
          
          <div className="recipe-metrics">
            <div className="metric">
              <span className="metric-value">{recipe.time}</span>
              <span className="metric-label">минут</span>
            </div>
            <div className="metric">
              <span className="metric-value">{recipe.protein || 0}г</span>
              <span className="metric-label">белки</span>
            </div>
            <div className="metric">
              <span className="metric-value">{recipe.fats || 0}г</span>
              <span className="metric-label">жиры</span>
            </div>
            <div className="metric">
              <span className="metric-value">{recipe.carbs || 0}г</span>
              <span className="metric-label">углеводы</span>
            </div>
          </div>

          {recipe.description && (
            <p className="recipe-description">{recipe.description}</p>
          )}

          {ingredients.length > 0 && (
            <section className="recipe-section">
              <h2>🥘 Ингредиенты</h2>
              <ul className="ingredients-list">
                {ingredients.map((ing, i) => (
                  <li key={i}>
                    <span className="ing-name">
                      {typeof ing === 'string' ? ing : (ing.name || ing.ingredient)}
                    </span>
                    {typeof ing === 'object' && ing.amount && (
                      <span className="ing-amount">{ing.amount}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {steps.length > 0 && (
            <section className="recipe-section">
              <h2>👨‍🍳 Приготовление</h2>
              <ol className="steps-list">
                {steps.map((step, i) => (
                  <li key={i}>
                    <span className="step-number">{i + 1}</span>
                    <span className="step-text">
                      {typeof step === 'string' ? step : (step.description || step.step)}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <div className="modal-footer">
          {isSelected ? (
            <button className="remove-from-meal-btn" onClick={onRemove}>
              <Trash2 size={20} />
              Убрать из плана
            </button>
          ) : (
            <button className="add-to-meal-btn" onClick={onAddToMeal}>
              <Plus size={20} />
              Добавить в план
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function MealPlanPage() {
  const navigate = useNavigate();
  const [day, setDay] = useState(1);
  const [activeMeal, setActiveMeal] = useState('breakfast');
  const [viewMode, setViewMode] = useState('swiper');
  
  // Recipes from Supabase
  const [allRecipes, setAllRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // Selected and skipped
  const [selectedRecipes, setSelectedRecipes] = useState(() => {
    const stored = localStorage.getItem('meal_plan');
    return stored ? JSON.parse(stored) : [];
  });
  const [skipped, setSkipped] = useState([]);
  
  // Modal state
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [cardKey, setCardKey] = useState(0);

  // Load recipes
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

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('meal_plan', JSON.stringify(selectedRecipes));
  }, [selectedRecipes]);

  // Date calculations
  const today = new Date();
  const currentDate = new Date(today);
  currentDate.setDate(today.getDate() + day - 1);
  const dateStr = currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const monthName = currentDate.toLocaleDateString('ru-RU', { month: 'long' });
  // Capitalize first letter
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Get selected recipes for current day and meal
  const getSelectedForMeal = (mealId) => {
    return selectedRecipes.filter(r => r.day === day && r.meal === mealId);
  };

  // Calculate counts for tabs
  const selectedCounts = MEAL_TYPES.reduce((acc, meal) => {
    acc[meal.id] = getSelectedForMeal(meal.id).length;
    return acc;
  }, {});

  const currentMealSelected = getSelectedForMeal(activeMeal);

  // Filter available recipes
  const availableRecipes = allRecipes.filter(r => 
    r.meal === activeMeal && 
    !selectedRecipes.some(s => s.id === r.id && s.meal === activeMeal && s.day === day) &&
    !skipped.some(s => s.id === r.id && s.meal === activeMeal && s.day === day)
  );
  const currentRecipe = availableRecipes[0];
  
  // All recipes for this meal type
  const allMealRecipes = allRecipes.filter(r => r.meal === activeMeal);
  const viewedCount = allMealRecipes.length - availableRecipes.length;

  // Check what to show
  const hasAvailableRecipes = availableRecipes.length > 0;
  const showSwiper = viewMode === 'swiper' && hasAvailableRecipes;
  // Автоматически переключаемся на список когда всё просмотрено и есть выбранные
  const showNoRecipes = viewMode === 'swiper' && !hasAvailableRecipes && currentMealSelected.length === 0;
  
  // Если всё просмотрено и есть выбранные - сразу показываем список
  useEffect(() => {
    if (!hasAvailableRecipes && currentMealSelected.length > 0 && viewMode === 'swiper') {
      setViewMode('list');
    }
  }, [hasAvailableRecipes, currentMealSelected.length, viewMode]);

  const handleLike = () => {
    if (!currentRecipe) return;
    const newSelected = [...selectedRecipes, { ...currentRecipe, day, meal: activeMeal }];
    setSelectedRecipes(newSelected);
    setCardKey(prev => prev + 1);
  };

  const handleSkip = () => {
    if (!currentRecipe) return;
    setSkipped([...skipped, { id: currentRecipe.id, day, meal: activeMeal }]);
    setCardKey(prev => prev + 1);
  };

  const handleInfo = () => {
    if (currentRecipe) {
      setDetailRecipe(currentRecipe);
    }
  };

  const handleAddMore = () => {
    setSkipped(skipped.filter(s => !(s.day === day && s.meal === activeMeal)));
    setViewMode('swiper');
  };

  const handleViewPlan = () => {
    setViewMode('list');
  };


  const handleRemoveRecipe = (recipeId) => {
    setSelectedRecipes(selectedRecipes.filter(r => 
      !(r.id === recipeId && r.day === day && r.meal === activeMeal)
    ));
    setDetailRecipe(null);
  };

  const handleMealChange = (mealId) => {
    setActiveMeal(mealId);
    setSkipped([]);
    const mealSelected = selectedRecipes.filter(r => r.day === day && r.meal === mealId);
    setViewMode(mealSelected.length > 0 ? 'list' : 'swiper');
  };

  const handleAddFromModal = () => {
    if (detailRecipe) {
      const newSelected = [...selectedRecipes, { ...detailRecipe, day, meal: activeMeal }];
      setSelectedRecipes(newSelected);
      setDetailRecipe(null);
      setCardKey(prev => prev + 1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="meal-plan-page">
        <DayNavigation 
          monthName="..."
          onPrevMonth={() => {}}
          onNextMonth={() => {}}
          onBack={() => navigate('/food')}
        />
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
      {/* Day Navigation */}
      <DayNavigation 
        monthName={capitalizedMonth}
        onPrevMonth={() => {
          // Переход на предыдущий месяц
          const newDate = new Date(currentDate);
          newDate.setMonth(newDate.getMonth() - 1);
          const daysDiff = Math.floor((newDate - today) / (1000 * 60 * 60 * 24)) + 1;
          setDay(Math.max(1, daysDiff));
        }}
        onNextMonth={() => {
          // Переход на следующий месяц
          const newDate = new Date(currentDate);
          newDate.setMonth(newDate.getMonth() + 1);
          const daysDiff = Math.floor((newDate - today) / (1000 * 60 * 60 * 24)) + 1;
          setDay(daysDiff);
        }}
        onBack={() => navigate('/food')}
      />

      {/* Error Banner */}
      {loadError && (
        <div className="error-banner">
          <span>⚠️ {loadError}</span>
        </div>
      )}

      {/* Meal Tabs */}
      <div className="meal-tabs-container">
        <MealTabs 
          activeTab={activeMeal}
          onTabChange={handleMealChange}
          selectedCounts={selectedCounts}
        />
      </div>

      {/* Selection Progress */}
      {showSwiper && allMealRecipes.length > 0 && (
        <SelectionProgress 
          current={viewedCount}
          total={allMealRecipes.length}
          mealType={activeMeal}
        />
      )}

      {/* Main Content */}
      {showSwiper && (
        <>
          {/* Card Stack */}
          <div className="card-stack">
            {/* Background card (next) */}
            {availableRecipes[1] && (
              <div className="stack-card back-card">
                <img 
                  src={availableRecipes[1].image} 
                  alt=""
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
                  }}
                />
              </div>
            )}

            {/* Current card */}
            <SwipeableCard 
              key={cardKey}
              recipe={currentRecipe}
              onLike={handleLike}
              onSkip={handleSkip}
            />
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="action-btn action-skip" onClick={handleSkip}>
              <X size={28} strokeWidth={3} />
            </button>
            <button className="action-btn action-like primary" onClick={handleLike}>
              <Heart size={32} strokeWidth={2.5} fill="currentColor" />
            </button>
            <button className="action-btn action-info" onClick={handleInfo}>
              <Info size={24} />
            </button>
          </div>

          {/* Action Labels */}
          <div className="action-labels">
            <span className="action-label">Нет</span>
            <span className="action-label">Да!</span>
            <span className="action-label">Инфо</span>
          </div>

          {/* Done button if has selections */}
          {currentMealSelected.length > 0 && (
            <div className="done-button-container">
              <button className="done-button" onClick={handleViewPlan}>
                <Check size={18} />
                <span>К списку ({currentMealSelected.length})</span>
              </button>
            </div>
          )}
        </>
      )}


      {/* No Recipes */}
      {showNoRecipes && (
        <div className="cards-area">
          <div className="no-recipes-card">
            <div className="no-recipes-emoji">🍽️</div>
            <h3>Рецепты закончились</h3>
            <p>Для этого приёма пищи пока нет доступных рецептов</p>
          </div>
        </div>
      )}

      {/* List Mode */}
      {viewMode === 'list' && (
        <div className="selected-list-container">
          <div className="selected-list-header">
            <h2>Ваш {MEAL_NAMES[activeMeal]}:</h2>
          </div>

          <div className="selected-recipes-list">
            {currentMealSelected.map(recipe => (
              <button 
                key={recipe.id} 
                className="selected-recipe-card"
                onClick={() => setDetailRecipe(recipe)}
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
                <ChevronRight size={20} className="selected-recipe-arrow" />
              </button>
            ))}

            {/* Add more button */}
            {allMealRecipes.length > currentMealSelected.length + skipped.filter(s => s.day === day && s.meal === activeMeal).length ? (
              <button className="add-more-btn" onClick={handleAddMore}>
                <Plus size={20} />
                <span>Добавить ещё рецепт</span>
              </button>
            ) : (
              <div className="all-selected-msg">
                ✅ Все рецепты для {MEAL_NAMES[activeMeal]}а просмотрены!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      <RecipeDetailModal 
        recipe={detailRecipe}
        isOpen={!!detailRecipe}
        onClose={() => setDetailRecipe(null)}
        onAddToMeal={handleAddFromModal}
        isSelected={detailRecipe ? currentMealSelected.some(r => r.id === detailRecipe.id) : false}
        onRemove={() => detailRecipe && handleRemoveRecipe(detailRecipe.id)}
      />

      <BottomNav />
    </div>
  );
}
