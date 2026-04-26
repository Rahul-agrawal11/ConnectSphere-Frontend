import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center
                    justify-center text-center px-4">
      <p className="text-8xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl
                   hover:bg-blue-700 transition font-medium"
      >
        Go Home
      </Link>
    </div>
  );
}