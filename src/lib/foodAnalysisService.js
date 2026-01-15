/**
 * Сервис для анализа фото еды через Edge Function
 */

import { supabase } from './supabase';

const EDGE_FUNCTION_URL = 'https://vgcfivgsmanmftgymibl.supabase.co/functions/v1/analyze-food';
const STORAGE_BUCKET = 'food-photos';

/**
 * Конвертирует файл изображения в base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Убираем префикс data:image/...;base64,
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Загружает фото в Supabase Storage
 * @param {File} imageFile - Файл изображения
 * @param {string} mealType - Тип приёма пищи
 * @returns {Promise<string>} - Публичный URL фото
 */
export const uploadFoodPhoto = async (imageFile, mealType = 'meal') => {
  try {
    // Получаем userId из localStorage
    const userData = localStorage.getItem('user_data');
    const userId = userData ? JSON.parse(userData).id : 'anonymous';
    
    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const ext = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${mealType}_${timestamp}.${ext}`;
    
    console.log('Uploading photo to Supabase Storage:', fileName);
    
    // Загружаем в Storage
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }
    
    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);
    
    console.log('Photo uploaded, URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload photo:', error);
    throw error;
  }
};

/**
 * Анализирует фото еды через Edge Function с retry при 429
 * @param {File} imageFile - Файл изображения
 * @param {string} mealType - Тип приёма пищи: 'breakfast', 'lunch', 'dinner', 'snack'
 * @param {number} retryCount - Количество попыток (внутренний параметр)
 * @returns {Promise<object>} - Результат анализа
 */
export const analyzeFood = async (imageFile, mealType = 'lunch', retryCount = 0) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 секунды

  try {
    console.log('Starting food analysis...', { mealType, fileName: imageFile.name, attempt: retryCount + 1 });
    
    // Конвертируем в base64
    const base64 = await fileToBase64(imageFile);
    console.log('Image converted to base64, length:', base64.length);

    // Отправляем на Edge Function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        image_base64: base64, 
        meal_type: mealType 
      })
    });

    // Обработка rate limit (429) с retry
    if (response.status === 429 || response.status === 500) {
      const errorText = await response.text();
      console.warn('Rate limit or server error:', response.status, errorText);
      
      // Проверяем есть ли ещё попытки
      if (retryCount < MAX_RETRIES) {
        console.log(`⏳ Retry ${retryCount + 1}/${MAX_RETRIES} after ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return analyzeFood(imageFile, mealType, retryCount + 1);
      }
      
      // Все попытки исчерпаны
      throw new Error('Claude API перегружен. Попробуйте через минуту.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error:', response.status, errorText);
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const data = await response.json();
    console.log('Food analysis response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Не удалось проанализировать фото');
    }

    return data.analysis;
  } catch (error) {
    console.error('Food analysis failed:', error);
    throw error;
  }
};

/**
 * Трансформирует ответ API в формат для UI
 * @param {object} analysis - Ответ от Edge Function
 * @returns {object} - Данные для отображения
 */
export const transformAnalysisForUI = (analysis) => {
  if (!analysis) return null;

  return {
    score: analysis.score || 5,
    maxScore: 10,
    
    // Баланс тарелки
    balance: [
      { 
        name: 'Овощи', 
        value: analysis.plate_balance?.vegetables_percent || 0, 
        norm: 50, 
        color: '#22C55E' 
      },
      { 
        name: 'Белок', 
        value: analysis.plate_balance?.protein_percent || 0, 
        norm: 25, 
        color: '#F59E0B' 
      },
      { 
        name: 'Углеводы', 
        value: analysis.plate_balance?.carbs_percent || 0, 
        norm: 25, 
        color: '#8B5CF6' 
      },
    ],
    
    // Что хорошо (зелёные галочки)
    good: analysis.good_points || [],
    
    // Чего не хватает (жёлтые предупреждения)
    missing: analysis.missing || [],
    
    // Что улучшить (красные флаги)
    concerns: analysis.concerns || [],
    
    // Главная рекомендация
    recommendation: analysis.recommendation || '',
    
    // Распознанные продукты
    identifiedFoods: analysis.identified_foods || [],
    
    // Есть ли зелень
    greensPresent: analysis.plate_balance?.greens_present || false,
    
    analyzed: true
  };
};
