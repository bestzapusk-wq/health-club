import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Bookmark, Clock, X, Camera, Flame } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { BUILT_IN_RECIPES } from '../data/recipes';
import './RecipesPage.css';

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'breakfast', label: 'Завтраки' },
  { id: 'lunch', label: 'Обеды' },
  { id: 'dinner', label: 'Ужины' },
  { id: 'snack', label: 'Перекусы' },
];

export default function RecipesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('builtin');
  const [category, setCategory] = useState('all');
  const [savedIds, setSavedIds] = useState([]);
  const [userRecipes, setUserRecipes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setSavedIds(JSON.parse(localStorage.getItem('saved_recipes') || '[]'));
    setUserRecipes(JSON.parse(localStorage.getItem('user_recipes') || '[]'));
  }, []);

  const toggleSave = (id) => {
    const newSaved = savedIds.includes(id)
      ? savedIds.filter(x => x !== id)
      : [...savedIds, id];
    setSavedIds(newSaved);
    localStorage.setItem('saved_recipes', JSON.stringify(newSaved));
  };

  const addUserRecipe = (recipe) => {
    const newRecipes = [recipe, ...userRecipes];
    setUserRecipes(newRecipes);
    localStorage.setItem('user_recipes', JSON.stringify(newRecipes));
    setShowAddModal(false);
    setTab('user');
  };

  const recipes = tab === 'builtin' ? BUILT_IN_RECIPES : userRecipes;
  const filtered = category === 'all' 
    ? recipes 
    : recipes.filter(r => r.category === category);

  return (
    <div className="recipes-page">
      <header className="recipes-header">
        <button className="back-btn" onClick={() => navigate('/food')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Рецепты</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="recipes-content">
        {/* Табы */}
        <div className="tabs">
          <button 
            className={tab === 'builtin' ? 'active' : ''}
            onClick={() => setTab('builtin')}
          >
            Встроенные
          </button>
          <button 
            className={tab === 'user' ? 'active' : ''}
            onClick={() => setTab('user')}
          >
            От пользователей
          </button>
        </div>

        {/* Фильтры */}
        <div className="filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={category === cat.id ? 'active' : ''}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Сетка рецептов */}
        {filtered.length > 0 ? (
          <div className="recipes-grid">
            {filtered.map(recipe => (
              <div key={recipe.id} className="recipe-card">
                <div className="recipe-image">
                  <img src={recipe.image} alt={recipe.title} />
                  <button 
                    className={`save-btn ${savedIds.includes(recipe.id) ? 'saved' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(recipe.id);
                    }}
                  >
                    <Bookmark size={16} />
                  </button>
                </div>
                <div className="recipe-info">
                  <h4>{recipe.title}</h4>
                  <p className="recipe-desc">{recipe.description}</p>
                  <div className="recipe-meta">
                    <Clock size={14} />
                    <span>{recipe.time} мин</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Нет рецептов в этой категории</p>
          </div>
        )}

        {/* Кнопка добавления */}
        <button className="add-recipe-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Добавить свой рецепт
        </button>
      </main>

      <BottomNav />

      {/* Модалка добавления */}
      {showAddModal && (
        <AddRecipeModal 
          onClose={() => setShowAddModal(false)}
          onAdd={addUserRecipe}
        />
      )}
    </div>
  );
}

// Модалка добавления рецепта
function AddRecipeModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('breakfast');
  const [time, setTime] = useState(15);
  const [image, setImage] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onAdd({
      id: 'user_' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      category,
      time,
      image: image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400',
      isUser: true,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-recipe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Новый рецепт</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="form-group">
          <label>Название</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Смузи с бананом"
          />
        </div>

        <div className="form-group">
          <label>Описание / Рецепт</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите ингредиенты и способ приготовления"
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Категория</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="breakfast">Завтрак</option>
              <option value="lunch">Обед</option>
              <option value="dinner">Ужин</option>
              <option value="snack">Перекус</option>
            </select>
          </div>

          <div className="form-group">
            <label>Время (мин)</label>
            <input
              type="number"
              value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              min={1}
              max={180}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Фото</label>
          <div className="image-upload">
            {image ? (
              <img src={image} alt="" className="preview" />
            ) : (
              <div className="upload-placeholder">
                <Camera size={32} />
                <span>Добавить фото</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        <button 
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!title.trim()}
        >
          Добавить рецепт
        </button>
      </div>
    </div>
  );
}
