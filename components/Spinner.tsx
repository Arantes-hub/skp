
import React from 'react';

interface SpinnerProps {
    text: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#6C63FF]"></div>
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{text}</p>
    </div>
  );
};