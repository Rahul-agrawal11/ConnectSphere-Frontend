import { useState, useRef, useCallback } from 'react';
import './ReactionBar.css';

export const REACTIONS = [
  { type: 'LIKE',  emoji: '👍', label: 'Like',  color: 'var(--react-like)'  },
  { type: 'LOVE',  emoji: '❤️', label: 'Love',  color: 'var(--react-love)'  },
  { type: 'HAHA',  emoji: '😂', label: 'Haha',  color: 'var(--react-haha)'  },
  { type: 'WOW',   emoji: '😮', label: 'Wow',   color: 'var(--react-wow)'   },
  { type: 'SAD',   emoji: '😢', label: 'Sad',   color: 'var(--react-sad)'   },
  { type: 'ANGRY', emoji: '😡', label: 'Angry', color: 'var(--react-angry)' },
];

/**
 * Facebook-style reaction bar.
 *
 * Desktop: hover the button → picker appears. Click a reaction to select.
 * Mobile:  long-press (300ms) the button → picker appears. Tap reaction.
 * Click main button when reaction = active → unreacts (toggles off).
 * Click main button when no reaction → quick LIKE.
 * Pick same reaction as current from picker → unreacts (toggles off).
 *
 * FIX: removed hover-gap flicker by using CSS transition-delay on the picker
 * instead of instant onMouseLeave. This is the same technique Facebook uses.
 */
const ReactionBar = ({
  targetId,
  targetType,
  summary = {},
  totalCount = 0,
  userReaction = null,
  onReact,
  onUnreact,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const closeTimer = useRef(null);  // delay before closing picker
  const longPress  = useRef(null);  // long-press timer for mobile

  const currentReaction = REACTIONS.find((r) => r.type === userReaction);

  // ── Open / Close ─────────────────────────────────────────────────────

  const openPicker = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setPickerOpen(true);
  }, []);

  /**
   * Delay closing by 200ms so the mouse can travel from the button
   * to the picker without flickering. The picker's own onMouseEnter
   * cancels the timer if the cursor enters it in time.
   */
  const scheduledClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setPickerOpen(false), 200);
  }, []);

  // ── Main Button handlers ──────────────────────────────────────────────

  const handleMainClick = () => {
    if (!onReact) return;
    if (pickerOpen) {
      // Picker is open — click on main button toggles it closed
      setPickerOpen(false);
      return;
    }
    // No picker open — quick action
    if (userReaction) {
      onUnreact?.();
    } else {
      onReact('LIKE');
    }
  };

  // ── Mobile long-press to open picker ─────────────────────────────────

  const handleTouchStart = () => {
    longPress.current = setTimeout(() => {
      openPicker();
    }, 300);
  };

  const handleTouchEnd = (e) => {
    if (longPress.current) {
      clearTimeout(longPress.current);
      longPress.current = null;
    }
  };

  // ── Picker item selection ─────────────────────────────────────────────

  const handleReactSelect = (type) => {
    setPickerOpen(false);
    if (userReaction === type) {
      // Same reaction → unreact (toggle off)
      onUnreact?.();
    } else {
      onReact?.(type);
    }
  };

  // ── Keyboard support on picker items ─────────────────────────────────

  const handlePickerKeyDown = (e, type) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleReactSelect(type);
    }
    if (e.key === 'Escape') {
      setPickerOpen(false);
    }
  };

  const handleWrapKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
    if (e.key === 'Escape') {
      setPickerOpen(false);
    }
  };

  // ── Top 3 emojis for summary bar ──────────────────────────────────────

  const topReactions = Object.entries(summary)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => REACTIONS.find((r) => r.type === type))
    .filter(Boolean);

  return (
    <div className="reaction-bar">
      {/* ── Reaction button + picker ──────────────────────────────────── */}
      <div
        className="reaction-btn-wrap"
        onMouseEnter={openPicker}
        onMouseLeave={scheduledClose}
        onKeyDown={handleWrapKeyDown}
      >
        <button
          className={`reaction-btn ${userReaction ? 'reaction-btn--active' : ''}`}
          onClick={handleMainClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={currentReaction ? { color: currentReaction.color } : {}}
          aria-label={
            currentReaction
              ? `${currentReaction.label} — click to remove or hold to change`
              : 'Like — hold or hover to choose reaction'
          }
          aria-pressed={!!userReaction}
        >
          <span className="reaction-btn__emoji" aria-hidden="true">
            {currentReaction ? currentReaction.emoji : '👍'}
          </span>
          <span className="reaction-btn__label">
            {currentReaction ? currentReaction.label : 'Like'}
          </span>
        </button>

        {/* Picker */}
        {pickerOpen && (
          <div
            className="reaction-picker animate-scale-in"
            role="toolbar"
            aria-label="Choose a reaction"
            onMouseEnter={openPicker}
            onMouseLeave={scheduledClose}
          >
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                className={`reaction-picker__item ${
                  userReaction === r.type ? 'reaction-picker__item--selected' : ''
                }`}
                onClick={() => handleReactSelect(r.type)}
                onKeyDown={(e) => handlePickerKeyDown(e, r.type)}
                title={r.label}
                aria-label={r.label}
                aria-pressed={userReaction === r.type}
              >
                <span role="img" aria-hidden="true">{r.emoji}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Reaction summary (emoji bar) ──────────────────────────────── */}
      {totalCount > 0 && (
        <div
          className="reaction-summary"
          title={`${totalCount} reaction${totalCount === 1 ? '' : 's'}`}
        >
          {topReactions.length > 0 && (
            <span className="reaction-summary__emojis" aria-hidden="true">
              {topReactions.map((r) => (
                <span key={r.type}>{r.emoji}</span>
              ))}
            </span>
          )}
          <span className="reaction-summary__count">{totalCount}</span>
        </div>
      )}
    </div>
  );
};

export default ReactionBar;