import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Bell, BellOff, Trash2, Edit3, X, Check } from 'lucide-react';
import './VitaminsPage.css';

const COMMENTS = [
  'После завтрака',
  'После обеда',
  'После ужина',
  'Перед сном',
  'Натощак'
];

export default function VitaminsPage() {
  const navigate = useNavigate();
  const [vitamins, setVitamins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // Для подтверждения удаления
  const [formData, setFormData] = useState({
    name: '',
    time: '09:00',
    comment: 'После завтрака'
  });

  useEffect(() => {
    const stored = localStorage.getItem('health_tracker_data');
    if (stored) {
      const parsed = JSON.parse(stored);
      setVitamins(parsed.vitamins || []);
    }
  }, []);

  const saveVitamins = (newVitamins) => {
    setVitamins(newVitamins);
    const stored = localStorage.getItem('health_tracker_data');
    const parsed = stored ? JSON.parse(stored) : { settings: {}, vitamins: [], daily_data: {} };
    parsed.vitamins = newVitamins;
    localStorage.setItem('health_tracker_data', JSON.stringify(parsed));
  };

  const handleAdd = () => {
    if (!formData.name.trim()) return;

    const newVitamin = {
      id: Date.now(),
      name: formData.name,
      time: formData.time,
      comment: formData.comment,
      enabled: true,
      taken_today: false
    };

    if (editingId) {
      const updated = vitamins.map(v => 
        v.id === editingId ? { ...newVitamin, id: editingId } : v
      );
      saveVitamins(updated);
    } else {
      saveVitamins([...vitamins, newVitamin]);
    }

    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', time: '09:00', comment: 'После завтрака' });
  };

  const handleEdit = (vitamin) => {
    setEditingId(vitamin.id);
    setFormData({
      name: vitamin.name,
      time: vitamin.time,
      comment: vitamin.comment
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    saveVitamins(vitamins.filter(v => v.id !== id));
    setDeleteTarget(null);
  };

  const confirmDelete = (vitamin) => {
    setDeleteTarget(vitamin);
  };

  const toggleEnabled = (id) => {
    const updated = vitamins.map(v => 
      v.id === id ? { ...v, enabled: !v.enabled } : v
    );
    saveVitamins(updated);

    // Request notification permission if enabling
    const vitamin = vitamins.find(v => v.id === id);
    if (!vitamin.enabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  const toggleTaken = (id) => {
    const updated = vitamins.map(v => 
      v.id === id ? { ...v, taken_today: !v.taken_today } : v
    );
    saveVitamins(updated);
  };

  return (
    <div className="vitamins-page">
      <header className="vitamins-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Назад">
          <ArrowLeft size={22} />
        </button>
        <h1>Напоминания о витаминах</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="vitamins-content">
        <button className="add-vitamin-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>Добавить витамин</span>
        </button>

        {vitamins.length === 0 ? (
          <div className="vitamins-empty">
            <p>Пока нет добавленных витаминов</p>
            <span>Нажмите кнопку выше, чтобы добавить первый</span>
          </div>
        ) : (
          <div className="vitamins-list">
            {vitamins.map(vitamin => (
              <div key={vitamin.id} className={`vitamin-card ${vitamin.taken_today ? 'taken' : ''}`}>
                <div className="vitamin-card-main">
                  <button 
                    className={`vitamin-check ${vitamin.taken_today ? 'checked' : ''}`}
                    onClick={() => toggleTaken(vitamin.id)}
                  >
                    {vitamin.taken_today && <Check size={16} />}
                  </button>
                  
                  <div className="vitamin-card-info">
                    <span className="vitamin-name">{vitamin.name}</span>
                    <span className="vitamin-schedule">
                      {vitamin.time} · {vitamin.comment}
                    </span>
                  </div>

                  <button 
                    className={`vitamin-toggle ${vitamin.enabled ? 'on' : 'off'}`}
                    onClick={() => toggleEnabled(vitamin.id)}
                  >
                    {vitamin.enabled ? <Bell size={18} /> : <BellOff size={18} />}
                  </button>
                </div>

                <div className="vitamin-card-actions">
                  <button className="vitamin-action" onClick={() => handleEdit(vitamin)}>
                    <Edit3 size={16} />
                    <span>Изменить</span>
                  </button>
                  <button className="vitamin-action delete" onClick={() => confirmDelete(vitamin)}>
                    <Trash2 size={16} />
                    <span>Удалить</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingId(null); }}>
          <div className="vitamin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Редактировать' : 'Добавить витамин'}</h3>
              <button className="close-btn" onClick={() => { setShowModal(false); setEditingId(null); }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-form">
              <div className="form-field">
                <label>Название витамина</label>
                <input
                  type="text"
                  placeholder="Например: Витамин D"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label>Время приёма</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Когда принимать</label>
                <select
                  value={formData.comment}
                  onChange={e => setFormData({ ...formData, comment: e.target.value })}
                >
                  {COMMENTS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button 
                className="save-btn" 
                onClick={handleAdd}
                disabled={!formData.name.trim()}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка подтверждения удаления */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-icon">🗑️</div>
            <h3>Удалить витамин?</h3>
            <p>«{deleteTarget.name}» будет удалён из списка напоминаний</p>
            <div className="delete-confirm-actions">
              <button className="cancel-btn" onClick={() => setDeleteTarget(null)}>
                Отмена
              </button>
              <button className="confirm-btn" onClick={() => handleDelete(deleteTarget.id)}>
                <Trash2 size={16} />
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
