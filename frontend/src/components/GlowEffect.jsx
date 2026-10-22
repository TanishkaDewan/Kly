import React from 'react';

export default function GlowEffect() {
  return (
    <div 
      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 pointer-events-none z-0 w-full max-w-[1200px] h-[550px] overflow-visible flex items-center justify-center opacity-75 mix-blend-screen"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full animate-glow-drift overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="klyro-glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
          </linearGradient>
          <filter id="gaussian-blur-25" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
          </filter>
        </defs>
        
        {/* Large Horizontal Ellipse Glow */}
        <ellipse
          cx="500"
          cy="250"
          rx="420"
          ry="150"
          fill="url(#klyro-glow-gradient)"
          filter="url(#gaussian-blur-25)"
        />
        {/* Core hot-spot ellipse */}
        <ellipse
          cx="500"
          cy="250"
          rx="220"
          ry="70"
          fill="url(#klyro-glow-gradient)"
          opacity="0.4"
          filter="url(#gaussian-blur-25)"
        />
      </svg>
    </div>
  );
}
