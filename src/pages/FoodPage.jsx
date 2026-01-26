import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { 
  ChevronLeft, ChevronRight, Plus, Utensils, Coffee, Sun, Moon, Apple, Eye, Trash2,
  Clock, Check, X, Heart, Info, Loader, BookOpen, Calendar
} from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import AddFoodModal from '../components/food/AddFoodModal';
import FoodAnalysisModal from '../components/food/FoodAnalysisModal';
import FastingWidget from '../components/fasting/FastingWidget';
import BestPlatesCarousel from '../components/food/BestPlatesCarousel';
import { getAllRecipes } from '../lib/recipesService';
import './FoodPage.css';

// ============ DIARY CONSTANTS ============
const MEALS = [
  { id: 'breakfast', name: 'Завтрак', icon: Coffee, color: '#F59E0B' },
  { id: 'lunch', name: 'Обед', icon: Sun, color: '#22C55E' },
  { id: 'dinner', name: 'Ужин', icon: Moon, color: '#8B5CF6' },
  { id: 'snack', name: 'Перекус', icon: Apple, color: '#EC4899' },
];

// ============ MEAL PLAN CONSTANTS ============
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

const FALLBACK_RECIPES = [
  {
    id: 'fallback-1',
    name: 'Омлет с авокадо',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
    time: 15,
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

// ============ HELPERS ============
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

// ============ SWIPEABLE CARD ============
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

  const likeOpacity = x.to(x => Math.min(Math.max(x / 100, 0), 1));
  const nopeOpacity = x.to(x => Math.min(Math.max(-x / 100, 0), 1));

  return (
    <animated.div
      {...bind()}
      style={{ x, rotate, scale, touchAction: 'pan-y' }}
      className="swipeable-card"
    >
      <animated.div className="swipe-indicator like" style={{ opacity: likeOpacity }}>
        <Heart size={48} fill="currentColor" />
        <span>ДОБАВИТЬ</span>
      </animated.div>

      <animated.div className="swipe-indicator nope" style={{ opacity: nopeOpacity }}>
        <X size={48} strokeWidth={3} />
        <span>ПРОПУСТИТЬ</span>
      </animated.div>

      <div className="swipe-card">
        <div className="card-image">
          <img 
            src={recipe.image} 
            alt={recipe.name}
            draggable={false}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#f0f0f0" width="400" height="300"/><text x="50%" y="50%" fill="#999" font-size="60" text-anchor="middle" dy=".3em">🍽️</text></svg>');
            }}
          />
        </div>

        <div className="card-content">
          <h2 className="card-title">{recipe.name}</h2>
          <div className="card-meta">
            <span className="meta-item">
              <Clock size={16} />
              {recipe.time} мин
            </span>
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

// ============ MEAL TABS FOR PLAN ============
const PlanMealTabs = ({ activeTab, onTabChange, selectedCounts }) => {
  return (
    <div className="plan-meal-tabs">
      {MEAL_TYPES.map(tab => (
        <button
          key={tab.id}
          className={`plan-meal-tab ${activeTab === tab.id ? 'active' : ''}`}
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

// ============ RECIPE DETAIL MODAL ============
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
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#f0f0f0" width="400" height="300"/><text x="50%" y="50%" fill="#999" font-size="60" text-anchor="middle" dy=".3em">🍽️</text></svg>');
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

// ============ MAIN COMPONENT ============
export default function FoodPage() {
  const navigate = useNavigate();
  
  // ===== TAB STATE =====
  const [activeMainTab, setActiveMainTab] = useState('diary'); // 'diary' or 'plan'
  
  // ===== COMMON DATE STATE =====
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // ===== DIARY STATE =====
  const [meals, setMeals] = useState(() => {
    const stored = localStorage.getItem('food_tracker');
    return stored ? JSON.parse(stored) : {};
  });
  const [userId, setUserId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [lastSavedEntry, setLastSavedEntry] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // ===== MEAL PLAN STATE =====
  const [activeMeal, setActiveMeal] = useState('breakfast');
  const [viewMode, setViewMode] = useState('swiper');
  const [allRecipes, setAllRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedRecipes, setSelectedRecipes] = useState(() => {
    const stored = localStorage.getItem('meal_plan');
    return stored ? JSON.parse(stored) : [];
  });
  const [skipped, setSkipped] = useState([]);
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [cardKey, setCardKey] = useState(0);

  // ===== EFFECTS =====
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user.id);
    }
  }, []);

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

  useEffect(() => {
    localStorage.setItem('meal_plan', JSON.stringify(selectedRecipes));
  }, [selectedRecipes]);

  // ===== DATE HELPERS =====
  const dateKey = getDateKey(currentDate);
  const todayMeals = meals[dateKey] || {};

  const changeDate = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + delta);
    setCurrentDate(newDate);
  };

  // ===== DIARY HANDLERS =====
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
    
    if (foodEntry.analysis) {
      const currentMeal = selectedMeal;
      setLastSavedEntry(foodEntry);
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
    if (item.text) {
      return item.text;
    }
    return `Добавлено в ${item.time}`;
  };

  const getMealItems = (mealId) => {
    const items = todayMeals[mealId] || [];
    if (lastSavedEntry && selectedMeal?.id === mealId) {
      const updatedItems = items.map(item => 
        item.id === lastSavedEntry.id ? lastSavedEntry : item
      );
      const exists = items.some(item => item.id === lastSavedEntry.id);
      if (!exists) {
        return [...updatedItems, lastSavedEntry];
      }
      return updatedItems;
    }
    return items;
  };

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
    
    if (updatedEntries.length === 0) {
      delete updated[dateKey][mealId];
    }
    
    setMeals(updated);
    localStorage.setItem('food_tracker', JSON.stringify(updated));
    setShowDeleteConfirm(null);
  };

  // ===== MEAL PLAN HANDLERS =====
  // Calculate day offset from today based on currentDate
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDateNorm = new Date(currentDate);
  currentDateNorm.setHours(0, 0, 0, 0);
  const day = Math.max(1, Math.floor((currentDateNorm - today) / (1000 * 60 * 60 * 24)) + 1);

  const getSelectedForMeal = (mealId) => {
    return selectedRecipes.filter(r => r.day === day && r.meal === mealId);
  };

  const selectedCounts = MEAL_TYPES.reduce((acc, meal) => {
    acc[meal.id] = getSelectedForMeal(meal.id).length;
    return acc;
  }, {});

  const currentMealSelected = getSelectedForMeal(activeMeal);

  const availableRecipes = allRecipes.filter(r => 
    r.meal === activeMeal && 
    !selectedRecipes.some(s => s.id === r.id && s.meal === activeMeal && s.day === day) &&
    !skipped.some(s => s.id === r.id && s.meal === activeMeal && s.day === day)
  );
  const currentRecipe = availableRecipes[0];
  
  const allMealRecipes = allRecipes.filter(r => r.meal === activeMeal);
  const viewedCount = allMealRecipes.length - availableRecipes.length;

  const hasAvailableRecipes = availableRecipes.length > 0;
  const showSwiper = viewMode === 'swiper' && hasAvailableRecipes;
  const showNoRecipes = viewMode === 'swiper' && !hasAvailableRecipes && currentMealSelected.length === 0;
  
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

  return (
    <div className="food-page">
      {/* Best Plates - ALWAYS VISIBLE */}
      <BestPlatesCarousel />

      {/* Tabs */}
      <div className="food-tabs-container">
        <div className="main-tabs">
          <button 
            className={`main-tab diary ${activeMainTab === 'diary' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('diary')}
          >
            <BookOpen size={18} />
            <span>Дневник</span>
          </button>
          <button 
            className={`main-tab plan ${activeMainTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('plan')}
          >
            <Calendar size={18} />
            <span>План питания</span>
          </button>
        </div>

        {/* Date Selector - Only for Diary */}
        {activeMainTab === 'diary' && (
          <div className="date-selector-inline">
            <button onClick={() => changeDate(-1)} className="date-arrow">
              <ChevronLeft size={20} />
            </button>
            <div className="date-display-inline">
              <span>{formatDate(currentDate)}</span>
            </div>
            <button onClick={() => changeDate(1)} className="date-arrow">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* ========== DIARY TAB CONTENT ========== */}
      {activeMainTab === 'diary' && (
        <main className="food-content">
          {/* Fasting Widget */}
          <FastingWidget userId={userId} />

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
                      <button className="meal-view-btn" onClick={() => openAnalysisModal(meal)}>
                        <Eye size={16} />
                        <span>Анализ</span>
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
      )}

      {/* ========== MEAL PLAN TAB CONTENT ========== */}
      {activeMainTab === 'plan' && (
        <>
          {/* Error Banner */}
          {loadError && (
            <div className="error-banner">
              <span>⚠️ {loadError}</span>
            </div>
          )}

          {/* Meal Tabs */}
          <PlanMealTabs 
            activeTab={activeMeal}
            onTabChange={handleMealChange}
            selectedCounts={selectedCounts}
          />

          {/* Selection Progress */}
          {showSwiper && allMealRecipes.length > 0 && (
            <div className="selection-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${allMealRecipes.length > 0 ? (viewedCount / allMealRecipes.length) * 100 : 0}%` }}
                />
              </div>
              <span className="progress-text">
                Просмотрено {viewedCount} из {allMealRecipes.length} на {MEAL_NAMES[activeMeal]}
              </span>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="loading-container">
              <Loader size={40} className="loading-spinner" />
              <p>Загружаем рецепты...</p>
            </div>
          )}

          {/* Swiper */}
          {!isLoading && showSwiper && (
            <>
              <div className="card-stack">
                <SwipeableCard 
                  key={cardKey}
                  recipe={currentRecipe}
                  onLike={handleLike}
                  onSkip={handleSkip}
                />
              </div>

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

              <div className="action-labels">
                <span className="action-label">Нет</span>
                <span className="action-label">Да!</span>
                <span className="action-label">Инфо</span>
              </div>

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
          {!isLoading && showNoRecipes && (
            <div className="cards-area">
              <div className="no-recipes-card">
                <div className="no-recipes-emoji">🍽️</div>
                <h3>Рецепты закончились</h3>
                <p>Для этого приёма пищи пока нет доступных рецептов</p>
              </div>
            </div>
          )}

          {/* List Mode - Selected Recipes */}
          {!isLoading && viewMode === 'list' && (
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
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#f0f0f0" width="80" height="80"/><text x="50%" y="50%" fill="#999" font-size="24" text-anchor="middle" dy=".3em">🍽️</text></svg>');
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
        </>
      )}

      {/* Modals for Diary */}
      <AddFoodModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveFood}
        mealName={selectedMeal?.name || ''}
        mealColor={selectedMeal?.color || '#4A90E2'}
        mealType={selectedMeal?.id || 'lunch'}
      />

      <FoodAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => {
          setShowAnalysisModal(false);
          setLastSavedEntry(null);
        }}
        foodEntries={selectedMeal ? getMealItems(selectedMeal.id) : []}
        mealName={selectedMeal?.name || ''}
        mealColor={selectedMeal?.color || '#4A90E2'}
      />

      <BottomNav />

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="delete-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">🗑️</div>
            <h3>Удалить запись?</h3>
            <p>Это действие нельзя отменить</p>
            <div className="delete-modal-actions">
              <button className="delete-modal-cancel" onClick={() => setShowDeleteConfirm(null)}>
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
