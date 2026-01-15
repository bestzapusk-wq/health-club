import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ChevronDown, ChevronUp,
  Lock, MessageCircle, Phone, Loader2,
  Upload, FileText, AlertCircle, CheckCircle
} from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { getAnalysisResult } from '../lib/analysisService';
import { supabase } from '../lib/supabase';
import './MyReportPage.css';

// Быстрая навигация
const QUICK_NAV = [
  { id: 'findings', label: 'Находки', icon: '🔍' },
  { id: 'chain', label: 'Связи', icon: '🔗' },
  { id: 'priorities', label: 'Приоритеты', icon: '🎯' },
  { id: 'details', label: 'Подробно', icon: '📋' },
];

export default function MyReportPage() {
  const navigate = useNavigate();
  // Состояния: 'loading' | 'ready' | 'no_data' | 'processing' | 'error'
  const [status, setStatus] = useState('loading');
  const [expandedFinding, setExpandedFinding] = useState(0);
  const [showGoodNews, setShowGoodNews] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [showAllIndicators, setShowAllIndicators] = useState(false);
  const [activeNav, setActiveNav] = useState('findings');
  
  // Диагностика — что именно не готово
  const [diagnostics, setDiagnostics] = useState({
    hasUser: false,
    hasSurvey: false,
    hasFiles: false,
    hasAnalysis: false,
    analysisStatus: null,
    errorMessage: null
  });

  // Данные для отображения
  const [reportData, setReportData] = useState(null);

  // Загрузка данных
  useEffect(() => {
    loadAnalysisResult();
  }, []);

  const loadAnalysisResult = async () => {
    setStatus('loading');
    
    const diag = {
      hasUser: false,
      hasSurvey: false,
      hasFiles: false,
      hasAnalysis: false,
      analysisStatus: null,
      errorMessage: null
    };

    try {
      // 1. Получаем userId
      let userId = null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userId = session.user.id;
        diag.hasUser = true;
      } else {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            userId = parsed.id;
            diag.hasUser = !!userId;
          } catch (e) {
            console.error('Error parsing user_data:', e);
          }
        }
      }
      
      if (!userId) {
        diag.errorMessage = 'Пользователь не авторизован';
        setDiagnostics(diag);
        setStatus('no_data');
        return;
      }

      // 2. Проверяем опросник
      const { data: surveyData } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      diag.hasSurvey = surveyData && surveyData.length > 0;

      // 3. Проверяем загруженные файлы
      const { data: filesData } = await supabase
        .from('uploaded_files')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      diag.hasFiles = filesData && filesData.length > 0;

      // 4. Проверяем результат анализа
      const { data: analysisData } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (analysisData) {
        diag.hasAnalysis = true;
        diag.analysisStatus = analysisData.status;

        // Если анализ в процессе
        if (analysisData.status === 'processing') {
          setDiagnostics(diag);
          setStatus('processing');
          return;
        }

        // Если ошибка
        if (analysisData.status === 'error') {
          diag.errorMessage = analysisData.error_message || 'Ошибка при генерации анализа';
          setDiagnostics(diag);
          setStatus('error');
          return;
        }

        // Если готов (status = 'completed' или 'ready')
        if (analysisData.status === 'completed' || analysisData.status === 'ready') {
          let transformedData = null;
          
          // Данные могут быть в отдельных колонках ИЛИ в result_data
          if (analysisData.body_systems || analysisData.main_findings) {
            // Данные в отдельных колонках
            transformedData = transformFromColumns(analysisData);
          } else if (analysisData.result_data) {
            // Данные в result_data
            transformedData = transformFromResultData(analysisData.result_data);
          }
          
          if (transformedData) {
            setReportData(transformedData);
            setDiagnostics(diag);
            setStatus('ready');
            localStorage.setItem('results_ready', 'true');
            return;
          }
        }
      }

      // Нет данных — определяем причину
      if (!diag.hasSurvey && !diag.hasFiles) {
        diag.errorMessage = 'Загрузите анализы и пройдите опросник';
      } else if (!diag.hasSurvey) {
        diag.errorMessage = 'Пройдите опросник на главной странице';
      } else if (!diag.hasFiles) {
        diag.errorMessage = 'Загрузите результаты анализов';
      } else if (!diag.hasAnalysis) {
        diag.errorMessage = 'Нажмите "Получить результаты" на главной странице';
      } else {
        diag.errorMessage = 'Анализ ещё не готов';
      }

      setDiagnostics(diag);
      setStatus('no_data');

    } catch (err) {
      console.error('Error loading analysis:', err);
      diag.errorMessage = err.message || 'Ошибка загрузки данных';
      setDiagnostics(diag);
      setStatus('error');
    }
  };

  // Трансформация данных из result_data (формат Edge Function)
  const transformFromResultData = (resultData) => {
    try {
      console.log('Transforming from result_data:', resultData);
      
      // Получаем данные профиля
      const userData = localStorage.getItem('user_data');
      const profile = userData ? JSON.parse(userData) : {};

      // Подсчитываем статистику из маркеров
      const criticalCount = resultData.critical_markers?.length || 0;
      const warningCount = resultData.warning_markers?.length || 0;
      const normalCount = resultData.normal_markers?.length || 0;

      // Трансформируем main_findings в mainFindings массив
      let mainFindingsArray = [];
      if (resultData.main_findings) {
        if (Array.isArray(resultData.main_findings)) {
          mainFindingsArray = resultData.main_findings;
        } else if (typeof resultData.main_findings === 'object') {
          // Если это объект с summary, создаём один элемент
          mainFindingsArray = [{
            num: 1,
            title: 'Общая оценка',
            status: resultData.main_findings.risk_level === 'high' ? 'critical' : 'warning',
            description: resultData.main_findings.summary || '',
            symptoms: []
          }];
        }
      }

      // Трансформируем priorities
      let prioritiesArray = [];
      if (resultData.priorities && Array.isArray(resultData.priorities)) {
        prioritiesArray = resultData.priorities.map((p, i) => ({
          num: p.priority || i + 1,
          title: p.title || '',
          desc: p.description || ''
        }));
      }

      // Трансформируем connection_chain
      let connectionChainArray = [];
      if (resultData.connection_chain) {
        if (Array.isArray(resultData.connection_chain)) {
          connectionChainArray = resultData.connection_chain;
        } else if (resultData.connection_chain.connections) {
          connectionChainArray = resultData.connection_chain.connections.map(c => ({
            text: `${c.from} → ${c.to}`,
            type: 'warning'
          }));
        }
      }

      // Трансформируем body_systems в detailSections
      let detailSections = [];
      if (resultData.body_systems && Array.isArray(resultData.body_systems)) {
        detailSections = resultData.body_systems.map((sys, i) => ({
          id: `system-${i}`,
          icon: '🔬',
          title: sys.system || sys.title || '',
          badge: sys.status === 'critical' ? 'Критично' : sys.status === 'warning' ? 'Внимание' : 'Норма',
          badgeType: sys.status || 'normal',
          content: sys.findings?.join('. ') || '',
          symptoms: sys.recommendations || []
        }));
      }

      // Трансформируем маркеры в keyIndicators
      let keyIndicators = [];
      if (resultData.critical_markers) {
        keyIndicators.push(...resultData.critical_markers.map(m => ({
          name: m.name,
          value: m.value,
          unit: '',
          status: 'critical',
          ref: m.reference || ''
        })));
      }
      if (resultData.warning_markers) {
        keyIndicators.push(...resultData.warning_markers.map(m => ({
          name: m.name,
          value: m.value,
          unit: '',
          status: 'warning',
          ref: m.reference || ''
        })));
      }

      return {
        patientData: {
          name: profile.name || profile.first_name || 'Пользователь',
          age: profile.age || 'н/д',
          weight: profile.weight || 'не указан',
          date: new Date().getFullYear()
        },
        statsData: { 
          critical: criticalCount, 
          warning: warningCount, 
          normal: normalCount 
        },
        mainFindings: mainFindingsArray,
        connectionChain: connectionChainArray,
        goodNews: resultData.good_news || [],
        detailSections: detailSections,
        priorities: prioritiesArray,
        keyIndicators: keyIndicators,
        summary: typeof resultData.main_findings?.summary === 'string' 
          ? { text: resultData.main_findings.summary } 
          : { text: 'Анализ ваших результатов готов.' },
        disclaimer: 'Это не диагноз, а помощь в понимании результатов. Все решения принимайте с врачом.'
      };
    } catch (err) {
      console.error('Error transforming result_data:', err);
      return null;
    }
  };

  // Хелпер для безопасного преобразования в массив
  const toArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (typeof data === 'object') {
      // Если объект с числовыми ключами или items
      if (data.items && Array.isArray(data.items)) return data.items;
      return Object.values(data);
    }
    return [];
  };

  // Трансформация данных из колонок БД в формат UI
  const transformFromColumns = (result) => {
    try {
      console.log('Transforming result:', result);
      
      // Получаем данные профиля
      const userData = localStorage.getItem('user_data');
      const profile = userData ? JSON.parse(userData) : {};

      // Безопасно получаем массивы
      const mainFindingsArr = toArray(result.main_findings);
      const criticalMarkersArr = toArray(result.critical_markers);
      const warningMarkersArr = toArray(result.warning_markers);
      const normalMarkersArr = toArray(result.normal_markers);
      const bodySystemsArr = toArray(result.body_systems);
      const prioritiesArr = toArray(result.priorities);
      // connection_chain может быть объектом {connections: [...], root_causes: [...]}
      let connectionChainArr = [];
      let rootCauses = [];
      if (result.connection_chain && typeof result.connection_chain === 'object' && !Array.isArray(result.connection_chain)) {
        // Это объект с connections и root_causes
        connectionChainArr = toArray(result.connection_chain.connections);
        rootCauses = toArray(result.connection_chain.root_causes);
      } else {
        // Это массив напрямую
        connectionChainArr = toArray(result.connection_chain);
        if (connectionChainArr.length > 0 && Array.isArray(connectionChainArr[0])) {
          connectionChainArr = connectionChainArr.flat();
        }
      }
      const goodNewsArr = toArray(result.good_news);

      console.log('Parsed arrays:', { 
        mainFindingsArr, criticalMarkersArr, warningMarkersArr, 
        normalMarkersArr, prioritiesArr 
      });
      
      // Логируем первый элемент каждого массива для понимания структуры
      // Логируем ВСЕ main_findings для понимания структуры
      console.log('=== ALL main_findings ===');
      mainFindingsArr.forEach((f, i) => {
        console.log(`main_finding[${i}]:`, typeof f, f);
        if (typeof f === 'object' && f !== null) {
          console.log(`  keys:`, Object.keys(f));
        }
      });
      
      // Логируем body_systems
      console.log('=== ALL body_systems ===');
      bodySystemsArr.forEach((s, i) => {
        console.log(`body_system[${i}]:`, s);
        if (typeof s === 'object' && s !== null) {
          console.log(`  keys:`, Object.keys(s));
        }
      });
      if (prioritiesArr[0]) {
        console.log('First priority:', prioritiesArr[0]);
        console.log('priority keys:', Object.keys(prioritiesArr[0]));
        console.log('FULL priority[0]:', JSON.stringify(prioritiesArr[0], null, 2));
      }
      
      // Логируем summary
      console.log('Raw summary:', result.summary);
      console.log('Type of summary:', typeof result.summary);
      
      // Логируем markers
      console.log('Critical markers:', criticalMarkersArr.length, criticalMarkersArr);
      console.log('Warning markers:', warningMarkersArr.length, warningMarkersArr);
      console.log('Normal markers:', normalMarkersArr.length, normalMarkersArr);
      console.log('connectionChainArr after flatten:', connectionChainArr);
      if (connectionChainArr[0]) {
        console.log('First connection_chain item:', connectionChainArr[0]);
        console.log('Has from/to:', connectionChainArr[0].from, '->', connectionChainArr[0].to);
      }

      // Статистика по маркерам
      const criticalCount = criticalMarkersArr.length;
      const warningCount = warningMarkersArr.length;
      const normalCount = normalMarkersArr.length;

      // main_findings от Claude — это объект {summary, risk_level, health_score}, не массив!
      // Настоящие "находки" — это critical_markers + warning_markers
      
      // Получаем summary из main_findings (если это объект)
      let summaryText = '';
      let healthScore = null;
      let riskLevel = 'medium';
      
      if (typeof result.main_findings === 'object' && result.main_findings !== null && !Array.isArray(result.main_findings)) {
        summaryText = result.main_findings.summary || '';
        healthScore = result.main_findings.health_score;
        riskLevel = result.main_findings.risk_level || 'medium';
      }

      // Объединяем critical + warning маркеры в находки
      const mainFindings = [
        ...criticalMarkersArr.map((marker, index) => ({
          num: index + 1,
          title: marker.name || `Критичный маркер ${index + 1}`,
          description: marker.interpretation || marker.value || '',
          status: 'critical',
          symptoms: [],
          value: marker.value,
          reference: marker.reference
        })),
        ...warningMarkersArr.map((marker, index) => ({
          num: criticalMarkersArr.length + index + 1,
          title: marker.name || `Маркер внимания ${index + 1}`,
          description: marker.interpretation || marker.value || '',
          status: 'warning',
          symptoms: [],
          value: marker.value,
          reference: marker.reference
        }))
      ];

      // Трансформируем connection_chain
      // Claude возвращает объекты {from, to, explanation}
      const connectionChain = [
        // Сначала добавляем root_causes как первопричины
        ...rootCauses.map((cause) => ({
          type: 'root',
          text: `🔴 ${cause}`,
          explanation: 'Первопричина',
          items: null
        })),
        // Затем добавляем связи
        ...connectionChainArr
          .filter(item => typeof item === 'object' && item !== null && item.from && item.to)
          .map((item, index) => ({
            type: index === 0 ? 'cause' : 'effect',
            text: `${item.from} → ${item.to}`,
            explanation: item.explanation || '',
            items: null
          }))
      ];

      // Трансформируем priorities
      const priorities = prioritiesArr.map((p, index) => ({
        num: index + 1,
        title: p.title || p.action || `Приоритет ${index + 1}`,
        desc: p.description || p.reason || ''
      }));

      // Маппинг иконок для систем
      const systemIcons = {
        'пищеварительная': '🍽️',
        'эндокринная': '⚡',
        'иммунная': '🛡️',
        'нервная': '🧠',
        'сердечно': '❤️',
        'дыхательная': '🫁',
        'мочевыделительная': '💧',
        'репродуктивная': '🌸',
        'костная': '🦴',
        'кожа': '✨',
      };
      
      const getSystemIcon = (systemName) => {
        const name = (systemName || '').toLowerCase();
        for (const [key, icon] of Object.entries(systemIcons)) {
          if (name.includes(key)) return icon;
        }
        return '🔬';
      };
      
      // Трансформируем body_systems в detailSections
      // Claude возвращает: {score, status, system, findings, recommendations}
      const detailSections = bodySystemsArr.map((section, index) => {
        const findingsArr = toArray(section.findings);
        const recommendationsArr = toArray(section.recommendations);
        const systemName = section.system || section.name || section.title || `Система ${index + 1}`;
        
        // Формируем контент из findings и recommendations
        let content = '';
        if (findingsArr.length > 0) {
          content += '<div class="findings-block"><strong>Что обнаружено:</strong><ul>' + 
            findingsArr.map(f => `<li>${f}</li>`).join('') + '</ul></div>';
        }
        if (recommendationsArr.length > 0) {
          content += '<div class="recommendations-block"><strong>Рекомендации:</strong><ul>' + 
            recommendationsArr.map(r => `<li>${r}</li>`).join('') + '</ul></div>';
        }
        
        // Маппинг статусов на русский
        const statusLabels = {
          'critical': 'критично',
          'warning': 'внимание',
          'normal': 'норма',
          'good': 'норма'
        };
        
        return {
          id: section.id || `section-${index}`,
          icon: getSystemIcon(systemName),
          title: systemName,
          badge: statusLabels[section.status] || section.status || 'норма',
          badgeType: section.status === 'critical' ? 'critical' : 
                     section.status === 'warning' ? 'warning' : 'good',
          content: content || section.content || section.description || '',
          score: section.score,
          symptoms: toArray(section.symptoms),
          infoBox: section.info_box || null
        };
      });

      // Объединяем все маркеры для keyIndicators
      const keyIndicators = [
        ...criticalMarkersArr.map(m => ({ ...m, status: 'critical' })),
        ...warningMarkersArr.map(m => ({ ...m, status: 'warning' })),
        ...normalMarkersArr.slice(0, 3).map(m => ({ ...m, status: 'normal' }))
      ];

      // Используем summaryText из main_findings (объект) или из колонки summary
      let summaryData = null;
      if (summaryText) {
        summaryData = { text: summaryText, healthScore, riskLevel };
      } else if (result.summary) {
        if (typeof result.summary === 'string') {
          summaryData = { text: result.summary };
        } else {
          summaryData = result.summary;
        }
      }

      return {
        patientData: {
          name: profile.name || profile.first_name || 'Пользователь',
          age: profile.age || 'н/д',
          weight: profile.weight || 'не указан',
          date: new Date().getFullYear()
        },
        statsData: {
          critical: criticalCount,
          warning: warningCount,
          normal: normalCount
        },
        mainFindings,
        connectionChain,
        goodNews: goodNewsArr,
        detailSections,
        priorities,
        keyIndicators,
        summary: summaryData || { text: '' },
        disclaimer: 'Это не диагноз, а помощь в понимании результатов. Все решения принимайте с врачом.'
      };
    } catch (err) {
      console.error('Error transforming data:', err);
      return null;
    }
  };

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['findings', 'chain', 'priorities', 'details'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 200 && rect.bottom > 100) {
            setActiveNav(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Состояние загрузки
  if (status === 'loading') {
    return (
      <div className="report-page">
        <header className="report-header-new">
          <div className="header-top">
            <button className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={22} />
            </button>
            <span className="header-title">Мой разбор</span>
            <div style={{ width: 40 }} />
          </div>
        </header>
        <div className="empty-state">
          <Loader2 size={48} className="spinner" />
          <h2>Загрузка...</h2>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Состояние "нет данных" — показываем диагностику
  if (status === 'no_data' || status === 'error') {
    return (
      <div className="report-page">
        <header className="report-header-new">
          <div className="header-top">
            <button className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={22} />
            </button>
            <span className="header-title">Мой разбор</span>
            <div style={{ width: 40 }} />
          </div>
        </header>
        
        <div className="empty-state">
          <div className="empty-icon">
            {status === 'error' ? (
              <AlertCircle size={64} color="#EF4444" />
            ) : (
              <Upload size={64} color="#9CA3AF" />
            )}
          </div>
          
          <h2>{status === 'error' ? 'Ошибка' : 'Загрузите материалы'}</h2>
          
          <p className="empty-message">
            {diagnostics.errorMessage || 'Для получения разбора нужны ваши данные'}
          </p>

          {/* Чеклист готовности */}
          <div className="readiness-checklist">
            <div className={`checklist-item ${diagnostics.hasUser ? 'done' : ''}`}>
              {diagnostics.hasUser ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>Авторизация</span>
            </div>
            <div className={`checklist-item ${diagnostics.hasSurvey ? 'done' : ''}`}>
              {diagnostics.hasSurvey ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>Опросник пройден</span>
            </div>
            <div className={`checklist-item ${diagnostics.hasFiles ? 'done' : ''}`}>
              {diagnostics.hasFiles ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>Анализы загружены</span>
            </div>
            <div className={`checklist-item ${diagnostics.hasAnalysis && diagnostics.analysisStatus === 'completed' ? 'done' : ''}`}>
              {diagnostics.hasAnalysis && diagnostics.analysisStatus === 'completed' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>Разбор готов</span>
            </div>
          </div>

          <button className="primary-btn" onClick={() => navigate('/')}>
            Перейти на главную
          </button>
        </div>
        
        <BottomNav />
      </div>
    );
  }

  // Состояние "анализ в процессе"
  if (status === 'processing') {
    return (
      <div className="report-page">
        <header className="report-header-new">
          <div className="header-top">
            <button className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={22} />
            </button>
            <span className="header-title">Мой разбор</span>
            <div style={{ width: 40 }} />
          </div>
        </header>
        
        <div className="empty-state">
          <Loader2 size={64} className="spinner" />
          <h2>Анализ в процессе</h2>
          <p className="empty-message">
            AI изучает ваши анализы. Это займёт 1-2 минуты.
          </p>
          <button className="secondary-btn" onClick={loadAnalysisResult}>
            Проверить статус
          </button>
        </div>
        
        <BottomNav />
      </div>
    );
  }

  // Данные не загружены (fallback)
  if (!reportData) {
    return (
      <div className="report-page">
        <header className="report-header-new">
          <div className="header-top">
            <button className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={22} />
            </button>
            <span className="header-title">Мой разбор</span>
            <div style={{ width: 40 }} />
          </div>
        </header>
        <div className="empty-state">
          <AlertCircle size={48} color="#9CA3AF" />
          <h2>Нет данных</h2>
          <button className="primary-btn" onClick={() => navigate('/')}>
            На главную
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const { 
    patientData, 
    statsData, 
    mainFindings, 
    connectionChain, 
    goodNews, 
    detailSections, 
    priorities, 
    keyIndicators,
    summary,
    disclaimer
  } = reportData;

  // Показываем только критичные показатели сначала
  const criticalIndicators = keyIndicators.filter(i => i.status === 'critical');
  const warningIndicators = keyIndicators.filter(i => i.status === 'warning');
  const displayedIndicators = showAllIndicators ? keyIndicators : criticalIndicators;

  return (
    <div className="report-page">
      {/* === HEADER === */}
      <header className="report-header-new">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={22} />
          </button>
          <span className="header-title">Мой разбор</span>
          <div className="header-actions">
            <button className="action-btn" title="Скачать">📄</button>
          </div>
        </div>
        
        <h1 className="patient-name">{patientData.name}</h1>
        
        <div className="patient-stats">
          <div className="stat-chip">
            <span className="stat-value">{patientData.age}</span>
            <span className="stat-label">возраст</span>
          </div>
          <div className="stat-chip">
            <span className="stat-value">{patientData.weight}</span>
            <span className="stat-label">вес</span>
          </div>
          <div className="stat-chip">
            <span className="stat-value">{patientData.date}</span>
            <span className="stat-label">дата</span>
          </div>
        </div>
      </header>

      {/* === СТАТИСТИКА === */}
      <div className="stats-row">
        <div className="stats-item critical">
          <span className="stats-num">{statsData.critical}</span>
          <span className="stats-label">критичных</span>
        </div>
        <div className="stats-item warning">
          <span className="stats-num">{statsData.warning}</span>
          <span className="stats-label">внимание</span>
        </div>
        <div className="stats-item good">
          <span className="stats-num">{statsData.normal}</span>
          <span className="stats-label">в норме</span>
        </div>
      </div>

      {/* === БЫСТРАЯ НАВИГАЦИЯ === */}
      <div className="quick-nav">
        {QUICK_NAV.map(item => (
          <button 
            key={item.id}
            className={`quick-nav-btn ${activeNav === item.id ? 'active' : ''}`}
            onClick={() => scrollTo(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <main className="report-content-new">
        
        {/* === КРАТКОЕ РЕЗЮМЕ === */}
        <div className="summary-card">
          <h2>📌 Главное</h2>
          {summary?.text ? (
            <p>{summary.text.split('\n\n')[0]}</p>
          ) : (
            <p>
              {mainFindings.length > 0 
                ? `Обнаружено ${mainFindings.length} ключевых находок, требующих внимания.`
                : 'Анализ ваших результатов готов.'
              }
            </p>
          )}
        </div>

        {/* === 3 ГЛАВНЫЕ НАХОДКИ === */}
        <section className="section" id="findings">
          <h2 className="section-title">🔍 {mainFindings.length} главные находки</h2>
          
          <div className="findings-list">
            {mainFindings.map((finding, index) => (
              <div 
                key={finding.num}
                className={`finding-card ${finding.status} ${expandedFinding === index ? 'expanded' : ''}`}
              >
                <div 
                  className="finding-header"
                  onClick={() => setExpandedFinding(expandedFinding === index ? -1 : index)}
                >
                  <span className="finding-num">{finding.num}</span>
                  <h3>{finding.title}</h3>
                  <span className={`finding-badge ${finding.status}`}>
                    {finding.status === 'critical' ? '🔴' : '⚠️'}
                  </span>
                  {expandedFinding === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                
                {expandedFinding === index && (
                  <div className="finding-body">
                    <p>{finding.description}</p>
                    
                    {finding.symptoms && finding.symptoms.length > 0 && (
                      <div className="symptoms-box">
                        <strong>💬 Ваши симптомы из опросника:</strong>
                        <div className="symptoms-tags">
                          {finding.symptoms.map((s, i) => (
                            <span key={i} className="symptom-tag">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* === КАК ЭТО СВЯЗАНО === */}
        {connectionChain && connectionChain.length > 0 && (
          <section className="section" id="chain">
            <h2 className="section-title">🔗 Как это связано</h2>
            <p className="section-subtitle">Почему одна проблема вызывает другие</p>
            
            <div className="connection-chain">
              {connectionChain.map((item, index) => (
                <div key={index} className="chain-step">
                  <div className={`chain-node ${item.type}`}>
                    {item.items ? (
                      <div className="chain-split">
                        {item.items.map((text, i) => (
                          <span key={i} className="chain-split-item">{text}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="chain-content">
                        <span className="chain-text">{item.text}</span>
                        {item.explanation && (
                          <span className="chain-explanation">{item.explanation}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {index < connectionChain.length - 1 && (
                    <div className="chain-arrow">↓</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === ПРИОРИТЕТЫ === */}
        {priorities && priorities.length > 0 && (
          <section className="priorities-card" id="priorities">
            <h2>🎯 Что делать? Приоритеты</h2>
            <p className="priorities-subtitle">Обсудите с врачом в первую очередь</p>
            
            <div className="priorities-list-new">
              {priorities.slice(0, 3).map((priority) => (
                <div key={priority.num} className="priority-item">
                  <span className="priority-num-circle">{priority.num}</span>
                  <div className="priority-text">
                    <strong>{priority.title}</strong>
                    <p>{priority.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === ЧТО В ПОРЯДКЕ === */}
        {goodNews && goodNews.length > 0 && (
          <section className="section">
            <button 
              className="good-news-toggle"
              onClick={() => setShowGoodNews(!showGoodNews)}
            >
              <span>✅ Что в порядке ({goodNews.length})</span>
              {showGoodNews ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {showGoodNews && (
              <div className="good-news-list">
                {goodNews.map((item, index) => (
                  <div key={index} className="good-news-item">
                    <span className="check">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* === КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ (КОМПАКТНО) === */}
        {keyIndicators && keyIndicators.length > 0 && (
          <section className="section">
            <h2 className="section-title">📊 Отклонения в анализах</h2>
            
            <div className="indicators-compact">
              {displayedIndicators.map((indicator, index) => (
                <div key={index} className={`indicator-compact ${indicator.status}`}>
                  <div className="indicator-compact-main">
                    <span className="indicator-compact-badge">
                      {indicator.status === 'critical' ? '🔴' : '⚠️'}
                    </span>
                    <span className="indicator-compact-name">{indicator.name}</span>
                    <span className="indicator-compact-value">{indicator.value} {indicator.unit}</span>
                  </div>
                  <span className="indicator-compact-ref">{indicator.ref}</span>
                </div>
              ))}
            </div>

            {!showAllIndicators && warningIndicators.length > 0 && (
              <button 
                className="show-more-btn"
                onClick={() => setShowAllIndicators(true)}
              >
                Показать ещё {warningIndicators.length} показателей
                <ChevronDown size={18} />
              </button>
            )}
          </section>
        )}

        {/* === ПОДРОБНЫЙ РАЗБОР === */}
        {detailSections && detailSections.length > 0 && (
          <section className="section" id="details">
            <h2 className="section-title">📋 Подробный разбор по системам</h2>
            
            <div className="detail-sections">
              {detailSections.map((section) => (
                <div key={section.id} className="detail-section">
                  <button 
                    className={`detail-header ${expandedSection === section.id ? 'expanded' : ''}`}
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  >
                    <span className="detail-icon">{section.icon}</span>
                    <span className="detail-title">{section.title}</span>
                    <span className={`detail-badge ${section.badgeType}`}>{section.badge}</span>
                    {expandedSection === section.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  
                  {expandedSection === section.id && (
                    <div className="detail-body">
                      {section.infoBox && (
                        <div className="info-box">
                          <strong>{section.infoBox.title}</strong>
                          <p>{section.infoBox.text}</p>
                        </div>
                      )}
                      
                      <div 
                        className="detail-content"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                      
                      {section.symptoms && section.symptoms.length > 0 && (
                        <div className="detail-symptoms">
                          <strong>Ваши симптомы:</strong>
                          <div className="symptoms-tags">
                            {section.symptoms.map((s, i) => (
                              <span key={i} className="symptom-tag red">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === CTA === */}
        <section className="cta-section-new">
          <span className="cta-emoji">👨‍⚕️</span>
          <h3>Обсудите результаты со специалистом</h3>
          <p>Разберём анализы, составим план и ответим на вопросы</p>
          
          <button className="cta-button-new">
            <Phone size={20} />
            Записаться на консультацию
          </button>
          
          <button className="cta-whatsapp-new">
            <MessageCircle size={18} />
            Написать в WhatsApp
          </button>
        </section>

        {/* Disclaimer */}
        <div className="disclaimer-bottom">
          ⚠️ {disclaimer || 'Это не диагноз, а помощь в понимании результатов. Все решения принимайте с врачом.'}
        </div>

      </main>

      <BottomNav />
    </div>
  );
}

