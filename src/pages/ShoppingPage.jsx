import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Play, X } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { BASE_SHOPPING_LIST, SHOPPING_VIDEO } from '../data/shopping';
import './ShoppingPage.css';

export default function ShoppingPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    setChecked(JSON.parse(localStorage.getItem('shopping_checked') || '[]'));
    setCustomItems(JSON.parse(localStorage.getItem('shopping_custom') || '[]'));
  }, []);

  const toggle = (id) => {
    const newChecked = checked.includes(id) 
      ? checked.filter(x => x !== id)
      : [...checked, id];
    setChecked(newChecked);
    localStorage.setItem('shopping_checked', JSON.stringify(newChecked));
  };

  const addCustomItem = () => {
    if (!newItem.trim()) return;
    
    const item = {
      id: 'custom_' + Date.now(),
      name: newItem.trim(),
      amount: '',
    };
    
    const newItems = [...customItems, item];
    setCustomItems(newItems);
    localStorage.setItem('shopping_custom', JSON.stringify(newItems));
    setNewItem('');
    setShowAddInput(false);
  };

  const removeCustomItem = (id) => {
    const newItems = customItems.filter(x => x.id !== id);
    setCustomItems(newItems);
    localStorage.setItem('shopping_custom', JSON.stringify(newItems));
    // Also remove from checked
    const newChecked = checked.filter(x => x !== id);
    setChecked(newChecked);
    localStorage.setItem('shopping_checked', JSON.stringify(newChecked));
  };

  const checkedCount = checked.length;
  const totalCount = BASE_SHOPPING_LIST.reduce((acc, g) => acc + g.items.length, 0) + customItems.length;

  return (
    <div className="shopping-page">
      <header className="shopping-header">
        <button className="back-btn" onClick={() => navigate('/food')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Список продуктов</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="shopping-content">
        {/* Видео */}
        <div className="video-card">
          <div className="video-thumb">
            <img 
              src={SHOPPING_VIDEO.thumbnail} 
              alt="" 
            />
            <div className="play-icon">
              <Play size={24} />
            </div>
          </div>
          <div className="video-info">
            <h4>{SHOPPING_VIDEO.title}</h4>
            <span>{SHOPPING_VIDEO.duration} • {SHOPPING_VIDEO.author}</span>
          </div>
        </div>

        {/* Прогресс */}
        <div className="progress-info">
          <span>Куплено: {checkedCount} из {totalCount}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Список */}
        <div className="shopping-list">
          <h3>📋 Базовый список на неделю</h3>

          {BASE_SHOPPING_LIST.map(group => (
            <div key={group.category} className="list-group">
              <h4>{group.category}</h4>
              {group.items.map(item => (
                <label key={item.id} className="list-item">
                  <div 
                    className={`checkbox ${checked.includes(item.id) ? 'checked' : ''}`}
                    onClick={() => toggle(item.id)}
                  >
                    {checked.includes(item.id) && <Check size={14} />}
                  </div>
                  <span className={`item-name ${checked.includes(item.id) ? 'done' : ''}`}>
                    {item.name}
                  </span>
                  <span className="item-amount">{item.amount}</span>
                </label>
              ))}
            </div>
          ))}

          {/* Свои продукты */}
          {customItems.length > 0 && (
            <div className="list-group">
              <h4>Моё</h4>
              {customItems.map(item => (
                <label key={item.id} className="list-item">
                  <div 
                    className={`checkbox ${checked.includes(item.id) ? 'checked' : ''}`}
                    onClick={() => toggle(item.id)}
                  >
                    {checked.includes(item.id) && <Check size={14} />}
                  </div>
                  <span className={`item-name ${checked.includes(item.id) ? 'done' : ''}`}>
                    {item.name}
                  </span>
                  <button 
                    className="remove-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      removeCustomItem(item.id);
                    }}
                  >
                    <X size={16} />
                  </button>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Добавление */}
        {showAddInput ? (
          <div className="add-input-row">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Название продукта"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
            />
            <button className="add-confirm" onClick={addCustomItem}>
              <Check size={20} />
            </button>
            <button className="add-cancel" onClick={() => {
              setShowAddInput(false);
              setNewItem('');
            }}>
              <X size={20} />
            </button>
          </div>
        ) : (
          <button className="add-btn" onClick={() => setShowAddInput(true)}>
            <Plus size={20} />
            Добавить свой продукт
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
