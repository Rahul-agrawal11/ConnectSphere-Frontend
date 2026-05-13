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
      className="emoji-picker"
    >
      {Object.entries(EMOJI_MAP).map(([type, emoji]) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          title={type}
          className="emoji-picker__button"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
