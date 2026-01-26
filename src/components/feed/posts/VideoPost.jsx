import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { formatDuration } from '../../../lib/feedService';
import './VideoPost.css';

// Проверка, является ли URL YouTube
function getYouTubeId(url) {
  if (!url) return null;
  
  // YouTube Shorts: youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) return shortsMatch[1];
  
  // Обычное YouTube видео: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];
  
  // Короткая ссылка: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  
  return null;
}

export default function VideoPost({ post }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const youtubeId = getYouTubeId(post.media_url);
  const isYouTube = !!youtubeId;

  // Автопауза при выходе из viewport (только для обычного видео)
  useEffect(() => {
    if (isYouTube) return;
    
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting && isPlaying) {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [isPlaying, isYouTube]);

  const togglePlay = () => {
    if (isYouTube) return; // YouTube управляется через iframe
    
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const percent = (video.currentTime / video.duration) * 100;
    setProgress(percent);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    }
  };

  // Рендер YouTube видео
  if (isYouTube) {
    return (
      <div className="video-post youtube-post">
        <div className="youtube-container">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title="YouTube video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        
        {/* Подпись */}
        {post.text && (
          <p className="video-caption">{post.text}</p>
        )}
      </div>
    );
  }

  // Рендер обычного видео
  return (
    <div className="video-post">
      {/* Видео контейнер */}
      <div 
        className="video-container"
        onClick={togglePlay}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isPlaying && setShowControls(true)}
      >
        {/* Превью если не играет */}
        {!isPlaying && post.thumbnail_url && (
          <div 
            className="video-thumbnail"
            style={{ backgroundImage: `url(${post.thumbnail_url})` }}
          />
        )}

        <video
          ref={videoRef}
          src={post.media_url}
          poster={post.thumbnail_url}
          muted={isMuted}
          playsInline
          loop
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Оверлей с контролами */}
        <div className={`video-overlay ${showControls || !isPlaying ? 'visible' : ''}`}>
          {/* Большая кнопка play */}
          {!isPlaying && (
            <button className="video-play-btn">
              <Play size={48} fill="white" />
            </button>
          )}

          {/* Нижние контролы */}
          <div className="video-controls">
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} fill="white" />}
            </button>

            {/* Прогресс бар */}
            <div className="video-progress" onClick={handleSeek}>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <span className="video-duration">
              {formatDuration(post.duration || 0)}
            </span>

            <button className="control-btn" onClick={toggleMute}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <button className="control-btn" onClick={toggleFullscreen}>
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Подпись */}
      {post.text && (
        <p className="video-caption">{post.text}</p>
      )}
    </div>
  );
}
