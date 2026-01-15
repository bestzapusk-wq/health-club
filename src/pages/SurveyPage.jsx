import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurvey } from '../hooks/useSurvey';
import SurveyHeader from '../components/survey/SurveyHeader';
import QuestionCard from '../components/survey/QuestionCard';
import YesNoButtons from '../components/survey/YesNoButtons';
import SingleSelect from '../components/survey/SingleSelect';
import MultiSelect from '../components/survey/MultiSelect';
import TextareaQuestion from '../components/survey/TextareaQuestion';
import SectionIntro from '../components/survey/SectionIntro';
import CompletionScreen from '../components/survey/CompletionScreen';
import Button from '../components/ui/Button';
import './SurveyPage.css';

export default function SurveyPage() {
  const navigate = useNavigate();
  const {
    currentQuestion,
    currentIndex,
    total,
    progress,
    answers,
    showIntro,
    isComplete,
    handleAnswer,
    handleBack,
    dismissIntro
  } = useSurvey();

  const [tempAnswer, setTempAnswer] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      navigate('/register');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (currentQuestion) {
      const existing = answers[currentQuestion.id];
      setTempAnswer(existing !== undefined ? existing : (currentQuestion.type === 'multi' ? [] : ''));
    }
  }, [currentQuestion, answers]);

  const handleBackClick = () => {
    if (currentIndex === 0 && !showIntro) {
      navigate('/');
    } else {
      handleBack();
    }
  };

  if (isComplete) {
    return <CompletionScreen />;
  }

  if (!currentQuestion) {
    return null;
  }

  if (showIntro && currentQuestion.sectionIntro) {
    return (
      <div className="survey-page">
        <SurveyHeader 
          current={progress} 
          total={total} 
          onBack={handleBackClick}
        />
        <main className="survey-content">
          <div className="survey-container">
            <SectionIntro
              icon={currentQuestion.sectionIntro.icon}
              title={currentQuestion.sectionIntro.title}
              desc={currentQuestion.sectionIntro.desc}
              onContinue={dismissIntro}
            />
          </div>
        </main>
      </div>
    );
  }

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case 'yesno':
        return (
          <YesNoButtons
            image={currentQuestion.image}
            onYes={() => handleAnswer(true)}
            onNo={() => handleAnswer(false)}
          />
        );

      case 'single':
        return (
          <SingleSelect
            options={currentQuestion.options}
            value={tempAnswer}
            onChange={(value) => handleAnswer(value)}
          />
        );

      case 'multi':
        return (
          <>
            <MultiSelect
              options={currentQuestion.options}
              value={tempAnswer || []}
              onChange={setTempAnswer}
            />
            <Button
              fullWidth
              disabled={!tempAnswer || tempAnswer.length === 0}
              onClick={() => handleAnswer(tempAnswer)}
            >
              Далее
            </Button>
          </>
        );

      case 'textarea':
        return (
          <>
            <TextareaQuestion
              value={tempAnswer || ''}
              onChange={setTempAnswer}
              placeholder={currentQuestion.placeholder}
            />
            <Button
              fullWidth
              disabled={!tempAnswer || tempAnswer.trim().length === 0}
              onClick={() => handleAnswer(tempAnswer)}
            >
              Далее
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="survey-page">
      <SurveyHeader 
        current={progress} 
        total={total} 
        onBack={handleBackClick}
      />
      <main className="survey-content">
        <div className="survey-container">
          <QuestionCard question={currentQuestion.text}>
            {renderQuestionContent()}
          </QuestionCard>
        </div>
      </main>
    </div>
  );
}
