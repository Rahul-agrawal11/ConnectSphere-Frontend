import React from 'react';

export default function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      {subtitle && (
        <p className="empty-state__subtitle">{subtitle}</p>
      )}
      {action}
    </div>
  );
}
