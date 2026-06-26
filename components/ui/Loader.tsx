import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#263248] rounded-full animate-spin border-t-[#00a859]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#263248] rounded-full animate-spin border-b-[#9fef00]" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
      </div>
      <p className="mt-6 text-sm text-[#6e7a94] animate-pulse">Loading...</p>
    </div>
  );
};

export default Loader;
