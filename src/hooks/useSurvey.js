import { useState, useEffect, useCallback, useRef } from 'react';
import { filterQuestionsByGender } from '../data/surveyQuestions';
import { supabase } from '../lib/supabase';

export function useSurvey() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showIntro, setShowIntro] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const userIdRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Получаем user ID из localStorage
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      userIdRef.current = parsed.id;
      console.log('✅ Got user ID:', parsed.id);
    }

    // Фильтруем вопросы по полу (если известен)
    const gender = localStorage.getItem('user_gender') || 'female';
    const filteredQuestions = filterQuestionsByGender(gender);
    setQuestions(filteredQuestions);

    // Показываем intro если есть
    if (filteredQuestions.length > 0 && filteredQuestions[0].sectionIntro) {
      setShowIntro(true);
    }

    // Загружаем сохранённый прогресс
    const savedProgress = localStorage.getItem('survey_progress');
    if (savedProgress) {
      const { index, answers: savedAnswers } = JSON.parse(savedProgress);
      setCurrentIndex(index);
      setAnswers(savedAnswers);
      
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

  // Сохранение в Supabase
  const saveSurveyToSupabase = useCallback(async (allAnswers) => {
    const userId = userIdRef.current;
    
    if (!userId) {
      console.log('⚠️ No user ID, saving only to localStorage');
      localStorage.setItem('survey_answers', JSON.stringify(allAnswers));
      return;
    }

    console.log('📤 Saving survey to Supabase for user:', userId);

    try {
      // Сохраняем ответы
      const { error: responsesError } = await supabase
        .from('survey_responses')
        .insert({
          user_id: userId,
          answers: allAnswers,
          completed_at: new Date().toISOString(),
        });

      if (responsesError) {
        console.error('❌ Error saving responses:', responsesError);
      } else {
        console.log('✅ Survey responses saved');
      }

      // Обновляем профиль: survey_completed = true
      // А также сохраняем базовые данные из опросника
      const basicData = {
        survey_completed: true
      };

      // Если в ответах есть базовые данные — сохраняем
      if (allAnswers.basic1) basicData.gender = allAnswers.basic1;
      if (allAnswers.basic2) basicData.age = parseInt(allAnswers.basic2);
      if (allAnswers.basic3) basicData.height_cm = parseInt(allAnswers.basic3);
      if (allAnswers.basic4) basicData.weight_kg = parseInt(allAnswers.basic4);

      const { error: profileError } = await supabase
        .from('profiles')
        .update(basicData)
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Error updating profile:', profileError);
      } else {
        console.log('✅ Profile updated');
        
        // Обновляем localStorage
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        if (allAnswers.basic1) {
          userData.gender = allAnswers.basic1;
          localStorage.setItem('user_gender', allAnswers.basic1);
        }
        if (allAnswers.basic2) userData.age = parseInt(allAnswers.basic2);
        if (allAnswers.basic3) userData.height = parseInt(allAnswers.basic3);
        if (allAnswers.basic4) userData.weight = parseInt(allAnswers.basic4);
        userData.surveyCompleted = true;
        localStorage.setItem('user_data', JSON.stringify(userData));
      }

    } catch (err) {
      console.error('❌ Survey save error:', err);
    }
  }, []);

  const handleAnswer = useCallback((answer) => {
    const questionId = currentQuestion.id;
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Если вопрос имеет saveTo — сохраняем в user_data локально
    if (currentQuestion.saveTo) {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      userData[currentQuestion.saveTo] = answer;
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      // Если это пол — обновляем фильтрацию
      if (currentQuestion.saveTo === 'gender') {
        localStorage.setItem('user_gender', answer);
        const newFilteredQuestions = filterQuestionsByGender(answer);
        setQuestions(newFilteredQuestions);
      }
    }

    // Переходим к следующему вопросу
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      saveProgress(nextIndex, newAnswers);

      if (questions[nextIndex]?.sectionIntro) {
        setShowIntro(true);
      }
    } else {
      // Опросник завершён
      setIsComplete(true);
      
      // Формируем результаты
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
