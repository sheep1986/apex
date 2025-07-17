import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MatrixTransition } from './MatrixTransition';

interface MatrixRouteProps {
  children: React.ReactNode;
  enableTransition?: boolean;
}

export const MatrixRoute: React.FC<MatrixRouteProps> = ({ children, enableTransition = true }) => {
  const location = useLocation();
  const [showMatrix, setShowMatrix] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!enableTransition) {
      setShowContent(true);
      return;
    }

    // Always show matrix on first load of this route
    if (!isInitialized) {
      setShowMatrix(true);
      setIsInitialized(true);
    }
  }, [enableTransition, isInitialized]);

  const handleTransitionComplete = () => {
    setShowMatrix(false);
    setShowContent(true);
  };

  return (
    <>
      <MatrixTransition
        isVisible={showMatrix}
        onComplete={handleTransitionComplete}
        duration={6000}
      />
      {showContent && children}
    </>
  );
};
