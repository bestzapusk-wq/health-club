import { supabase } from './supabase';

/**
 * Загрузка рецептов из Supabase
 * @param {string} category - Тип приёма пищи: 'breakfast' | 'lunch' | 'dinner' | 'snack'
 * @returns {Promise<Array>} - Массив рецептов
 */
export async function fetchRecipes(category = null) {
  let query = supabase
    .from('recipes')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }

  return data || [];
}

/**
 * Загрузка одного рецепта по ID
 * @param {string} recipeId - ID рецепта
 * @returns {Promise<Object|null>} - Рецепт или null
 */
export async function fetchRecipeById(recipeId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();

  if (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }

  return data;
}

/**
 * Маппинг полей из Supabase в формат компонента
 * @param {Object} recipe - Рецепт из Supabase
 * @returns {Object} - Рецепт в формате для компонента
 */
export function mapRecipeFromSupabase(recipe) {
  if (!recipe) return null;

  // Парсим ingredients если это строка
  let ingredients = recipe.ingredients;
  if (typeof ingredients === 'string') {
    try {
      ingredients = JSON.parse(ingredients);
    } catch {
      ingredients = [];
    }
  }

  // Парсим instructions если это строка
  let instructions = recipe.instructions;
  if (typeof instructions === 'string') {
    try {
      instructions = JSON.parse(instructions);
    } catch {
      instructions = [];
    }
  }

  // Парсим tags если это строка
  let tags = recipe.tags;
  if (typeof tags === 'string') {
    try {
      tags = JSON.parse(tags);
    } catch {
      tags = [];
    }
  }

  return {
    id: recipe.id,
    name: recipe.title,
    image: recipe.image_path || recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    time: (recipe.prep_time_min || 0) + (recipe.cook_time_min || 0),
    calories: recipe.calories_per_serving || 0,
    tags: Array.isArray(tags) ? tags : [],
    meal: recipe.category,
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    steps: Array.isArray(instructions) ? instructions : [],
    // Дополнительные поля
    description: recipe.description,
    servings: recipe.servings,
    protein: recipe.protein_per_serving,
    fat: recipe.fat_per_serving,
    carbs: recipe.carbs_per_serving,
  };
}

/**
 * Загрузка и маппинг рецептов
 * @param {string} category - Тип приёма пищи
 * @returns {Promise<Array>} - Массив маппированных рецептов
 */
export async function getRecipesForMeal(category) {
  const recipes = await fetchRecipes(category);
  return recipes.map(mapRecipeFromSupabase);
}

/**
 * Загрузка всех рецептов сразу (для кэширования)
 * @returns {Promise<Object>} - Объект с рецептами по категориям
 */
export async function getAllRecipes() {
  const recipes = await fetchRecipes();
  
  const mapped = recipes.map(mapRecipeFromSupabase);
  
  return {
    all: mapped,
    breakfast: mapped.filter(r => r.meal === 'breakfast'),
    lunch: mapped.filter(r => r.meal === 'lunch'),
    dinner: mapped.filter(r => r.meal === 'dinner'),
    snack: mapped.filter(r => r.meal === 'snack'),
  };
}
