import { useState, useEffect, useCallback } from 'react';
import { feedbackService } from '../lib/feedbackService';

/**
 * Хук для работы с AI-фидбеком по дневным отчётам
 * @param {string} userId - ID пользователя
 * @param {string} reportDate - Дата отчёта (YYYY-MM-DD)
 * @param {Object} report - Данные отчёта { water_ml, activity_minutes, sleep_hours }
 * @param {boolean} isSubmitted - Был ли отчёт уже отправлен
 */
export const useDailyFeedback = (userId, reportDate, report, isSubmitted = false) => {
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загрузить сохранённый фидбек при монтировании
  useEffect(() => {
    const loadOrGenerateFeedback = async () => {
      if (!userId || !reportDate) return;
      
      try {
        // Сначала пробуем загрузить сохранённый
        const saved = await feedbackService.getSavedFeedback(userId, reportDate);
        if (saved) {
          setFeedback(saved);
          return;
        }
        
        // Если отчёт отправлен, но фидбека нет — генерируем
        if (isSubmitted && report && (report.water_ml > 0 || report.activity_minutes > 0 || report.sleep_hours > 0)) {
          setIsLoading(true);
          try {
            const newFeedback = await feedbackService.generateFeedback(userId, report);
            const feedbackWithTime = {
              ...newFeedback,
              generated_at: new Date().toISOString()
            };
            setFeedback(feedbackWithTime);
            await feedbackService.saveFeedback(userId, reportDate, feedbackWithTime);
          } catch (genErr) {
            console.error('Error auto-generating feedback:', genErr);
          } finally {
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error loading saved feedback:', err);
      }
    };

    loadOrGenerateFeedback();
  }, [userId, reportDate, isSubmitted]);

  // Функция генерации нового фидбека
  const generateFeedback = useCallback(async () => {
    if (!userId || !report) return;
    
    // Если уже есть фидбек — не генерим повторно
    if (feedback) {
      return feedback;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const newFeedback = await feedbackService.generateFeedback(userId, report);
      
      // Добавляем timestamp
      const feedbackWithTime = {
        ...newFeedback,
        generated_at: new Date().toISOString()
      };

      setFeedback(feedbackWithTime);
      
      // Сохраняем в БД
      await feedbackService.saveFeedback(userId, reportDate, feedbackWithTime);
      
      return feedbackWithTime;
      
    } catch (err) {
      console.error('Error generating feedback:', err);
      setError(err);
      
      // Fallback
      const fallbackFeedback = {
        message: 'Отчёт сохранён! Продолжай в том же духе.',
        tip: null,
        generated_at: new Date().toISOString()
      };
      setFeedback(fallbackFeedback);
      return fallbackFeedback;
      
    } finally {
      setIsLoading(false);
    }
  }, [userId, reportDate, report, feedback]);

  return {
    feedback,
    isLoading,
    error,
    generateFeedback
  };
};

export default useDailyFeedback;
