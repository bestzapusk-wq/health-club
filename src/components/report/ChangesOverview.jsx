import './ChangesOverview.css';

/**
 * Блок "Что изменилось" для сравнения с предыдущим разбором
 */
const ChangesOverview = ({ currentAnalysis, previousAnalysis }) => {
  if (!previousAnalysis || !currentAnalysis) return null;
  
  const current = currentAnalysis.result_data;
  const previous = previousAnalysis.result_data;
  
  if (!current || !previous) return null;
  
  const changes = {
    improved: [],
    worsened: []
  };
  
  // Получаем маркеры из обоих разборов
  const currentMarkers = [
    ...(current.critical_markers || []),
    ...(current.warning_markers || [])
  ];
  
  const previousMarkers = [
    ...(previous.critical_markers || []),
    ...(previous.warning_markers || [])
  ];
  
  // Сравниваем маркеры
  currentMarkers.forEach(marker => {
    const prevMarker = previousMarkers.find(p => p.name === marker.name);
    
    if (prevMarker) {
      const currentVal = parseFloat(String(marker.value).replace(',', '.'));
      const prevVal = parseFloat(String(prevMarker.value).replace(',', '.'));
      
      if (!isNaN(currentVal) && !isNaN(prevVal)) {
        const diff = Math.abs(currentVal - prevVal);
        
        if (diff > 0.1) {
          // Определяем направление (повышен или понижен)
          const isHigh = marker.direction === 'high' || 
            (marker.reference && currentVal > parseFloat(marker.reference.split('-')[1]));
          
          if (isHigh && currentVal < prevVal) {
            changes.improved.push(marker.name);
          } else if (!isHigh && currentVal > prevVal) {
            changes.improved.push(marker.name);
          } else if (isHigh && currentVal > prevVal) {
            changes.worsened.push(marker.name);
          } else if (!isHigh && currentVal < prevVal) {
            changes.worsened.push(marker.name);
          }
        }
      }
    }
  });
  
  // Проверяем показатели, которые пришли в норму
  previousMarkers.forEach(marker => {
    const stillAbnormal = currentMarkers.find(m => m.name === marker.name);
    if (!stillAbnormal) {
      // Был отклонён, теперь в норме
      changes.improved.push(`${marker.name} (норма)`);
    }
  });
  
  // Проверяем новые отклонения
  currentMarkers.forEach(marker => {
    const wasAbnormal = previousMarkers.find(m => m.name === marker.name);
    if (!wasAbnormal) {
      // Новое отклонение
      changes.worsened.push(`${marker.name} (новое)`);
    }
  });
  
  if (changes.improved.length === 0 && changes.worsened.length === 0) {
    return null;
  }
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  return (
    <div className="changes-overview">
      <h3>📊 Что изменилось</h3>
      <p className="changes-subtitle">
        Сравнение с анализом от {formatDate(previousAnalysis.analysis_date || previousAnalysis.created_at)}
      </p>
      
      {changes.improved.length > 0 && (
        <div className="changes-section improved">
          <span className="changes-icon">✅</span>
          <div className="changes-content">
            <strong>Улучшилось:</strong>
            <span>{changes.improved.join(', ')}</span>
          </div>
        </div>
      )}
      
      {changes.worsened.length > 0 && (
        <div className="changes-section worsened">
          <span className="changes-icon">⚠️</span>
          <div className="changes-content">
            <strong>Требует внимания:</strong>
            <span>{changes.worsened.join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangesOverview;
