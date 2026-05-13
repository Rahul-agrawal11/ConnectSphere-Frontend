import './Avatar.css';

const COLORS = [
  '#4F6EF7','#0BC5A4','#FF6B6B','#FFD166',
  '#8B5CF6','#F97316','#06B6D4','#EC4899',
];

const getColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const Avatar = ({ src, username = '', size = 40, onClick, className = '' }) => {
  const initial   = (username[0] || '?').toUpperCase();
  const bgColor   = getColor(username);
  const hasImage  = !!src;

  return (
    <div
      className={`avatar ${className} ${onClick ? 'avatar--clickable' : ''}`}
      style={{ width: size, height: size, background: hasImage ? 'transparent' : bgColor }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={username}
    >
      {hasImage ? (
        <img
          src={src}
          alt={username}
          className="avatar__img"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <span className="avatar__initial" style={{ fontSize: size * 0.38 }}>
          {initial}
        </span>
      )}
    </div>
  );
};

export default Avatar;