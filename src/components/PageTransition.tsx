import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 200); // 200ms for exit animation
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`page-transition ${transitionStage}`}
      style={{
        animation: transitionStage === 'fadeIn' ? 'pageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'pageOut 0.2s ease forwards'
      }}
    >
      {/* We render the previous location while transitioning out */}
      <React.Fragment key={displayLocation.key}>
        {children}
      </React.Fragment>
    </div>
  );
}
