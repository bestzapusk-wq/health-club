export function validateName(name) {
  if (!name || name.trim().length === 0) {
    return 'Введите имя';
  }
  if (name.trim().length < 2) {
    return 'Имя слишком короткое';
  }
  return null;
}

export function validateAge(age) {
  const num = parseInt(age);
  if (isNaN(num)) {
    return 'Введите возраст';
  }
  if (num < 14 || num > 120) {
    return 'Возраст от 14 до 120 лет';
  }
  return null;
}

export function validateWeight(weight) {
  const num = parseInt(weight);
  if (isNaN(num)) {
    return 'Введите вес';
  }
  if (num < 30 || num > 300) {
    return 'Вес от 30 до 300 кг';
  }
  return null;
}

export function validateHeight(height) {
  const num = parseInt(height);
  if (isNaN(num)) {
    return 'Введите рост';
  }
  if (num < 100 || num > 250) {
    return 'Рост от 100 до 250 см';
  }
  return null;
}

export function validatePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 11) {
    return 'Введите полный номер телефона';
  }
  return null;
}

export function validatePassword(password) {
  if (!password || password.length === 0) {
    return 'Введите пароль';
  }
  if (password.length < 6) {
    return 'Минимум 6 символов';
  }
  return null;
}

export function validateGender(gender) {
  if (!gender) {
    return 'Выберите пол';
  }
  return null;
}

