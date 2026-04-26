import React from 'react';

const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
];

function getColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % COLORS.length;
  return COLORS[idx];
}

export default function Avatar({
  src, name = '', size = 10, className = ''
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';

  const color = getColor(name);
  const sizeClass = `w-${size} h-${size}`;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center
                  text-sm font-medium flex-shrink-0 ${color} ${className}`}
    >
      {initials}
    </div>
  );
}