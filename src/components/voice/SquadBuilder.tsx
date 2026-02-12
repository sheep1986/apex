
import React from 'react';

export const SquadBuilder: React.FC = () => {
  return (
    <div className="p-10 text-white bg-red-900 h-screen w-full flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Squad Builder Debug Mode</h1>
      <p className="mt-4 text-xl">If you see this, the Route is working.</p>
      <p className="text-sm opacity-70">The issue was likely ReactFlow configuration.</p>
    </div>
  );
};
