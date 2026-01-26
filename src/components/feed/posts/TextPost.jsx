import { useState } from 'react';
import './TextPost.css';

const MAX_LENGTH = 280;

export default function TextPost({ post }) {
  const [expanded, setExpanded] = useState(false);
  const text = post.text || '';
  const isLong = text.length > MAX_LENGTH;

  const displayText = expanded || !isLong 
    ? text 
    : text.slice(0, MAX_LENGTH) + '...';

  return (
    <div className="text-post">
      <p className="text-post-content">
        {displayText.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < displayText.split('\n').length - 1 && <br />}
          </span>
        ))}
      </p>
      
      {isLong && (
        <button 
          className="text-post-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Свернуть' : 'Читать дальше'}
        </button>
      )}
    </div>
  );
}
