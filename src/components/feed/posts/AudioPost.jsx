import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { formatDuration } from '../../../lib/feedService';
import './AudioPost.css';

export default function AudioPost({ post }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(post.duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newRate = speeds[nextIndex];
    
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Визуализация (упрощённая)
  const waveformBars = 40;
  const generateWaveform = () => {
    return Array.from({ length: waveformBars }, (_, i) => {
      const isPlayed = i < (progress / 100) * waveformBars;
      const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10;
      return { height, isPlayed };
    });
  };

  return (
    <div className="audio-post">
      <audio
        ref={audioRef}
        src={post.media_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Визуализация волны */}
      <div className="audio-waveform" onClick={handleSeek}>
        {generateWaveform().map((bar, i) => (
          <div
            key={i}
            className={`waveform-bar ${bar.isPlayed ? 'played' : ''}`}
            style={{ height: `${bar.height}%` }}
          />
        ))}
      </div>

      {/* Контролы */}
      <div className="audio-controls">
        <button className="audio-btn skip" onClick={() => skip(-15)}>
          <SkipBack size={18} />
        </button>

        <button className="audio-btn play" onClick={togglePlay}>
          {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
        </button>

        <button className="audio-btn skip" onClick={() => skip(15)}>
          <SkipForward size={18} />
        </button>

        <div className="audio-time">
          {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
        </div>

        <button className="audio-speed" onClick={cycleSpeed}>
          {playbackRate}x
        </button>
      </div>

      {/* Подпись */}
      {post.text && (
        <p className="audio-caption">{post.text}</p>
      )}
    </div>
  );
}
