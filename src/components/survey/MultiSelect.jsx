import './MultiSelect.css';

export default function MultiSelect({ options, value = [], onChange }) {
  const handleToggle = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="multi-select">
      {options.map(option => {
        const isSelected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={`multi-option ${isSelected ? 'multi-selected' : ''}`}
            onClick={() => handleToggle(option.value)}
          >
            <span className="multi-checkbox">
              {isSelected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </span>
            <span className="multi-label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

