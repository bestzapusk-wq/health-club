import { supabase } from './supabase';

/**
 * Вызвать Edge Function для генерации отчёта
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object>} - Результат анализа
 */
export async function generateReport(userId) {
  if (!userId) {
    throw new Error('Пользователь не авторизован');
  }

  // Устанавливаем статус "processing" - создаём новую запись
  await supabase
    .from('analysis_results')
    .insert({
      user_id: userId,
      status: 'processing',
      created_at: new Date().toISOString()
    });

  try {
    // Вызываем Edge Function
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: { user_id: userId }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Ошибка генерации отчёта');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Неизвестная ошибка');
    }

    return data.result;

  } catch (err) {
    // Обновляем статус на ошибку
    await supabase
      .from('analysis_results')
      .update({
        status: 'error',
        error_message: err.message
      })
      .eq('user_id', userId);

    throw err;
  }
}

/**
 * Проверить статус генерации отчёта
 */
export async function checkReportStatus(userId) {
  const { data, error } = await supabase
    .from('analysis_results')
    .select('status, result_data, error_message')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}
