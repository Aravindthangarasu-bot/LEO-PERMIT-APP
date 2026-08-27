import { useEffect, useRef, useState, type ReactNode } from 'react';

interface AnimateInProps {
  children: ReactNode;
  animationClass?: string;
  delayClass?: string;
  threshold?: number;
  className?: string;
}

export default function AnimateIn({ children, animationClass = 'slide-up', delayClass = '', threshold = 0.1, className = '' }: AnimateInProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return <div ref={ref} className={`animate-wrapper ${visible ? animationClass : ''} ${delayClass} ${className}`} style={{ opacity: visible ? undefined : 0 }}>{children}</div>;
}
