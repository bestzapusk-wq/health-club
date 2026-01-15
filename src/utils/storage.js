/**
 * Безопасная работа с localStorage
 * Обрабатывает ошибки в режиме инкогнито и при переполнении
 */

export function safeGetItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error writing ${key} to localStorage:`, error);
    return false;
  }
}

export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing ${key} from localStorage:`, error);
    return false;
  }
}

/**
 * Получить строку без парсинга JSON
 */
export function safeGetString(key, defaultValue = '') {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Записать строку без JSON.stringify
 */
export function safeSetString(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Error writing ${key} to localStorage:`, error);
    return false;
  }
}
