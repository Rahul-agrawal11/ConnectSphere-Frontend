import React from 'react';

export default function ErrorMessage({ message = 'Something went wrong.' }) {
  return (
    <div className="error-message">
      {message}
    </div>
  );
}
