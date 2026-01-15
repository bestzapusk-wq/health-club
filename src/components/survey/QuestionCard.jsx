import './QuestionCard.css';

export default function QuestionCard({ question, children }) {
  return (
    <div className="question-card fade-in">
      <h2 className="question-text">{question}</h2>
      <div className="question-content">
        {children}
      </div>
    </div>
  );
}

