import { useState, useEffect } from 'react';
import { History, ChevronRight, ChevronDown } from 'lucide-react';
import { getAnalysisHistory } from '../../lib/analysisService';
import './AnalysisHistory.css';

/**
 * Компонент истории разборов
 */
const AnalysisHistory = ({ 
  userId, 
  profileType = 'self', 
  familyMemberId = null,
  currentAnalysisId,
  onSelectAnalysis 
}) => {
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId, profileType, familyMemberId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getAnalysisHistory(userId, profileType, familyMemberId);
      setHistory(data);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Не показываем если только 1 или 0 записей
  if (history.length <= 1) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStats = (resultData) => {
    if (!resultData) return { critical: 0, warning: 0 };
    
    // Пробуем разные варианты структуры данных
    if (resultData.stats) {
      return resultData.stats;
    }
    
    const criticalCount = resultData.critical_markers?.length || 0;
    const warningCount = resultData.warning_markers?.length || 0;
    
    return { critical: criticalCount, warning: warningCount };
  };

  return (
    <div className="analysis-history">
      <button 
        className="history-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <History size={18} />
        <span>История анализов ({history.length})</span>
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {isOpen && (
        <div className="history-list">
          {history.map((item) => {
            const stats = getStats(item.result_data);
            return (
              <button
                key={item.id}
                className={`history-item ${item.id === currentAnalysisId ? 'active' : ''}`}
                onClick={() => onSelectAnalysis(item)}
              >
                <span className="history-date">
                  {formatDate(item.analysis_date || item.created_at)}
                </span>
                <span className="history-stats">
                  {stats.critical > 0 && (
                    <span className="stat-badge critical">{stats.critical} крит.</span>
                  )}
                  {stats.warning > 0 && (
                    <span className="stat-badge warning">{stats.warning} внимание</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;
