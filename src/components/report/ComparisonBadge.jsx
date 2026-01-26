import './ComparisonBadge.css';

/**
 * Бейдж сравнения с предыдущим значением
 */
const ComparisonBadge = ({ current, previous, unit = '', inverse = false }) => {
  if (previous === null || previous === undefined) return null;
  
  const currentVal = parseFloat(String(current).replace(',', '.'));
  const previousVal = parseFloat(String(previous).replace(',', '.'));
  
  if (isNaN(currentVal) || isNaN(previousVal)) return null;
  
  const diff = currentVal - previousVal;
  if (Math.abs(diff) < 0.01) return null;
  
  // По умолчанию меньше = лучше (для большинства показателей)
  // inverse = true означает что больше = лучше (например, гемоглобин при анемии)
  const isImproved = inverse ? diff > 0 : diff < 0;
  
  const formattedDiff = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  
  return (
    <span className={`comparison-badge ${isImproved ? 'improved' : 'worsened'}`}>
      {formattedDiff}{unit}
      {isImproved ? ' ↓' : ' ↑'}
    </span>
  );
};

export default ComparisonBadge;
