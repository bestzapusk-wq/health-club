import './SingleSelect.css';

export default function SingleSelect({ options, value, onChange }) {
  return (
    <div className="single-select">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          className={`select-option ${value === option.value ? 'option-selected' : ''}`}
          onClick={() => onChange(option.value)}
        >
          <span className="option-radio">
            {value === option.value && (
              <span className="option-radio-dot" />
            )}
          </span>
          <span className="option-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

