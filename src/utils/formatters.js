export function formatPhone(value) {
  if (!value) return '';
  
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 11 digits (7 + 10)
  const limited = digits.slice(0, 11);
  
  // Format as +7 (XXX) XXX-XX-XX
  let formatted = '';
  
  if (limited.length > 0) {
    // Always start with +7
    if (limited[0] === '8' || limited[0] === '7') {
      formatted = '+7';
      const rest = limited.slice(1);
      if (rest.length > 0) {
        formatted += ' (' + rest.slice(0, 3);
        if (rest.length > 3) {
          formatted += ') ' + rest.slice(3, 6);
          if (rest.length > 6) {
            formatted += '-' + rest.slice(6, 8);
            if (rest.length > 8) {
              formatted += '-' + rest.slice(8, 10);
            }
          }
        }
      }
    } else {
      formatted = '+7 (' + limited.slice(0, 3);
      if (limited.length > 3) {
        formatted += ') ' + limited.slice(3, 6);
        if (limited.length > 6) {
          formatted += '-' + limited.slice(6, 8);
          if (limited.length > 8) {
            formatted += '-' + limited.slice(8, 10);
          }
        }
      }
    }
  }
  
  return formatted;
}

export function unformatPhone(value) {
  return value.replace(/\D/g, '');
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Б';
  
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

