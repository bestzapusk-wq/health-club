import { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { Check, Lock, Gift, Egg, Salad, Moon, Apple, Footprints, Video, Sparkles, Radio } from 'lucide-react';
import './DailyTasks.css';

const DAILY_TASKS = [
  {
    day: 1,
    title: 'Перезагрузка',
    tasks: [
      { 
        id: 'd1_t1', 
        icon: Egg, 
        text: 'Съешь завтрак в первый час после пробуждения',
        benefit: 'Запустит метаболизм'
      },
      { 
        id: 'd1_t2', 
        icon: Salad, 
        text: 'Добавь к обеду горсть зелени',
        benefit: 'Больше энергии'
      },
      { 
        id: 'd1_t3', 
        icon: Moon, 
        text: 'Не ешь за 3 часа до сна',
        benefit: 'Крепкий сон'
      },
    ]
  },
  {
    day: 2,
    title: 'Закрепление',
    tasks: [
      { 
        id: 'd2_t1', 
        icon: Apple, 
        text: 'Замени один перекус на белок + овощи',
        benefit: 'Сытость без тяжести'
      },
      { 
        id: 'd2_t2', 
        icon: Footprints, 
        text: 'Прогуляйся 15 мин после еды',
        benefit: 'Никакой сонливости'
      },
      { 
        id: 'd2_t3', 
        icon: Video, 
        text: 'Посмотри короткое видео о питании',
        benefit: 'Полезные знания'
      },
    ]
  },
];

// Stream task - always shown as a 4th task
const STREAM_TASK = {
  id: 'stream_task',
  icon: Radio,
  text: 'Зайти на эфир в 19:30',
  time: '19:30',
  isStream: true
};

export default function DailyTasks() {
  const [completedTasks, setCompletedTasks] = useState(() => {
    const saved = localStorage.getItem('completed_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentDay, setCurrentDay] = useState(() => {
    const saved = localStorage.getItem('current_day');
    return saved ? parseInt(saved) : 1;
  });

  useEffect(() => {
    localStorage.setItem('completed_tasks', JSON.stringify(completedTasks));
  }, [completedTasks]);

  useEffect(() => {
    localStorage.setItem('current_day', String(currentDay));
  }, [currentDay]);

  const isDayComplete = (day) => {
    const dayTasks = DAILY_TASKS.find(d => d.day === day)?.tasks || [];
    return dayTasks.every(task => completedTasks.includes(task.id));
  };

  const toggleTask = (taskId) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  useEffect(() => {
    if (isDayComplete(1) && currentDay === 1) {
      setTimeout(() => setCurrentDay(2), 800);
    }
  }, [completedTasks, currentDay]);

  const currentDayData = DAILY_TASKS.find(d => d.day === currentDay);
  const completedToday = currentDayData?.tasks.filter(t => completedTasks.includes(t.id)).length || 0;
  const totalToday = currentDayData?.tasks.length || 3;
  const allComplete = isDayComplete(1) && isDayComplete(2);
  const streamDone = completedTasks.includes(STREAM_TASK.id);

  return (
    <div className="daily-tasks">
      {/* Header */}
      <div className="daily-header">
        <div className="daily-title">
          <Sparkles size={20} className="daily-icon" />
          <h3>План на 2 дня</h3>
        </div>
        <div className="day-indicator">
          <span className={`day-dot ${currentDay >= 1 ? 'active' : ''} ${isDayComplete(1) ? 'done' : ''}`}>
            {isDayComplete(1) ? <Check size={12} /> : '1'}
          </span>
          <div className={`day-line ${isDayComplete(1) ? 'done' : ''}`} />
          <span className={`day-dot ${currentDay >= 2 ? 'active' : ''} ${isDayComplete(2) ? 'done' : ''}`}>
            {isDayComplete(2) ? <Check size={12} /> : '2'}
          </span>
        </div>
      </div>

      {!allComplete ? (
        <>
          {/* Current day card */}
          <div className="day-card">
            <div className="day-card-top">
              <div>
                <h4>День {currentDay}: {currentDayData?.title}</h4>
              </div>
              <div className="progress-badge">{completedToday}/{totalToday}</div>
            </div>

            <div className="progress-track">
              <div 
                className="progress-fill"
                style={{ width: `${(completedToday / totalToday) * 100}%` }}
              />
            </div>

            <div className="tasks-list">
              {currentDayData?.tasks.map((task, index) => {
                const done = completedTasks.includes(task.id);
                const Icon = task.icon;
                
                return (
                  <button
                    key={task.id}
                    className={`task-row ${done ? 'done' : ''}`}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className={`checkbox ${done ? 'checked' : ''}`}>
                      {done && <Check size={14} strokeWidth={3} />}
                    </div>
                    
                    <div className="task-content">
                      <div className="task-main">
                        <span className="task-num">{index + 1}.</span>
                        <span>{task.text}</span>
                      </div>
                      <div className="task-benefit">{task.benefit}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {isDayComplete(currentDay) && !allComplete && (
              <div className="day-done-msg">
                🎉 День {currentDay} выполнен!
              </div>
            )}
          </div>

          {/* Locked day 2 */}
          {currentDay === 1 && (
            <div className="locked-day">
              <Lock size={18} />
              <div>
                <strong>День 2</strong>
                <span>Выполни день 1</span>
              </div>
            </div>
          )}
        </>
      ) : (
        /* All complete */
        <div className="all-complete">
          <div className="confetti">🎉</div>
          <h3>Все задания выполнены!</h3>
          <p>Осталось только зайти на эфир</p>
        </div>
      )}

      {/* Stream task - always visible */}
      <div className="stream-task-card">
        <button
          className={`stream-task ${streamDone ? 'done' : ''}`}
          onClick={() => toggleTask(STREAM_TASK.id)}
        >
          <div className={`checkbox stream-checkbox ${streamDone ? 'checked' : ''}`}>
            {streamDone && <Check size={14} strokeWidth={3} />}
          </div>
          
          <div className="stream-content">
            <div className="stream-main">
              <Radio size={20} />
              <div>
                <span className="stream-text">Зайти на эфир</span>
                <span className="stream-time">Сегодня в 19:30</span>
              </div>
            </div>
          </div>

          <div className="stream-badge">
            <Gift size={14} />
            <span>+🎁</span>
          </div>
        </button>
        
        <p className="stream-hint">Получи персональный разбор на эфире!</p>
      </div>
    </div>
  );
}
