

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { Course } from '../types';
import { CourseHistorySkeleton } from '../components/skeletons/CourseHistorySkeleton';
import { Icons } from '../components/icons';

const EmptyState = () => {
    const { language, setPage } = useAppContext();
    const t = translations[language];
    return (
        <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed dark:border-gray-700">
            <Icons.BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">{t.account.noHistory}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gere o seu primeiro curso e comece a sua jornada de aprendizagem.</p>
            <div className="mt-6">
                <button
                    type="button"
                    onClick={() => setPage('generator')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#6C63FF] hover:bg-[#5850e0]"
                >
                    <Icons.Rocket className="-ml-1 mr-2 h-5 w-5" />
                    {t.account.noHistoryCTA}
                </button>
            </div>
        </div>
    );
}

export const AccountPage: React.FC = () => {
    const { language, currentUser, viewCourseFromHistory, getUserCourses, setPage, getQuizScore, refreshProfile, showToast } = useAppContext();
    const t = translations[language];

    const [courseHistory, setCourseHistory] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [quizScores, setQuizScores] = useState<{ [courseId: string]: { score: number, total: number } }>({});

    useEffect(() => {
        if (!currentUser) {
            setPage('landing');
            return;
        }
        const fetchCourses = async () => {
            setIsLoading(true);
            const courses = await getUserCourses();
            setCourseHistory(courses);
            
            const scores: { [courseId: string]: { score: number, total: number } } = {};
            for (const course of courses) {
                const score = await getQuizScore(course.id);
                if (score) {
                    scores[course.id] = score;
                }
            }
            setQuizScores(scores);
            setIsLoading(false);
        };
        fetchCourses();
    }, [currentUser, getUserCourses, setPage, getQuizScore]);

    const handleRefreshStatus = async () => {
        setIsRefreshing(true);
        await refreshProfile();
        setIsRefreshing(false);
        showToast(language === 'pt' ? 'Estado da conta atualizado!' : 'Account status refreshed!', 'success');
    };

    if (!currentUser) return null;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">{t.account.title}</h1>
                
                {/* UPSELL BANNER FOR NON-PREMIUM USERS */}
                {!currentUser.isPremium && (
                    <div className="mb-8 bg-gradient-to-r from-[#6C63FF] to-purple-800 rounded-xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-full">
                                <Icons.Stars className="w-8 h-8 text-yellow-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{t.account.activatePremiumTitle}</h3>
                                <p className="text-purple-100">{t.account.activatePremiumDesc}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setPage('plans')}
                            className="bg-white text-[#6C63FF] font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition-colors whitespace-nowrap"
                        >
                            {t.account.upgradeToPremium}
                        </button>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{t.account.welcome} {currentUser.name}</h2>
                        
                        <button 
                            onClick={handleRefreshStatus} 
                            disabled={isRefreshing}
                            className="text-sm flex items-center gap-2 text-[#6C63FF] hover:bg-purple-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-purple-100 dark:hover:border-gray-600"
                        >
                            <Icons.Rocket className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {language === 'pt' ? 'Atualizar Status' : 'Refresh Status'}
                        </button>
                    </div>

                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p><strong>{t.account.email}</strong> {currentUser.email}</p>
                        <div className="flex items-center gap-4">
                            <strong>{t.account.plan}</strong> 
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${currentUser.isPremium ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>{currentUser.isPremium ? t.account.premiumPlan : t.account.standardPlan}</span>
                        </div>
                    </div>
                    <div className="border-t dark:border-gray-700 mt-6 pt-6">
                         <button onClick={() => setPage('plans')} className="font-semibold text-[#6C63FF] hover:underline">
                            {t.account.manageSubscription}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{t.account.courseHistory}</h2>
                    {isLoading ? (
                        <CourseHistorySkeleton />
                    ) : courseHistory.length > 0 ? (
                        <ul className="space-y-4">
                            {courseHistory.map((course) => (
                                <li key={course.id} className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center flex-wrap gap-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">{course.title}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{course.estimatedDuration}</p>
                                        {quizScores[course.id] && (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{t.account.bestScore} {quizScores[course.id].score}/{quizScores[course.id].total}</p>
                                        )}
                                    </div>
                                    <button onClick={() => viewCourseFromHistory(course)} className="text-[#6C63FF] hover:underline text-sm font-medium">
                                      {t.account.viewCourse}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>
    );
};
