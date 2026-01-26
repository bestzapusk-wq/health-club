import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Plus,
  MessageCircle, Phone, Loader2,
  Upload, ClipboardList, AlertCircle, CheckCircle, ArrowRight, FileUp,
  Share2, Check,
  // Иконки для систем организма
  Droplets, Cookie, Activity, Utensils, Brain, Heart, Wind, Bone, Shield, Sparkles
} from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import UploadModal from '../components/main/UploadModal';
import { ProfileSwitcher, AnalysisHistory, ChangesOverview, AddFamilyMemberModal } from '../components/report';
import { supabase } from '../lib/supabase';
import { generateReport } from '../lib/generateReport';
import { getAnalysisHistory, getAnalysisById, getAnalysisForProfile } from '../lib/analysisService';
import { familyService, getRelationLabel } from '../lib/familyService';
import './MyReportPage.css';

// Быстрая навигация
const QUICK_NAV = [
  { id: 'findings', label: 'Находки', icon: '🔍' },
  { id: 'chain', label: 'Связи', icon: '🔗' },
  { id: 'priorities', label: 'Приоритеты', icon: '🎯' },
  { id: 'details', label: 'Подробно', icon: '📋' },
];

// Форматирование даты в "15 янв 2026"
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Определение направления отклонения (стрелка ↑↓)
const getArrow = (value, reference) => {
  if (!value || !reference) return null;
  
  const numValue = parseFloat(String(value).replace(',', '.'));
  if (isNaN(numValue)) return null;
  
  // Парсим референс "4.4-4.8" или "130-145"
  const refMatch = String(reference).match(/([\d.,]+)\s*[-–]\s*([\d.,]+)/);
  if (!refMatch) return null;
  
  const min = parseFloat(refMatch[1].replace(',', '.'));
  const max = parseFloat(refMatch[2].replace(',', '.'));
  
  if (isNaN(min) || isNaN(max)) return null;
  
  if (numValue > max) return { arrow: '↑', direction: 'up' };
  if (numValue < min) return { arrow: '↓', direction: 'down' };
  return null;
};

// Маппинг иконок для систем организма
const systemIconsMap = {
  'кроветворение': Droplets,
  'углеводный': Cookie,
  'эндокринная': Activity,
  'пищеварительная': Utensils,
  'нервная': Brain,
  'сердечно': Heart,
  'дыхательная': Wind,
  'опорно': Bone,
  'костная': Bone,
  'иммунная': Shield,
  'default': Sparkles
};

const getSystemIcon = (systemName) => {
  const name = (systemName || '').toLowerCase();
  for (const [key, Icon] of Object.entries(systemIconsMap)) {
    if (key !== 'default' && name.includes(key)) {
      return <Icon size={24} />;
    }
  }
  return <Sparkles size={24} />;
};

// Сортировка систем по критичности
const sortByPriority = (systems) => {
  const priorityOrder = {
    'критично': 1,
    'critical': 1,
    'внимание': 2,
    'warning': 2,
    'attention': 2,
    'в норме': 3,
    'normal': 3,
    'норма': 3,
    'good': 3,
    'ok': 3
  };
  
  return [...systems].sort((a, b) => {
    const statusA = (a.badge || a.status || '').toLowerCase();
    const statusB = (b.badge || b.status || '').toLowerCase();
    const priorityA = priorityOrder[statusA] || 99;
    const priorityB = priorityOrder[statusB] || 99;
    return priorityA - priorityB;
  });
};

export default function MyReportPage() {
  const navigate = useNavigate();
  // Состояния: 'loading' | 'ready' | 'no_data' | 'processing' | 'error'
  const [status, setStatus] = useState('loading');
  const [expandedFinding, setExpandedFinding] = useState(0);
  const [showGoodNews, setShowGoodNews] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [showAllIndicators, setShowAllIndicators] = useState(false);
  const [activeNav, setActiveNav] = useState('findings');
  const [showAnalysisListModal, setShowAnalysisListModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  
  // Профиль и история
  const [currentProfile, setCurrentProfile] = useState({ type: 'self', familyMemberId: null });
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [previousAnalysis, setPreviousAnalysis] = useState(null);
  
  // Семейные профили
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
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
  
  // Для загрузки файлов и генерации
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);

  // Загрузка данных
  useEffect(() => {
    loadAnalysisResult();
  }, [currentProfile]);
  
  // Загрузка семейных профилей
  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (userId) {
        const members = await familyService.getFamilyMembersWithAnalysis(userId);
        setFamilyMembers(members);
      }
    };
    if (userId) {
      loadFamilyMembers();
    }
  }, [userId, showAddFamilyModal]);

  // Автоматический polling при статусе processing
  useEffect(() => {
    let intervalId;
    if (status === 'processing') {
      intervalId = setInterval(() => {
        loadAnalysisResult();
      }, 5000); // Проверяем каждые 5 секунд
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

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
      
      setUserId(userId);
      
      // Получаем имя пользователя
      const storedName = localStorage.getItem('user_name');
      if (storedName) setUserName(storedName);

      // 2. Проверяем опросник в Supabase (с учётом профиля)
      let surveyQuery = supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', userId);
      
      // Фильтрация по профилю
      if (currentProfile.type === 'family' && currentProfile.familyMemberId) {
        surveyQuery = surveyQuery.eq('family_member_id', currentProfile.familyMemberId);
      } else {
        surveyQuery = surveyQuery.or('family_member_id.is.null,profile_type.eq.self');
      }
      
      const { data: surveyData } = await surveyQuery.limit(1);
      
      // Для своего профиля также проверяем localStorage
      if (currentProfile.type === 'self') {
        diag.hasSurvey = (surveyData && surveyData.length > 0) || localStorage.getItem('survey_completed') === 'true';
      } else {
        diag.hasSurvey = surveyData && surveyData.length > 0;
      }

      // 3. Проверяем загруженные файлы (с учётом профиля)
      let filesQuery = supabase
        .from('uploaded_files')
        .select('id')
        .eq('user_id', userId);
      
      if (currentProfile.type === 'family' && currentProfile.familyMemberId) {
        filesQuery = filesQuery.eq('family_member_id', currentProfile.familyMemberId);
      } else {
        filesQuery = filesQuery.or('family_member_id.is.null,profile_type.eq.self');
      }
      
      const { data: filesData } = await filesQuery.limit(1);
      
      diag.hasFiles = filesData && filesData.length > 0;

      // 4. Проверяем результат анализа (с учётом профиля)
      let analysisQuery = supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', userId);
      
      // Фильтрация по профилю
      if (currentProfile.type === 'family' && currentProfile.familyMemberId) {
        analysisQuery = analysisQuery.eq('family_member_id', currentProfile.familyMemberId);
      } else {
        // Для 'self' - записи без family_member_id
        analysisQuery = analysisQuery.or('family_member_id.is.null,profile_type.eq.self');
      }
      
      const { data: analysisData } = await analysisQuery
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
            setCurrentAnalysisId(analysisData.id);
            setDiagnostics(diag);
            setStatus('ready');
            localStorage.setItem('results_ready', 'true');
            
            // Load previous analysis for comparison
            try {
              const history = await supabase
                .from('analysis_results')
                .select('id, created_at, analysis_date, result_data')
                .eq('user_id', userId)
                .in('status', ['completed', 'ready'])
                .order('created_at', { ascending: false })
                .limit(2);
              
              if (history.data && history.data.length > 1) {
                setPreviousAnalysis(history.data[1]);
              }
            } catch (e) {
              console.error('Error loading previous analysis:', e);
            }
            
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
          date: new Date().toISOString()
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
          date: new Date().toISOString()
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

  // Обработчик сохранения файлов
  const handleSaveFiles = (files) => {
    setUploadedFilesCount(files.length);
    if (files.length > 0) {
      localStorage.setItem('upload_completed', 'true');
      // Перезагружаем данные
      loadAnalysisResult();
    }
  };

  // Генерация отчёта
  const handleSubmit = async () => {
    if (!userId || isGenerating) return;

    setIsGenerating(true);

    try {
      await generateReport(userId);
      localStorage.setItem('data_submitted', 'true');
      localStorage.setItem('results_ready', 'true');
      // Перезагружаем данные
      loadAnalysisResult();
    } catch (err) {
      console.error('Generate report error:', err);
      // Всё равно перезагружаем
      loadAnalysisResult();
    } finally {
      setIsGenerating(false);
    }
  };

  // Load previous analysis for comparison
  const loadPreviousAnalysis = async (currentId) => {
    if (!userId) return;
    try {
      const history = await getAnalysisHistory(userId, currentProfile.type, currentProfile.familyMemberId);
      // Find the analysis before the current one
      const currentIndex = history.findIndex(h => h.id === currentId);
      if (currentIndex >= 0 && currentIndex < history.length - 1) {
        setPreviousAnalysis(history[currentIndex + 1]);
      } else {
        setPreviousAnalysis(null);
      }
    } catch (err) {
      console.error('Error loading previous analysis:', err);
    }
  };

  // Handle selecting analysis from history
  const handleSelectAnalysis = async (analysisItem) => {
    try {
      const fullAnalysis = await getAnalysisById(analysisItem.id);
      if (fullAnalysis) {
        let transformedData = null;
        
        if (fullAnalysis.body_systems || fullAnalysis.main_findings) {
          transformedData = transformFromColumns(fullAnalysis);
        } else if (fullAnalysis.result_data) {
          transformedData = transformFromResultData(fullAnalysis.result_data);
        }
        
        if (transformedData) {
          setReportData(transformedData);
          setCurrentAnalysisId(fullAnalysis.id);
          loadPreviousAnalysis(fullAnalysis.id);
        }
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
    }
  };

  // Handle profile change
  const handleProfileChange = (newProfile) => {
    setCurrentProfile(newProfile);
    // Reload analysis for new profile
    loadAnalysisResult();
  };

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['findings', 'chain', 'priorities-section', 'details'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 200 && rect.bottom > 100) {
            // Map priorities-section back to priorities for nav highlighting
            setActiveNav(id === 'priorities-section' ? 'priorities' : id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    // Map priorities to priorities-section
    const targetId = id === 'priorities' ? 'priorities-section' : id;
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 70; // Высота sticky nav
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
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
            <span className="header-title">Моё здоровье</span>
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

  // Состояние "нет данных" — показываем карточки для заполнения
  if (status === 'no_data' || status === 'error') {
    const canSubmit = diagnostics.hasSurvey && diagnostics.hasFiles && !diagnostics.hasAnalysis;
    
    // Определяем текущий шаг
    const currentStep = !diagnostics.hasSurvey ? 1 : !diagnostics.hasFiles ? 2 : 3;
    const totalSteps = 3;
    
    // Текст следующего шага
    const nextStepText = !diagnostics.hasSurvey 
      ? 'Пройди опросник' 
      : !diagnostics.hasFiles 
        ? 'Загрузи анализы' 
        : 'Получи результаты';
    
    return (
      <div className="report-page">
        <header className="report-header-new setup-mode">
          <div className="header-top">
            <button className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={22} />
            </button>
            <span className="header-title">Мой разбор</span>
            <div style={{ width: 40 }} />
          </div>
        </header>
        
        <div className="report-setup-content">
          {/* Прогресс-трекер */}
          <div className="progress-tracker">
            <div className="progress-header">
              <h2>Твой прогресс</h2>
              <span className="progress-step-label">Шаг {currentStep} из {totalSteps}</span>
            </div>
            
            {/* Шаги прогресса */}
            <div className="progress-steps">
              <div className={`progress-step-item ${diagnostics.hasSurvey ? 'done' : currentStep === 1 ? 'active' : ''}`}>
                <div className="step-circle">
                  {diagnostics.hasSurvey ? <CheckCircle size={20} /> : <ClipboardList size={16} />}
                </div>
                <span className="step-label">Опросник</span>
              </div>
              
              <div className="progress-line" />
              
              <div className={`progress-step-item ${diagnostics.hasFiles ? 'done' : currentStep === 2 ? 'active' : ''}`}>
                <div className="step-circle">
                  {diagnostics.hasFiles ? <CheckCircle size={20} /> : <FileUp size={16} />}
                </div>
                <span className="step-label">Анализы</span>
              </div>
              
              <div className="progress-line" />
              
              <div className={`progress-step-item ${canSubmit || diagnostics.hasAnalysis ? 'active' : ''}`}>
                <div className="step-circle">
                  <CheckCircle size={16} />
                </div>
                <span className="step-label">Результат</span>
              </div>
            </div>
            
            {/* Кнопка следующего шага */}
            <button 
              className="next-step-btn"
              onClick={() => {
                if (!diagnostics.hasSurvey) navigate('/survey');
                else if (!diagnostics.hasFiles) setShowUploadModal(true);
                else if (canSubmit) handleSubmit();
              }}
            >
              Следующий шаг: {nextStepText}
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Карточки задач */}
          <div className="task-cards-grid">
            <button 
              className={`task-card ${diagnostics.hasSurvey ? 'done' : ''}`}
              onClick={() => navigate('/survey')}
            >
              <div className="task-card-icon">
                {diagnostics.hasSurvey ? <CheckCircle size={28} /> : <ClipboardList size={28} />}
              </div>
              <h3 className="task-card-title">Опросник</h3>
              <span className="task-card-status">
                {diagnostics.hasSurvey ? 'Готово ✓' : '~5 минут'}
              </span>
            </button>

            <button 
              className={`task-card ${diagnostics.hasFiles ? 'done' : ''}`}
              onClick={() => setShowUploadModal(true)}
            >
              <div className="task-card-icon">
                {diagnostics.hasFiles ? <CheckCircle size={28} /> : <FileUp size={28} />}
              </div>
              <h3 className="task-card-title">Анализы</h3>
              <span className="task-card-status">
                {diagnostics.hasFiles ? 'Загружено ✓' : 'Загрузить'}
              </span>
              {!diagnostics.hasFiles && <ArrowRight size={18} className="task-card-arrow" />}
            </button>
          </div>

          {/* Кнопка получения результатов */}
          {canSubmit && (
            <button 
              className="get-results-btn"
              onClick={handleSubmit}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={22} className="spinner" />
                  <span>Анализируем...</span>
                </>
              ) : (
                <>
                  <span>🎯</span>
                  <span>Получить результаты</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          )}

          {/* Подсказка */}
          {diagnostics.hasAnalysis && (
            <div className="processing-hint">
              <Loader2 size={18} className="spinner" />
              <span>Анализ обрабатывается...</span>
            </div>
          )}
        </div>

        {/* Кнопка ДЕМО */}
        <div className="demo-button-container">
          <button 
            className="demo-button"
            onClick={() => navigate('/health-screen')}
          >
            <Activity size={20} />
            <span>Посмотреть ДЕМО отчёт</span>
          </button>
        </div>
        
        <BottomNav />

        {/* Модалка загрузки */}
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSave={handleSaveFiles}
          userId={userId}
        />
        
        {/* Модалка добавления родственника */}
        {showAddFamilyModal && (
          <AddFamilyMemberModal
            userId={userId}
            onClose={() => setShowAddFamilyModal(false)}
            onAdded={async () => {
              setShowAddFamilyModal(false);
              // Перезагружаем список родственников
              const members = await familyService.getFamilyMembersWithAnalysis(userId);
              setFamilyMembers(members);
            }}
          />
        )}
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
            <span className="header-title">Моё здоровье</span>
            <div style={{ width: 40 }} />
          </div>
        </header>
        
        <div className="empty-state">
          <Loader2 size={64} className="spinner" />
          <h2>Анализ в процессе</h2>
          <p className="empty-message">
            AI изучает ваши анализы. Это займёт 1-2 минуты.
          </p>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px' }}>
            Страница обновится автоматически
          </p>
        </div>

        {/* Кнопка ДЕМО */}
        <div className="demo-button-container">
          <button 
            className="demo-button"
            onClick={() => navigate('/health-screen')}
          >
            <Activity size={20} />
            <span>Посмотреть ДЕМО отчёт</span>
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
            <span className="header-title">Моё здоровье</span>
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
        <div className="header-nav">
          <button className="nav-back" onClick={() => navigate('/')} aria-label="На главную">
            <ArrowLeft size={22} />
          </button>
          <h1>Анализ от {new Date(patientData.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}</h1>
          <button 
            className="nav-share" 
            title="Поделиться"
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: 'Моё здоровье — Health Club',
                    text: `Анализ здоровья для ${patientData.name}. Найдено: ${statsData.critical} критичных, ${statsData.warning} требуют внимания.`,
                    url: window.location.href
                  });
                } catch (err) {
                  console.log('Share cancelled');
                }
              } else {
                navigator.clipboard.writeText(window.location.href);
                const toast = document.createElement('div');
                toast.textContent = '✓ Ссылка скопирована';
                toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1E293B;color:white;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:500;z-index:9999;animation:fadeInUp 0.3s ease';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
              }
            }}
          >
            <Share2 size={20} />
          </button>
        </div>
        
        {/* Переключатель профилей */}
        <div className="profile-selector-wrapper">
          <button 
            className={`profile-selector-btn ${familyMembers.length > 0 ? 'has-dropdown' : ''}`}
            onClick={() => familyMembers.length > 0 && setShowProfileDropdown(!showProfileDropdown)}
          >
            <span className="profile-selector-name">
              {currentProfile.type === 'self' 
                ? patientData.name 
                : familyMembers.find(m => m.id === currentProfile.familyMemberId)?.name || patientData.name
              }
            </span>
            {familyMembers.length > 0 && (
              <ChevronDown 
                size={16} 
                className={`profile-selector-arrow ${showProfileDropdown ? 'open' : ''}`} 
              />
            )}
          </button>
          
          {/* Дропдаун с профилями */}
          {showProfileDropdown && familyMembers.length > 0 && (
            <div className="profile-dropdown">
              {/* Свой профиль */}
              <button 
                className={`profile-dropdown-item ${currentProfile.type === 'self' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentProfile({ type: 'self', familyMemberId: null });
                  setShowProfileDropdown(false);
                }}
              >
                <span className="dropdown-item-name">{patientData.name}</span>
                <span className="dropdown-item-label">Мой анализ</span>
                {currentProfile.type === 'self' && <Check size={16} className="dropdown-item-check" />}
              </button>
              
              {/* Родственники */}
              {familyMembers.map(member => (
                <button 
                  key={member.id}
                  className={`profile-dropdown-item ${currentProfile.familyMemberId === member.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProfile({ type: 'family', familyMemberId: member.id });
                    setShowProfileDropdown(false);
                  }}
                >
                  <span className="dropdown-item-name">{member.name}</span>
                  <span className="dropdown-item-label">
                    {getRelationLabel(member.relation)}
                    {member.hasAnalysis ? '' : ' • Нет анализа'}
                  </span>
                  {currentProfile.familyMemberId === member.id && <Check size={16} className="dropdown-item-check" />}
                </button>
              ))}
              
              {/* Добавить нового */}
              <button 
                className="profile-dropdown-item add-new"
                onClick={() => {
                  setShowProfileDropdown(false);
                  setShowAddFamilyModal(true);
                }}
              >
                <Plus size={16} />
                <span>Добавить родственника</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Кнопка добавления родственника */}
        <button 
          className="add-family-btn"
          onClick={() => setShowAddFamilyModal(true)}
        >
          <Plus size={16} />
          <span>Добавить родственника</span>
        </button>
      </header>

      {/* Модалка добавления родственника */}
      {showAddFamilyModal && (
        <AddFamilyMemberModal
          userId={userId}
          onClose={() => setShowAddFamilyModal(false)}
          onAdded={() => {
            setShowAddFamilyModal(false);
            loadAnalysisResult();
          }}
        />
      )}

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
        
        {/* === ИСТОРИЯ РАЗБОРОВ === */}
        <AnalysisHistory
          userId={userId}
          profileType={currentProfile.type}
          familyMemberId={currentProfile.familyMemberId}
          currentAnalysisId={currentAnalysisId}
          onSelectAnalysis={handleSelectAnalysis}
        />
        
        {/* === ЧТО ИЗМЕНИЛОСЬ === */}
        {previousAnalysis && (
          <ChangesOverview
            currentAnalysis={{ id: currentAnalysisId, result_data: reportData }}
            previousAnalysis={previousAnalysis}
          />
        )}
        
        {/* === КРАТКОЕ РЕЗЮМЕ === */}
        <div className="summary-card" id="main-finding">
          <h2>⚡ Главное</h2>
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
          <section className="priorities-card" id="priorities-section">
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
              {displayedIndicators.map((indicator, index) => {
                const arrowInfo = getArrow(indicator.value, indicator.ref || indicator.reference);
                return (
                  <div key={index} className={`indicator-compact ${indicator.status}`}>
                    <div className="indicator-compact-main">
                      <span className="indicator-compact-badge">
                        {indicator.status === 'critical' ? '🔴' : '⚠️'}
                      </span>
                      <span className="indicator-compact-name">{indicator.name}</span>
                      <span className="indicator-compact-value">
                        {arrowInfo && (
                          <span className={`deviation-arrow ${arrowInfo.direction}`}>
                            {arrowInfo.arrow}
                          </span>
                        )}
                        {indicator.value} {indicator.unit}
                      </span>
                    </div>
                    <span className="indicator-compact-ref">норма: {indicator.ref || indicator.reference}</span>
                  </div>
                );
              })}
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
              {sortByPriority(detailSections).map((section) => (
                <div key={section.id} className="detail-section">
                  <button 
                    className={`detail-header ${expandedSection === section.id ? 'expanded' : ''}`}
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  >
                    <span className="detail-icon-component">
                      {getSystemIcon(section.title)}
                    </span>
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

        {/* === ЗАГРУЗИТЬ НОВЫЕ АНАЛИЗЫ === */}
        {/* === ЧТО ДАЛЬШЕ? === */}
        <section className="next-steps-section">
          <h2>📋 Что дальше?</h2>

          {/* Кнопка 1: Список анализов */}
          <button className="action-card" onClick={() => setShowAnalysisListModal(true)}>
            <div className="action-icon">
              <ClipboardList size={24} />
            </div>
            <div className="action-content">
              <span className="action-title">Список анализов для сдачи</span>
              <span className="action-subtitle">
                {keyIndicators.filter(i => i.status === 'critical' || i.status === 'warning').length > 0 
                  ? `${keyIndicators.filter(i => i.status === 'critical' || i.status === 'warning').length} анализов рекомендуем пересдать`
                  : 'Посмотреть рекомендации'
                }
              </span>
            </div>
            <ChevronRight size={20} className="action-arrow" />
          </button>

          {/* Кнопка 2: Загрузить новые */}
          <button className="action-card" onClick={() => navigate('/report/update')}>
            <div className="action-icon upload">
              <Upload size={24} />
            </div>
            <div className="action-content">
              <span className="action-title">Загрузить новые анализы</span>
              <span className="action-subtitle">Обновить анализ и сравнить</span>
            </div>
            <ChevronRight size={20} className="action-arrow" />
          </button>
        </section>

        {/* === CTA === */}
        <section className="cta-section-new">
          <span className="cta-emoji">👨‍⚕️</span>
          <h3>Обсудите результаты со специалистом</h3>
          <p>Разберём анализы, составим план и ответим на вопросы</p>
          
          <button 
            className="cta-button-new"
            onClick={() => window.open('https://wa.me/77472370208?text=Хочу+записаться+на+консультацию+по+анализам', '_blank')}
          >
            <Phone size={20} />
            Записаться на консультацию
          </button>
          
          <button 
            className="cta-whatsapp-new"
            onClick={() => window.open('https://wa.me/77472370208', '_blank')}
          >
            <MessageCircle size={18} />
            Написать в WhatsApp
          </button>
        </section>

        {/* Disclaimer */}
        <div className="disclaimer-section">
          <p>
            Информация носит ознакомительный характер и не является медицинским диагнозом. 
            Перед началом лечения проконсультируйтесь с врачом.
          </p>
        </div>

      </main>

      {/* Analysis List Modal */}
      {showAnalysisListModal && (
        <div className="modal-overlay" onClick={() => setShowAnalysisListModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            
            <div className="modal-header">
              <h2>📝 Анализы для пересдачи</h2>
              <p>Рекомендуем сдать через 2-3 месяца</p>
            </div>

            <div className="modal-body">
              {keyIndicators.filter(i => i.status === 'critical' || i.status === 'warning').length > 0 ? (
                <ul className="analysis-list-modal">
                  {keyIndicators
                    .filter(i => i.status === 'critical' || i.status === 'warning')
                    .map((item, index) => (
                      <li key={index} className="analysis-item">
                        <div className={`status-dot ${item.status}`} />
                        <span className="analysis-name">{item.name}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">✨</span>
                  <p>Все показатели в норме!</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <a 
                href="https://www.olymp.kz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="lab-link"
              >
                🏥 Где сдать анализы →
              </a>
              
              <button className="close-btn" onClick={() => setShowAnalysisListModal(false)}>
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка ДЕМО */}
      <div className="demo-button-container">
        <button 
          className="demo-button"
          onClick={() => navigate('/health-screen')}
        >
          <Activity size={20} />
          <span>Посмотреть ДЕМО отчёт</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

