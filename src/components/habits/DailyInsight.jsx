import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './DailyInsight.css';

export default function DailyInsight({ userId, currentData }) {
  const navigate = useNavigate();
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      analyzeData();
    }
  }, [userId, currentData]);

  const analyzeData = async () => {
    try {
      // Загружаем данные за последние 7 дней
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: reports, error } = await supabase
        .from('daily_reports')
        .select('report_date, water_ml, activity_minutes, sleep_hours')
        .eq('user_id', userId)
        .gte('report_date', weekAgo.toISOString().split('T')[0])
        .order('report_date', { ascending: false })
        .limit(7);

      if (error) {
        console.error('Error loading reports for insight:', error);
        setLoading(false);
        return;
      }

      // Анализируем данные
      const insightResult = generateInsight(reports || [], currentData);
      setInsight(insightResult);
    } catch (err) {
      console.error('Insight error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = (reports, today) => {
    // Добавляем сегодняшние данные в начало
    const allData = [
      { 
        report_date: new Date().toISOString().split('T')[0],
        water_ml: today.water,
        activity_minutes: today.activity,
        sleep_hours: today.sleep
      },
      ...reports.filter(r => r.report_date !== new Date().toISOString().split('T')[0])
    ];

    // Проверяем паттерны (минимум 3 дня подряд)
    
    // 1. СОН < 7 часов
    let lowSleepDays = 0;
    for (const report of allData) {
      if (report.sleep_hours && report.sleep_hours < 7) {
        lowSleepDays++;
      } else {
        break; // Прерываем серию
      }
    }
    
    if (lowSleepDays >= 3) {
      return {
        type: 'warning',
        emoji: '😴',
        text: `Вы спите меньше 7 часов уже ${lowSleepDays} дней подряд. Недосып влияет на энергию и аппетит.`,
        color: '#8B5CF6'
      };
    }

    // 2. ВОДА < 1500мл
    let lowWaterDays = 0;
    for (const report of allData) {
      if (report.water_ml && report.water_ml < 1500) {
        lowWaterDays++;
      } else {
        break;
      }
    }
    
    if (lowWaterDays >= 3) {
      return {
        type: 'warning',
        emoji: '💧',
        text: `Вы пьёте мало воды несколько дней. Это может вызывать усталость и головные боли.`,
        color: '#3B82F6'
      };
    }

    // 3. АКТИВНОСТЬ = 0
    let noActivityDays = 0;
    for (const report of allData) {
      if (!report.activity_minutes || report.activity_minutes === 0) {
        noActivityDays++;
      } else {
        break;
      }
    }
    
    if (noActivityDays >= 3) {
      return {
        type: 'warning',
        emoji: '🚶‍♀️',
        text: `Уже ${noActivityDays} дней без активности. Даже 15 минут прогулки улучшат самочувствие.`,
        color: '#F59E0B'
      };
    }

    // 4. Всё ок!
    return {
      type: 'success',
      emoji: '✨',
      text: 'Отличный день! Вы заботитесь о себе — так держать!',
      color: '#10B981'
    };
  };

  if (loading) {
    return (
      <div className="daily-insight loading">
        <Loader2 size={20} className="spin" />
        <span>Анализируем...</span>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div 
      className={`daily-insight ${insight.type}`}
      style={{ '--insight-color': insight.color }}
    >
      <div className="insight-content">
        <span className="insight-emoji">{insight.emoji}</span>
        <p className="insight-text">{insight.text}</p>
      </div>
      
      <button className="insight-action" onClick={() => navigate('/report')}>
        Посмотреть анализ
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
