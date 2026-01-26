import { supabase } from './supabase';

/**
 * Сервис для работы с интервальным голоданием
 */
export const fastingService = {
  
  /**
   * Получить настройки пользователя
   */
  async getSettings(userId) {
    const { data, error } = await supabase
      .from('fasting_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching fasting settings:', error);
      return null;
    }
    return data;
  },

  /**
   * Сохранить настройки
   */
  async saveSettings(userId, settings) {
    const { data, error } = await supabase
      .from('fasting_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving fasting settings:', error);
      throw error;
    }
    return data;
  },

  /**
   * Получить текущую сессию (in_progress)
   */
  async getCurrentSession(userId) {
    const { data, error } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching current session:', error);
      return null;
    }
    return data;
  },

  /**
   * Начать новую сессию голодания
   */
  async startSession(userId, settings) {
    const now = new Date();
    const mode = settings.fasting_type || settings.mode || '16:8';
    const targetHours = parseInt(mode.split(':')[0]) || 16;
    const scheduledEnd = new Date(now.getTime() + targetHours * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('fasting_sessions')
      .insert({
        user_id: userId,
        mode: mode,
        fasting_type: mode,
        target_hours: targetHours,
        started_at: now.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        status: 'in_progress'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error starting fasting session:', error);
      throw error;
    }
    return data;
  },

  /**
   * Завершить сессию
   */
  async endSession(sessionId) {
    // Получаем сессию
    const { data: session, error: fetchError } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (fetchError || !session) {
      console.error('Session not found:', fetchError);
      throw new Error('Session not found');
    }
    
    const now = new Date();
    const started = new Date(session.started_at);
    const actualHours = (now - started) / (1000 * 60 * 60);
    const completionPercent = Math.round((actualHours / session.target_hours) * 100);
    
    // Определяем статус
    let finalStatus;
    if (completionPercent >= 100) {
      finalStatus = 'completed';
    } else if (completionPercent >= 50) {
      finalStatus = 'early';
    } else {
      finalStatus = 'missed';
    }
    
    const { data, error } = await supabase
      .from('fasting_sessions')
      .update({
        ended_at: now.toISOString(),
        actual_hours: actualHours.toFixed(2),
        completion_percent: Math.min(completionPercent, 100),
        status: finalStatus
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) {
      console.error('Error ending fasting session:', error);
      throw error;
    }
    return data;
  },

  /**
   * Получить историю
   */
  async getHistory(userId, limit = 30) {
    const { data, error } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching fasting history:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Получить статистику
   */
  async getStats(userId) {
    const { data: sessions, error } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    
    if (error || !sessions || sessions.length === 0) {
      return { streak: 0, avgDuration: 0, successRate: 0, totalSessions: 0 };
    }
    
    // Считаем streak (дни подряд)
    let streak = 0;
    for (const session of sessions) {
      if (session.status === 'completed' || session.status === 'early') {
        streak++;
      } else {
        break;
      }
    }
    
    // Среднее время
    const completedSessions = sessions.filter(s => s.actual_hours);
    const avgDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + parseFloat(s.actual_hours || 0), 0) / completedSessions.length
      : 0;
    
    // Процент успеха
    const successfulSessions = sessions.filter(s => s.status === 'completed').length;
    const successRate = sessions.length > 0 
      ? Math.round((successfulSessions / sessions.length) * 100)
      : 0;
    
    return {
      streak,
      avgDuration: avgDuration.toFixed(1),
      successRate,
      totalSessions: sessions.length
    };
  }
};

export default fastingService;
