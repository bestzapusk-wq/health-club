/**
 * Трансформация результата анализа от Claude в формат для UI
 * 
 * Формат Claude → Формат UI (MyReportPage)
 */

/**
 * Основная функция трансформации
 * @param {Object} claudeResult - JSON от Claude API
 * @returns {Object} - Данные для MyReportPage
 */
export function transformAnalysisResult(claudeResult) {
  if (!claudeResult) return null;

  return {
    patientData: transformPatient(claudeResult.patient),
    statsData: transformStats(claudeResult),
    mainFindings: transformMainFindings(claudeResult.mainFindings),
    connectionChain: transformConnectionChain(claudeResult.connectionChain),
    goodNews: claudeResult.goodNews || [],
    detailSections: transformDetailSections(claudeResult.detailedAnalysis),
    priorities: transformPriorities(claudeResult),
    keyIndicators: transformKeyIndicators(claudeResult.keyMarkers),
    summary: transformSummary(claudeResult.summary),
    disclaimer: claudeResult.disclaimer || 'Это не диагноз, а помощь в понимании результатов. Все решения принимайте с врачом.'
  };
}

/**
 * Трансформация данных пациента
 */
function transformPatient(patient) {
  if (!patient) return { name: 'Пациент', age: '-', weight: '-', date: '-' };

  return {
    name: patient.name || 'Пациент',
    age: patient.age || '-',
    weight: patient.weight || '-',
    date: patient.date || new Date().toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })
  };
}

/**
 * Трансформация статистики показателей
 */
function transformStats(result) {
  // Если есть готовая статистика
  if (result.stats) {
    return {
      critical: result.stats.critical || 0,
      warning: result.stats.warning || 0,
      normal: result.stats.normal || 0
    };
  }

  // Подсчитываем из keyMarkers
  const markers = result.keyMarkers || [];
  return {
    critical: markers.filter(m => m.status === 'elevated' || m.status === 'critical').length,
    warning: markers.filter(m => m.status === 'warning').length,
    normal: markers.filter(m => m.status === 'normal' || m.status === 'ok').length
  };
}

/**
 * Трансформация главных находок
 */
function transformMainFindings(findings) {
  if (!findings || !Array.isArray(findings)) return [];

  return findings.map((finding, index) => ({
    num: finding.number || index + 1,
    title: finding.title,
    status: finding.status === 'warning' ? 'warning' : 'critical',
    description: finding.description,
    symptoms: parseSymptoms(finding.relatedSymptoms)
  }));
}

/**
 * Парсинг симптомов (могут быть строкой или массивом)
 */
function parseSymptoms(symptoms) {
  if (!symptoms) return [];
  if (Array.isArray(symptoms)) return symptoms;
  if (typeof symptoms === 'string') {
    // Разбиваем по запятой или точке с запятой
    return symptoms.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Трансформация цепочки связей
 */
function transformConnectionChain(chain) {
  if (!chain) return [];

  // Если это новый формат с rootCause и steps
  if (chain.rootCause && chain.steps) {
    const result = [
      { text: chain.rootCause, type: 'critical' }
    ];

    chain.steps.forEach((step, index) => {
      // Определяем тип шага
      let type = 'normal';
      if (step.startsWith('↓') || step.startsWith('↑')) {
        type = 'accent';
      } else if (index === chain.steps.length - 1) {
        type = 'result';
      } else if (step.includes('→')) {
        type = 'warning';
      }

      result.push({ text: step, type });
    });

    return result;
  }

  // Если это уже массив шагов
  if (Array.isArray(chain)) {
    return chain.map(step => {
      if (typeof step === 'string') {
        return { text: step, type: 'normal' };
      }
      return step;
    });
  }

  return [];
}

/**
 * Трансформация подробного разбора
 */
function transformDetailSections(sections) {
  if (!sections || !Array.isArray(sections)) return [];

  const iconMap = {
    'bile_system': '🟡',
    'lipid_profile': '🫀',
    'homocysteine_b_vitamins': '💊',
    'liver_enzymes': '🫁',
    'other_markers': '📊',
    'vitamins': '💊',
    'gut': '🫃',
    'thyroid': '🦋',
    'energy': '⚡',
    'sleep': '😴'
  };

  const badgeMap = {
    'warning': { badge: 'Внимание', badgeType: 'warning' },
    'critical': { badge: 'Критично', badgeType: 'critical' },
    'ok': { badge: 'В норме', badgeType: 'normal' }
  };

  return sections.map(section => {
    const badge = badgeMap[section.status] || { badge: section.statusLabel || 'Инфо', badgeType: 'warning' };
    
    return {
      id: section.id,
      icon: iconMap[section.id] || '📋',
      title: section.title,
      badge: badge.badge,
      badgeType: badge.badgeType,
      infoBox: section.infoBox ? {
        title: `💡 ${section.infoBox.title}`,
        text: section.infoBox.content
      } : null,
      content: formatSectionContent(section),
      symptoms: section.relatedSymptoms || []
    };
  });
}

/**
 * Форматирование контента секции
 */
function formatSectionContent(section) {
  let content = section.explanation || '';

  // Добавляем данные о показателях
  if (section.findings && section.findings.length > 0) {
    const findingsHtml = section.findings.map(f => 
      `<strong>${f.marker} = ${f.value}</strong> (${f.labRef}) — ${f.interpretation}`
    ).join('<br><br>');

    content = findingsHtml + (content ? '<br><br>' + content : '');
  }

  return content;
}

/**
 * Трансформация приоритетов
 */
function transformPriorities(result) {
  // Пытаемся найти рекомендации в разных местах
  if (result.priorities && Array.isArray(result.priorities)) {
    return result.priorities.map((p, i) => ({
      num: p.num || i + 1,
      title: p.title,
      desc: p.desc || p.description
    }));
  }

  // Генерируем из mainFindings если нет отдельных приоритетов
  if (result.mainFindings && Array.isArray(result.mainFindings)) {
    return result.mainFindings.slice(0, 3).map((f, i) => ({
      num: i + 1,
      title: `Обратить внимание на: ${f.title}`,
      desc: f.description?.substring(0, 100) + '...'
    }));
  }

  return [];
}

/**
 * Трансформация ключевых показателей
 */
function transformKeyIndicators(markers) {
  if (!markers || !Array.isArray(markers)) return [];

  const statusMap = {
    'elevated': 'critical',
    'critical': 'critical',
    'warning': 'warning',
    'normal': 'normal',
    'ok': 'normal'
  };

  return markers.map(marker => ({
    name: marker.name,
    value: marker.value,
    unit: marker.unit || '',
    status: statusMap[marker.status] || 'warning',
    ref: marker.labRef || marker.optimal || '',
    description: marker.interpretation || ''
  }));
}

/**
 * Трансформация резюме
 */
function transformSummary(summary) {
  if (!summary) return null;

  if (typeof summary === 'string') {
    return { text: summary };
  }

  if (summary.paragraphs && Array.isArray(summary.paragraphs)) {
    return {
      title: summary.title,
      text: summary.paragraphs.join('\n\n')
    };
  }

  return summary;
}

/**
 * Валидация результата
 */
export function isValidAnalysisResult(result) {
  if (!result) return false;
  
  // Минимально необходимые поля
  return (
    result.patient || 
    result.mainFindings || 
    result.keyMarkers ||
    result.detailedAnalysis
  );
}

/**
 * Демо-данные для тестирования (можно удалить в продакшене)
 */
export function getDemoResult() {
  return {
    patient: {
      name: "Демо Пользователь",
      age: 35,
      gender: "male",
      date: "2026",
      weight: "75 кг"
    },
    disclaimer: "Это демонстрационные данные",
    mainFindings: [
      {
        number: 1,
        title: "Пример находки",
        description: "Описание проблемы",
        relatedSymptoms: "Симптом 1, Симптом 2",
        status: "warning"
      }
    ],
    goodNews: ["Показатель X в норме", "Показатель Y отличный"],
    keyMarkers: [
      {
        name: "Тестовый показатель",
        value: "5.5",
        unit: "ммоль/л",
        status: "normal",
        labRef: "4.0-6.0",
        interpretation: "В пределах нормы"
      }
    ]
  };
}
