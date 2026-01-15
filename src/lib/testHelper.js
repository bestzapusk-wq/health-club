/**
 * Тестовые функции для отладки (вызываются из консоли браузера)
 */
import { supabase } from './supabase';

/**
 * Сохранить результат анализа напрямую в Supabase
 * Использование в консоли: window.saveTestResult(jsonData)
 */
export async function saveTestResult(resultData) {
  const userData = localStorage.getItem('user_data');
  if (!userData) {
    console.error('❌ Нет user_data в localStorage. Сначала авторизуйтесь.');
    return null;
  }

  const { id: userId } = JSON.parse(userData);
  console.log('📤 Сохраняем результат для userId:', userId);

  const { data, error } = await supabase
    .from('analysis_results')
    .upsert({
      user_id: userId,
      status: 'completed',
      result_data: resultData,
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Ошибка сохранения:', error);
    return null;
  }

  console.log('✅ Результат сохранён!', data);
  console.log('🔄 Теперь перейдите на страницу /report');
  
  localStorage.setItem('results_ready', 'true');
  
  return data;
}

/**
 * Получить текущий результат анализа
 */
export async function getTestResult() {
  const userData = localStorage.getItem('user_data');
  if (!userData) {
    console.error('❌ Нет user_data');
    return null;
  }

  const { id: userId } = JSON.parse(userData);
  
  const { data, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('❌ Ошибка:', error);
    return null;
  }

  console.log('📋 Текущий результат:', data);
  return data;
}

/**
 * Удалить результат анализа (для повторного тестирования)
 */
export async function deleteTestResult() {
  const userData = localStorage.getItem('user_data');
  if (!userData) {
    console.error('❌ Нет user_data');
    return false;
  }

  const { id: userId } = JSON.parse(userData);
  
  const { error } = await supabase
    .from('analysis_results')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('❌ Ошибка удаления:', error);
    return false;
  }

  console.log('🗑️ Результат удалён');
  localStorage.removeItem('results_ready');
  return true;
}

// Экспортируем в window для доступа из консоли
if (typeof window !== 'undefined') {
  window.saveTestResult = saveTestResult;
  window.getTestResult = getTestResult;
  window.deleteTestResult = deleteTestResult;
  
  console.log('🧪 Тестовые функции доступны:');
  console.log('  - window.saveTestResult(jsonData) — сохранить результат');
  console.log('  - window.getTestResult() — посмотреть текущий результат');
  console.log('  - window.deleteTestResult() — удалить результат');
}
