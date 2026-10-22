import React from 'react';

export default function GridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block overflow-hidden" aria-hidden="true">
      {/* 25% Grid Line */}
      <div 
        className="absolute top-0 bottom-0 w-px bg-white/10" 
        style={{ left: '25%' }}
      />
      {/* 50% Grid Line */}
      <div 
        className="absolute top-0 bottom-0 w-px bg-white/10" 
        style={{ left: '50%' }}
      />
      {/* 75% Grid Line */}
      <div 
        className="absolute top-0 bottom-0 w-px bg-white/10" 
        style={{ left: '75%' }}
      />
    </div>
  );
}
