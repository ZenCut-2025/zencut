import React from 'react';

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '' }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="voxLogoGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#voxLogoGradient)" />
      <path
        d="M15 30L24 16L33 30"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 34L24 20L33 34"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.65"
      />
    </svg>
  );
};
