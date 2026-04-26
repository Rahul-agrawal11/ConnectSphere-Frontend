import React, { useRef, useEffect } from 'react';
import { EMOJI_MAP } from './PostCard';

export default function EmojiBar({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200
                 rounded-2xl shadow-lg p-2 flex gap-1 z-20"
    >
      {Object.entries(EMOJI_MAP).map(([type, emoji]) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          title={type}
          className="reaction-btn text-2xl p-1 rounded-xl hover:bg-gray-100"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}