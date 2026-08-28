import React from 'react';

interface AnimateInProps {
  children: React.ReactNode;
  animationClass?: string;
  delayClass?: string;
  threshold?: number;
  className?: string;
}

export default function AnimateIn({ 
  children, 
  className = ''
}: AnimateInProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
