import './AIFeedbackCard.css';

/**
 * Карточка AI-фидбека после отправки дневного отчёта
 */
const AIFeedbackCard = ({ feedback, isLoading }) => {
  if (isLoading) {
    return (
      <div className="ai-feedback-card loading">
        <div className="feedback-header">
          <span className="feedback-icon">🤖</span>
          <span className="feedback-title">Анализирую...</span>
        </div>
        <div className="feedback-skeleton">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <div className="ai-feedback-card">
      <div className="feedback-header">
        <span className="feedback-icon">🤖</span>
        <span className="feedback-title">Обратная связь</span>
      </div>
      
      <div className="feedback-content">
        <p className="feedback-main">{feedback.message}</p>
        
        {feedback.tip && (
          <div className="feedback-tip">
            <span className="tip-icon">💡</span>
            <p>{feedback.tip}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFeedbackCard;
