import { useState } from 'react';
import { X } from 'lucide-react';
import './ImagePost.css';

export default function ImagePost({ post }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="image-post">
      {/* Картинка */}
      <div 
        className={`image-post-container ${imageLoaded ? 'loaded' : ''}`}
        onClick={() => setLightboxOpen(true)}
      >
        {!imageLoaded && <div className="image-placeholder" />}
        <img 
          src={post.media_url} 
          alt=""
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Подпись */}
      {post.text && (
        <p className="image-post-caption">
          {post.text.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < post.text.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="image-lightbox" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close">
            <X size={24} />
          </button>
          <img src={post.media_url} alt="" />
        </div>
      )}
    </div>
  );
}
