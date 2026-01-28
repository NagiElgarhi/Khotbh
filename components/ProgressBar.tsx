
import React from 'react';

interface ProgressBarProps {
  progress: number;
  completedCount: number;
  totalCount: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, completedCount, totalCount }) => {
  return (
    <div className="w-full px-4 pt-2 pb-4">
      <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
        <span className="font-semibold">تقدمك</span>
        <span className="font-mono">{`${completedCount} / ${totalCount}`}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-teal-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};
