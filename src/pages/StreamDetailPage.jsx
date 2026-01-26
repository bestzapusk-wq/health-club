import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, FileText, BookOpen, Download, 
  ExternalLink, Clock, Calendar, User, CheckCircle 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { streams, sportContent } from '../data/materials';
import './StreamDetailPage.css';

const StreamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(null);
  
  // Ищем в обоих массивах
  const stream = [...streams, ...sportContent].find(s => s.id === id);
  
  if (!stream) {
    return (
      <div className="stream-not-found">
        <p>Материал не найден</p>
        <button onClick={() => navigate('/materials')}>Вернуться к материалам</button>
      </div>
    );
  }

  const handleDownload = async (file) => {
    if (file.type === 'external') {
      window.open(file.externalUrl, '_blank');
      return;
    }

    setDownloading(file.id);
    try {
      const { data, error } = await supabase.storage
        .from('materials')
        .download(file.storagePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.displayName + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      alert('Не удалось скачать файл. Попробуйте позже.');
    } finally {
      setDownloading(null);
    }
  };

  const getFileIcon = (iconName) => {
    const icons = { FileText, BookOpen, Download };
    return icons[iconName] || FileText;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="stream-detail-page">
      {/* Шапка */}
      <header className="stream-detail-header">
        <button className="stream-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>{stream.title}</h1>
      </header>

      {/* Видео или заглушка */}
      <div className="stream-video-container">
        {stream.youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${stream.youtubeId}`}
            title={stream.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="stream-video-placeholder">
            <Play size={48} />
            <p>Запись скоро будет доступна</p>
          </div>
        )}
      </div>

      {/* Мета-информация */}
      <div className="stream-meta">
        <div className="stream-meta-item">
          <Calendar size={16} />
          <span>{formatDate(stream.date)}</span>
        </div>
        <div className="stream-meta-item">
          <Clock size={16} />
          <span>{stream.duration}</span>
        </div>
        {stream.speaker && (
          <div className="stream-meta-item">
            <User size={16} />
            <span>{stream.speaker}</span>
          </div>
        )}
        {stream.trainer && (
          <div className="stream-meta-item">
            <User size={16} />
            <span>Тренер: {stream.trainer}</span>
          </div>
        )}
      </div>

      {/* Требования для тренировки (если есть) */}
      {stream.requirements && stream.requirements.length > 0 && (
        <section className="stream-requirements-section">
          <h2>Что понадобится</h2>
          <ul className="stream-requirements-list">
            {stream.requirements.map((req, i) => (
              <li key={i}>
                <CheckCircle size={18} />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Почему стоит посмотреть */}
      <section className="stream-why-watch-section">
        <h2>О чём этот эфир</h2>
        <div className="stream-why-watch-text">
          {stream.whyWatch.split('\n').map((paragraph, i) => (
            paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
          ))}
        </div>
      </section>

      {/* Материалы к эфиру */}
      {stream.files && stream.files.length > 0 && (
        <section className="stream-files-section">
          <h2>Материалы к эфиру</h2>
          <p className="stream-files-disclaimer">
            Материалы собраны для изучения и расширения понимания темы. 
            Мы берём лучшее из разных источников и оставляем только то, что реально работает.
          </p>
          
          <div className="stream-files-list">
            {stream.files.map(file => {
              const IconComponent = getFileIcon(file.icon);
              const isExternal = file.type === 'external';
              
              return (
                <button
                  key={file.id}
                  className="stream-file-card"
                  onClick={() => handleDownload(file)}
                  disabled={downloading === file.id}
                >
                  <div className="stream-file-icon">
                    <IconComponent size={24} />
                  </div>
                  <div className="stream-file-info">
                    <span className="stream-file-name">{file.displayName}</span>
                    {file.description && (
                      <span className="stream-file-description">{file.description}</span>
                    )}
                  </div>
                  <div className="stream-file-action">
                    {downloading === file.id ? (
                      <div className="stream-loading-spinner" />
                    ) : isExternal ? (
                      <ExternalLink size={20} />
                    ) : (
                      <Download size={20} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default StreamDetailPage;
