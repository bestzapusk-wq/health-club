import { supabase } from './supabase';

/**
 * Сервис для AI-фидбека по дневным отчётам
 */
export const feedbackService = {
  
  /**
   * Получить данные для контекста AI
   */
  async getFeedbackContext(userId) {
    // 1. Последние 7 дней отчётов
    const { data: reports } = await supabase
      .from('daily_reports')
      .select('report_date, water_ml, activity_minutes, sleep_hours')
      .eq('user_id', userId)
      .order('report_date', { ascending: false })
      .limit(7);

    // 2. Данные профиля
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, age, gender')
      .eq('id', userId)
      .single();

    // 3. Приоритеты из последнего разбора
    const { data: analysis } = await supabase
      .from('analysis_results')
      .select('result_data')
      .eq('user_id', userId)
      .in('status', ['completed', 'ready'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const priorities = analysis?.result_data?.priorities?.slice(0, 3) || [];
    const mainFinding = analysis?.result_data?.summary || 
                        analysis?.result_data?.main_findings?.summary || null;

    return {
      reports: reports || [],
      profile,
      priorities,
      mainFinding
    };
  },

  /**
   * Сгенерировать фидбек через Edge Function
   */
  async generateFeedback(userId, todayReport) {
    const context = await this.getFeedbackContext(userId);
    
    // Вызов Edge Function
    const { data, error } = await supabase.functions.invoke('generate-feedback', {
      body: {
        todayReport,
        context
      }
    });

    if (error) {
      console.error('Feedback generation error:', error);
      // Возвращаем fallback
      return {
        message: 'Отчёт сохранён! Продолжай отслеживать свои привычки.',
        tip: null
      };
    }
    
    return data;
  },

  /**
   * Сохранить фидбек (чтобы не генерить повторно)
   */
  async saveFeedback(userId, reportDate, feedback) {
    const { error } = await supabase
      .from('daily_reports')
      .update({ ai_feedback: feedback })
      .eq('user_id', userId)
      .eq('report_date', reportDate);

    if (error) {
      console.error('Error saving feedback:', error);
    }
  },

  /**
   * Получить сохранённый фидбек
   */
  async getSavedFeedback(userId, reportDate) {
    const { data } = await supabase
      .from('daily_reports')
      .select('ai_feedback')
      .eq('user_id', userId)
      .eq('report_date', reportDate)
      .single();

    return data?.ai_feedback || null;
  }
};

export default feedbackService;
