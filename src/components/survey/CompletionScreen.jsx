import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronLeft } from 'lucide-react';
import Button from '../ui/Button';
import './CompletionScreen.css';

export default function CompletionScreen() {
  const navigate = useNavigate();

  return (
    <div className="completion-screen">
      <div className="completion-content fade-in-up">
        <div className="completion-icon">
          <CheckCircle size={64} color="var(--green)" />
        </div>
        <h1 className="completion-title">Опросник пройден!</h1>
        <p className="completion-text">
          Отлично! Теперь загрузите ваши анализы, чтобы мы могли подготовить персональный разбор.
        </p>
        <Button fullWidth size="lg" onClick={() => navigate('/')}>
          <ChevronLeft size={20} />
          На главную
        </Button>
      </div>
    </div>
  );
}
