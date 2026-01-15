import { useState, useEffect, useCallback, useRef } from 'react';
import { filterQuestionsByGender } from '../data/surveyQuestions';
import { supabase } from '../lib/supabase';

export function useSurvey() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showIntro, setShowIntro] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Используем ref для userId чтобы он был доступен в callback
  const userIdRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Предотвращаем повторную инициализацию
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Получаем user ID из сессии или localStorage
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userIdRef.current = session.user.id;
        console.log('✅ Got user ID from session:', session.user.id);
      } else {
        // Fallback: из localStorage
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsed = JSON.parse(userData);
          userIdRef.current = parsed.id;
          console.log('✅ Got user ID from localStorage:', parsed.id);
        }
      }
    };
    getUserId();

    const gender = localStorage.getItem('user_gender') || 'female';
    const filteredQuestions = filterQuestionsByGender(gender);
    setQuestions(filteredQuestions);

    // Check if current question has intro
    if (filteredQuestions.length > 0 && filteredQuestions[0].sectionIntro) {
      setShowIntro(true);
    }

    // Load saved progress
    const savedProgress = localStorage.getItem('survey_progress');
    if (savedProgress) {
      const { index, answers: savedAnswers } = JSON.parse(savedProgress);
      setCurrentIndex(index);
      setAnswers(savedAnswers);
      
      // Check if should show intro for current question
      if (filteredQuestions[index]?.sectionIntro && !savedAnswers[filteredQuestions[index].id]) {
        setShowIntro(true);
      } else {
        setShowIntro(false);
      }
    }
  }, []);

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const progress = currentIndex + 1;

  const saveProgress = useCallback((index, newAnswers) => {
    localStorage.setItem('survey_progress', JSON.stringify({
      index,
      answers: newAnswers
    }));
  }, []);

  // Сохранение результатов в Supabase - определяем ПЕРЕД handleAnswer
  const saveSurveyToSupabase = useCallback(async (allAnswers) => {
    const currentUserId = userIdRef.current;
    
    if (!currentUserId) {
      console.error('❌ No user ID for saving survey');
      return;
    }

    console.log('📤 Saving survey to Supabase...');
    console.log('User ID:', currentUserId);
    console.log('Answers count:', Object.keys(allAnswers).length);

    try {
      // Сохраняем все ответы в одну запись
      const { data, error: responsesError } = await supabase
        .from('survey_responses')
        .insert({
          user_id: currentUserId,
          answers: allAnswers,
          completed_at: new Date().toISOString(),
        })
        .select();

      if (responsesError) {
        console.error('❌ Error saving responses:', responsesError);
      } else {
        console.log('✅ Survey responses saved:', data);
      }

      // Обновляем профиль: survey_completed = true
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          survey_completed: true,
          survey_completed_at: new Date().toISOString()
        })
        .eq('id', currentUserId);

      if (profileError) {
        console.error('❌ Error updating profile:', profileError);
      } else {
        console.log('✅ Profile updated: survey_completed = true');
      }

    } catch (err) {
      console.error('❌ Survey save error:', err);
    }
  }, []);

  const handleAnswer = useCallback((answer) => {
    const questionId = currentQuestion.id;
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Move to next question
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      saveProgress(nextIndex, newAnswers);

      // Check if next question has intro
      if (questions[nextIndex]?.sectionIntro) {
        setShowIntro(true);
      }
    } else {
      // Survey complete
      setIsComplete(true);
      
      // Format and save results
      const results = {
        symptoms: [],
        health: []
      };

      questions.forEach(q => {
        const ans = newAnswers[q.id];
        if (!ans) return;

        if (q.symptom && ans === true) {
          results.symptoms.push({
            symptom: q.symptom,
            question: q.text
          });
        } else if (q.type !== 'yesno') {
          results.health.push({
            question: q.text,
            answer: ans
          });
        }
      });

      localStorage.setItem('survey_completed', 'true');
      localStorage.setItem('survey_results', JSON.stringify(results));
      localStorage.removeItem('survey_progress');

      // Сохраняем в Supabase
      saveSurveyToSupabase(newAnswers);
    }
  }, [currentQuestion, currentIndex, questions, answers, saveProgress, saveSurveyToSupabase]);

  const handleBack = useCallback(() => {
    if (showIntro) {
      setShowIntro(false);
      return;
    }

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      saveProgress(prevIndex, answers);

      // Don't show intro when going back
      setShowIntro(false);
    }
  }, [showIntro, currentIndex, answers, saveProgress]);

  const dismissIntro = useCallback(() => {
    setShowIntro(false);
  }, []);

  return {
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
  };
}
