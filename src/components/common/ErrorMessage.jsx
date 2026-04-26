import React from 'react';

export default function ErrorMessage({ message = 'Something went wrong.' }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
      {message}
    </div>
  );
}