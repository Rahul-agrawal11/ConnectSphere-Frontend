import React from 'react';

export default function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-800 mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      )}
      {action}
    </div>
  );
}