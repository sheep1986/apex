import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MatrixTransitionContextType {
  showMatrix: boolean;
  triggerTransition: () => void;
  isTransitioning: boolean;
}

const MatrixTransitionContext = createContext<MatrixTransitionContextType | undefined>(undefined);

export const useMatrixTransition = () => {
  const context = useContext(MatrixTransitionContext);
  if (!context) {
    throw new Error('useMatrixTransition must be used within a MatrixTransitionProvider');
  }
  return context;
};

interface MatrixTransitionProviderProps {
  children: ReactNode;
}

export const MatrixTransitionProvider: React.FC<MatrixTransitionProviderProps> = ({ children }) => {
  const [showMatrix, setShowMatrix] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const triggerTransition = () => {
    setIsTransitioning(true);
    setShowMatrix(true);
  };

  const handleTransitionComplete = () => {
    setShowMatrix(false);
    setIsTransitioning(false);
  };

  return (
    <MatrixTransitionContext.Provider value={{ showMatrix, triggerTransition, isTransitioning }}>
      {children}
    </MatrixTransitionContext.Provider>
  );
};
