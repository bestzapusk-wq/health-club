import './Card.css';

export default function Card({ 
  children, 
  className = '', 
  onClick,
  variant = 'default',
  padding = 'md'
}) {
  return (
    <div 
      className={`card card-${variant} card-p-${padding} ${onClick ? 'card-clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

