import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, ChevronUp, ChevronRight,
  Droplets, Cookie, Activity, Utensils, Brain, Heart, Shield, Sparkles
} from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import './HealthScreenPage.css';

// Форматирование даты
const formatDateLabel = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
  
  const dayNames = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  const monthsShort = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'];
  const monthsFull = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  
  const dayOfWeek = dayNames[targetDate.getDay()];
  const dayNum = targetDate.getDate();
  
  if (diffDays === 0) {
    return `Сегодня | ${dayOfWeek}, ${dayNum} ${monthsShort[targetDate.getMonth()]}`;
  } else if (diffDays === -1) {
    return `Вчера | ${dayOfWeek}, ${dayNum} ${monthsShort[targetDate.getMonth()]}`;
  } else if (diffDays === 1) {
    return `Завтра | ${dayOfWeek}, ${dayNum} ${monthsShort[targetDate.getMonth()]}`;
  } else {
    return `${dayNum} ${monthsFull[targetDate.getMonth()]}`;
  }
};

// Демо данные статистики образа жизни
const demoStats = {
  currentDate: new Date(), // сегодня
  lifestyle: { daysReported: 6, totalDays: 7, streak: 6 },
  nutrition: { avgScore: 7.2, trend: +0.5 },
  water: { avg: 2.1, goalPercent: 85 },
  activity: { avgMinutes: 42, goalPercent: 57 },
  sleep: { avgHours: 7.5, goalPercent: 94 }
};

// Тестовые данные результатов здоровья
const MOCK_DATA = {
  summary: {
    score: 68,
    status: 'warning',
    text: 'Общее состояние организма требует внимания. Выявлены несколько зон, которые нужно проработать в первую очередь.',
  },
  stats: {
    critical: 2,
    warning: 5,
    normal: 12
  },
  priorities: [
    {
      num: 1,
      title: 'Восстановить уровень железа',
      desc: 'Ферритин на нижней границе нормы. Рекомендуется увеличить потребление железа из пищи и рассмотреть добавки.'
    },
    {
      num: 2,
      title: 'Поддержать работу ЖКТ',
      desc: 'Признаки нарушения пищеварения. Стоит обратить внимание на режим питания и качество еды.'
    },
    {
      num: 3,
      title: 'Нормализовать сон',
      desc: 'Недостаток сна влияет на все системы организма. Цель — 7-8 часов качественного сна.'
    }
  ],
  systems: [
    {
      id: 'blood',
      icon: Droplets,
      title: 'Кроветворение',
      status: 'warning',
      badge: 'Внимание',
      findings: [
        'Ферритин 18 нг/мл — на нижней границе',
        'Гемоглобин 125 г/л — в норме, но ближе к нижней границе',
        'Возможен латентный дефицит железа'
      ],
      recommendations: [
        'Добавить в рацион красное мясо, печень',
        'Витамин С для лучшего усвоения железа',
        'Пересдать анализ через 3 месяца'
      ]
    },
    {
      id: 'digestion',
      icon: Utensils,
      title: 'Пищеварительная система',
      status: 'warning',
      badge: 'Внимание',
      findings: [
        'Симптомы указывают на сниженную кислотность желудка',
        'Возможны проблемы с усвоением белка',
        'Признаки дисбаланса микрофлоры'
      ],
      recommendations: [
        'Не запивать еду',
        'Добавить ферментированные продукты',
        'Рассмотреть пробиотики'
      ]
    },
    {
      id: 'sugar',
      icon: Cookie,
      title: 'Углеводный обмен',
      status: 'normal',
      badge: 'Норма',
      findings: [
        'Глюкоза натощак 4.8 ммоль/л — отлично',
        'Инсулин в норме',
        'Риск инсулинорезистентности низкий'
      ],
      recommendations: [
        'Продолжать придерживаться текущего режима питания',
        'Избегать резких скачков сахара'
      ]
    },
    {
      id: 'thyroid',
      icon: Activity,
      title: 'Щитовидная железа',
      status: 'warning',
      badge: 'Внимание',
      findings: [
        'ТТГ 3.2 мМЕ/л — в референсе, но выше оптимума',
        'Т4 свободный на нижней границе',
        'Признаки субклинического гипотиреоза'
      ],
      recommendations: [
        'Проверить антитела к ТПО',
        'Исключить дефицит йода и селена',
        'Консультация эндокринолога'
      ]
    },
    {
      id: 'nervous',
      icon: Brain,
      title: 'Нервная система',
      status: 'normal',
      badge: 'Норма',
      findings: [
        'Витамины группы B в норме',
        'Магний достаточный',
        'Когнитивные функции в порядке'
      ],
      recommendations: [
        'Поддерживать режим сна',
        'Управлять стрессом'
      ]
    },
    {
      id: 'heart',
      icon: Heart,
      title: 'Сердечно-сосудистая',
      status: 'normal',
      badge: 'Норма',
      findings: [
        'Давление в норме',
        'Холестерин в пределах нормы',
        'Пульс покоя хороший'
      ],
      recommendations: [
        'Поддерживать физическую активность',
        'Контролировать потребление соли'
      ]
    },
    {
      id: 'immune',
      icon: Shield,
      title: 'Иммунная система',
      status: 'warning',
      badge: 'Внимание',
      findings: [
        'Витамин D 22 нг/мл — недостаточность',
        'Лейкоциты в норме',
        'Частые простуды в анамнезе'
      ],
      recommendations: [
        'Витамин D3 + K2 ежедневно',
        'Проверить уровень цинка',
        'Пересдать D через 3 месяца'
      ]
    }
  ],
  keyIndicators: [
    { name: 'Ферритин', value: '18', unit: 'нг/мл', ref: '30-150', status: 'critical' },
    { name: 'Витамин D', value: '22', unit: 'нг/мл', ref: '40-60', status: 'critical' },
    { name: 'ТТГ', value: '3.2', unit: 'мМЕ/л', ref: '0.4-4.0', status: 'warning' },
    { name: 'Т4 свободный', value: '11.2', unit: 'пмоль/л', ref: '12-22', status: 'warning' },
    { name: 'Гемоглобин', value: '125', unit: 'г/л', ref: '120-140', status: 'normal' },
    { name: 'Глюкоза', value: '4.8', unit: 'ммоль/л', ref: '3.9-5.5', status: 'normal' }
  ]
};

export default function HealthScreenPage() {
  const navigate = useNavigate();
  const [expandedSystem, setExpandedSystem] = useState(null);
  const [showAllIndicators, setShowAllIndicators] = useState(false);

  const data = MOCK_DATA;
  
  const criticalIndicators = data.keyIndicators.filter(i => i.status === 'critical');
  const warningIndicators = data.keyIndicators.filter(i => i.status === 'warning');
  const displayedIndicators = showAllIndicators 
    ? data.keyIndicators 
    : [...criticalIndicators, ...warningIndicators];

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'normal': return '#22C55E';
      default: return '#6B7280';
    }
  };

  return (
    <div className="health-screen-page">
      {/* Header */}
      <header className="health-screen-header">
        <h1>Моё здоровье</h1>
        <span className="health-screen-badge">Демо-режим</span>
      </header>

      <main className="health-screen-content">
        
        {/* Summary Card */}
        <div className="health-summary-card">
          <div className="health-score-circle" style={{ '--score-color': getStatusColor(data.summary.status) }}>
            <span className="score-value">{data.summary.score}</span>
            <span className="score-label">из 100</span>
          </div>
          <div className="health-summary-text">
            <h2>Общая оценка</h2>
            <p>{data.summary.text}</p>
          </div>
        </div>

        {/* Переключатель даты */}
        <div className="week-nav">
          <button className="week-arrow">‹</button>
          <span className="week-label">{formatDateLabel(demoStats.currentDate)}</span>
          <button className="week-arrow">›</button>
        </div>

        {/* Две главные карточки */}
        <div className="main-stats">
          <div className="stat-card">
            <div className="stat-title">📊 Образ жизни</div>
            <div className="stat-big">{demoStats.lifestyle.daysReported}<span>/{demoStats.lifestyle.totalDays}</span></div>
            <div className="stat-sub">дней с отчётом</div>
            <div className="stat-badge streak">🔥 {demoStats.lifestyle.streak} дней подряд</div>
            <button className="stat-detail-btn">Подробнее</button>
          </div>

          <div className="stat-card">
            <div className="stat-title">🍽️ Питание</div>
            <div className="stat-big" style={{color: '#8BC34A'}}>{demoStats.nutrition.avgScore}</div>
            <div className="stat-sub">средняя оценка</div>
            <div className={`stat-badge ${demoStats.nutrition.trend >= 0 ? 'positive' : 'negative'}`}>
              {demoStats.nutrition.trend >= 0 ? '📈' : '📉'} {demoStats.nutrition.trend >= 0 ? '+' : ''}{demoStats.nutrition.trend} к прошлой
            </div>
            <button className="stat-detail-btn">Подробнее</button>
          </div>
        </div>

        {/* Три мини-карточки */}
        <div className="mini-stats">
          <div className="mini-card">
            <div className="mini-icon">💧</div>
            <div className="mini-label">Вода</div>
            <div className="mini-value">{demoStats.water.avg}л</div>
            <div className="mini-bar"><div className="mini-bar-fill water" style={{width: `${demoStats.water.goalPercent}%`}}></div></div>
            <div className="mini-percent">{demoStats.water.goalPercent}%</div>
          </div>

          <div className="mini-card">
            <div className="mini-icon">🏃</div>
            <div className="mini-label">Активность</div>
            <div className="mini-value">{demoStats.activity.avgMinutes}м</div>
            <div className="mini-bar"><div className="mini-bar-fill activity" style={{width: `${demoStats.activity.goalPercent}%`}}></div></div>
            <div className="mini-percent">{demoStats.activity.goalPercent}%</div>
          </div>

          <div className="mini-card">
            <div className="mini-icon">😴</div>
            <div className="mini-label">Сон</div>
            <div className="mini-value">{demoStats.sleep.avgHours}ч</div>
            <div className="mini-bar"><div className="mini-bar-fill sleep" style={{width: `${demoStats.sleep.goalPercent}%`}}></div></div>
            <div className="mini-percent">{demoStats.sleep.goalPercent}%</div>
          </div>
        </div>

        {/* Key Indicators */}
        <section className="health-section indicators-section">
          <div className="section-header-colored">
            <span className="section-header-icon">📊</span>
            <h2>Ключевые показатели</h2>
          </div>
          <div className="indicators-list">
            {displayedIndicators.map((ind, idx) => (
              <div key={idx} className={`indicator-row ${ind.status}`}>
                <span className={`indicator-dot ${ind.status}`} />
                <span className="indicator-name">{ind.name}</span>
                <span className="indicator-value">{ind.value} {ind.unit}</span>
                <span className="indicator-ref">норма: {ind.ref}</span>
              </div>
            ))}
          </div>
          {!showAllIndicators && data.keyIndicators.length > displayedIndicators.length && (
            <button className="show-more-btn" onClick={() => setShowAllIndicators(true)}>
              Показать все {data.keyIndicators.length} показателей
              <ChevronDown size={18} />
            </button>
          )}
        </section>

        {/* Body Systems */}
        <section className="health-section">
          <h2 className="section-title">🔬 Системы организма</h2>
          <div className="systems-list">
            {data.systems.map(system => {
              const Icon = system.icon;
              const isExpanded = expandedSystem === system.id;
              
              return (
                <div key={system.id} className={`system-card ${system.status}`}>
                  <button 
                    className="system-header"
                    onClick={() => setExpandedSystem(isExpanded ? null : system.id)}
                  >
                    <div className="system-icon">
                      <Icon size={22} />
                    </div>
                    <span className="system-title">{system.title}</span>
                    <span className={`system-badge ${system.status}`}>{system.badge}</span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  
                  {isExpanded && (
                    <div className="system-body">
                      <div className="system-findings">
                        <strong>Что обнаружено:</strong>
                        <ul>
                          {system.findings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="system-recommendations">
                        <strong>Рекомендации:</strong>
                        <ul>
                          {system.recommendations.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Priorities */}
        <section className="health-section">
          <h2 className="section-title">🎯 Что делать в первую очередь</h2>
          <div className="priorities-list">
            {data.priorities.map(p => (
              <div key={p.num} className="priority-card">
                <span className="priority-num">{p.num}</span>
                <div className="priority-content">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Premium CTA */}
        <section className="premium-cta-section">
          {/* Sparkles decoration */}
          <div className="sparkle sparkle-1">✦</div>
          <div className="sparkle sparkle-2">✦</div>
          <div className="sparkle sparkle-3">✦</div>
          <div className="sparkle sparkle-4">✦</div>
          
          {/* Top badge */}
          <div className="premium-badge">
            <span>Персональная программа</span>
          </div>
          
          {/* Main content */}
          <h3>Полный цикл восстановления</h3>
          <p className="premium-subtitle">Персонально под контролем 3х специалистов</p>
          
          {/* Specialists */}
          <div className="specialists-row">
            <div className="specialist">
              <div className="specialist-icon">👨‍⚕️</div>
              <span>Врач</span>
            </div>
            <div className="specialist">
              <div className="specialist-icon">🥗</div>
              <span>Нутрициолог</span>
            </div>
            <div className="specialist">
              <div className="specialist-icon">💪</div>
              <span>Тренер</span>
            </div>
          </div>
          
          {/* Features */}
          <div className="premium-features">
            <span><i className="check-icon">✓</i> Разбор анализов</span>
            <span><i className="check-icon">✓</i> План питания</span>
            <span><i className="check-icon">✓</i> Программа тренировок</span>
          </div>
          
          {/* CTA Button */}
          <button className="premium-cta-btn" onClick={() => navigate('/report')}>
            Записаться на диагностику
            <ChevronRight size={20} />
          </button>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
