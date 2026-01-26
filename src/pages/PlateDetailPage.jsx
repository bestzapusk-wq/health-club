import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Volume2, 
  Clock, Award, User, Video
} from 'lucide-react';
import { bestPlatesData, mealTypeLabels } from '../data/bestPlates';
import './PlateDetailPage.css';

const PlateDetailPage = () => {
  const { plateId } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const plate = bestPlatesData.find(p => p.id === plateId);

  useEffect(() => {
    // Сбрасываем состояние при смене тарелки
    setIsPlaying(false);
    setAudioProgress(0);
  }, [plateId]);

  if (!plate) {
    return (
      <div className="plate-not-found">
        <p>Тарелка не найдена</p>
        <button onClick={() => navigate('/food')}>К питанию</button>
      </div>
    );
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="plate-detail-page">
      {/* Шапка */}
      <header className="plate-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="plate-header-info">
          <span className="meal-type">{mealTypeLabels[plate.mealType]}</span>
          <h1>{plate.dishName}</h1>
        </div>
      </header>

      {/* Фото тарелки */}
      <div className="plate-hero">
        <img 
          src={plate.imageUrl} 
          alt={plate.dishName}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#f0f0f0" width="400" height="300"/><text x="50%" y="50%" fill="#999" font-size="60" text-anchor="middle" dy=".3em">🍽️</text></svg>');
          }}
        />
        <div className="plate-owner-badge">
          <User size={14} />
          <span>{plate.ownerName}</span>
        </div>
      </div>

      {/* Голосовой разбор */}
      <section className="voice-analysis-section">
        <div className="section-header-inner">
          <Award size={20} className="section-icon" />
          <h2>Разбор от нутрициолога</h2>
        </div>

        {/* Аудио плеер */}
        <div className="voice-player">
          <button className="play-btn" onClick={togglePlay}>
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <div className="player-content">
            <div className="player-info">
              <span className="speaker-name">Вероника, нутрициолог</span>
              <span className="voice-duration">
                <Clock size={12} />
                {plate.voiceDuration}
              </span>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          </div>

          <Volume2 size={20} className="volume-icon" />
        </div>

        {/* Скрытый аудио элемент */}
        {plate.voiceMessageUrl && (
          <audio
            ref={audioRef}
            src={plate.voiceMessageUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
          />
        )}

        {/* Текстовая версия разбора */}
        <div className="analysis-text">
          {plate.analysisText.split('\n').map((paragraph, i) => (
            paragraph.trim() ? <p key={i}>{paragraph}</p> : null
          ))}
        </div>
      </section>

      {/* Рецепт */}
      <section className="recipe-section">
        <h2>Рецепт</h2>
        <p className="recipe-description">{plate.recipeDescription}</p>

        <h3>Ингредиенты</h3>
        <ul className="ingredients-list">
          {plate.ingredients.map((ing, i) => (
            <li key={i}>
              <span className="ingredient-name">{ing.name}</span>
              <span className="ingredient-amount">{ing.amount}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Видео-рецепт */}
      <section className="video-recipe-section">
        <div className="video-recipe-header">
          <Video size={20} className="video-icon" />
          <h2>Видео-рецепт</h2>
        </div>
        
        {plate.videoRecipeUrl ? (
          <div className="video-player-wrapper">
            <video 
              controls 
              poster={plate.imageUrl}
              className="video-player"
            >
              <source src={plate.videoRecipeUrl} type="video/mp4" />
              Ваш браузер не поддерживает видео
            </video>
          </div>
        ) : (
          <div className="video-placeholder">
            <div className="video-placeholder-icon">
              <Video size={32} />
            </div>
            <p className="video-placeholder-text">
              Видео-рецепт скоро появится
            </p>
            <span className="video-placeholder-hint">
              Участники клуба могут записать, как они готовят это блюдо
            </span>
          </div>
        )}
      </section>
    </div>
  );
};

export default PlateDetailPage;
