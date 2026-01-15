import { User } from 'lucide-react';
import './GenderSelect.css';

export default function GenderSelect({ value, onChange }) {
  const options = [
    { value: 'female', label: 'Женский' },
    { value: 'male', label: 'Мужской' }
  ];

  return (
    <div className="gender-select">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          className={`gender-option ${value === option.value ? 'gender-selected' : ''}`}
          onClick={() => onChange(option.value)}
        >
          <div className="gender-icon">
            <User size={28} />
          </div>
          <span className="gender-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
