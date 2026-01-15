import './TextareaQuestion.css';

export default function TextareaQuestion({ value, onChange, placeholder }) {
  return (
    <div className="textarea-question">
      <textarea
        className="textarea-field"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
      />
    </div>
  );
}

