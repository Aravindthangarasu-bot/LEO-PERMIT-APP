import React, { useEffect, useRef, useState } from 'react';

interface AnimateInProps {
  children: React.ReactNode;
  animationClass?: string;
  delayClass?: string;
  threshold?: number;
  className?: string;
}

export default function AnimateIn({ 
  children, 
  animationClass = 'slide-up', 
  delayClass = '',
  threshold = 0.1,
  className = ''
}: AnimateInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: threshold,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <div 
      ref={ref} 
      className={`animate-wrapper ${isVisible ? animationClass : ''} ${delayClass} ${className}`}
      style={{ opacity: isVisible ? undefined : 0 }}
    >
      {children}
    </div>
  );
}
