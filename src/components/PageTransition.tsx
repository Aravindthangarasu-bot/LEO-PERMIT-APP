import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayKey, setDisplayKey] = useState(location.key);
  const [stage, setStage] = useState('fadeIn');

  useEffect(() => {
    if (location.key === displayKey) return;
    setStage('fadeOut');
    const timer = window.setTimeout(() => {
      setDisplayKey(location.key);
      setStage('fadeIn');
    }, 160);
    return () => window.clearTimeout(timer);
  }, [location.key, displayKey]);

  return <div key={displayKey} className={`page-transition ${stage}`}>{children}</div>;
}
