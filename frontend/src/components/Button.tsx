import React from 'react';

export const Button = ({ onClick, children, className = "" }: { onClick: () => void, children: React.ReactNode, className?: string }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition ${className}`}>
    {children}
  </button>
);