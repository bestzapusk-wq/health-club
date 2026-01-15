import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Clock } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import './SavedPage.css';

// Same recipes as in RecipesPage
const ALL_RECIPES = [
  {
    id: 'r1',
    title: 'Овсянка с ягодами',
    image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=300&h=300&fit=crop',
    category: 'breakfast',
    time: 10,
  },
  {
    id: 'r2',
    title: 'Омлет с овощами',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&h=300&fit=crop',
    category: 'breakfast',
    time: 15,
  },
  {
    id: 'r3',
    title: 'Салат с курицей',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop',
    category: 'lunch',
    time: 20,
  },
  {
    id: 'r4',
    title: 'Гречка с овощами',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&h=300&fit=crop',
    category: 'lunch',
    time: 25,
  },
  {
    id: 'r5',
    title: 'Рыба на пару',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&h=300&fit=crop',
    category: 'dinner',
    time: 20,
  },
  {
    id: 'r6',
    title: 'Творог с орехами',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop',
    category: 'snack',
    time: 5,
  },
  {
    id: 'r7',
    title: 'Авокадо тост',
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=300&h=300&fit=crop',
    category: 'breakfast',
    time: 10,
  },
  {
    id: 'r8',
    title: 'Суп-пюре из брокколи',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=300&fit=crop',
    category: 'dinner',
    time: 30,
  },
  {
    id: 'r9',
    title: 'Смузи с бананом',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&h=300&fit=crop',
    category: 'snack',
    time: 5,
  },
];

export default function SavedPage() {
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState(() => {
    return JSON.parse(localStorage.getItem('saved_recipes') || '[]');
  });

  const savedRecipes = ALL_RECIPES.filter(r => savedIds.includes(r.id));

  const toggleSave = (id) => {
    setSavedIds(prev => {
      const next = prev.filter(x => x !== id);
      localStorage.setItem('saved_recipes', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="saved-page">
      <header className="saved-header">
        <button className="back-btn" onClick={() => navigate('/food')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Сохранённое</h1>
      </header>

      <main className="saved-content">
        {savedRecipes.length > 0 ? (
          <div className="saved-grid">
            {savedRecipes.map(recipe => (
              <div key={recipe.id} className="recipe-card">
                <div className="recipe-image">
                  <img src={recipe.image} alt={recipe.title} />
                  <button 
                    className="save-btn saved"
                    onClick={() => toggleSave(recipe.id)}
                  >
                    <Bookmark size={18} />
                  </button>
                </div>
                <div className="recipe-info">
                  <h4>{recipe.title}</h4>
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
            <div className="empty-icon">⭐</div>
            <h3>Пока ничего не сохранено</h3>
            <p>Нажми на закладку у любого рецепта, чтобы сохранить его сюда</p>
            <button className="browse-btn" onClick={() => navigate('/food/recipes')}>
              Посмотреть рецепты
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

