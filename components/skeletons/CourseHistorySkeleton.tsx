import React from 'react';

export const CourseHistorySkeleton: React.FC = () => {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center animate-pulse">
                    <div className="space-y-2">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
            ))}
        </div>
    );
};