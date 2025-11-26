
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { generateQuiz } from '../services/geminiService';
import { generateCertificate } from '../services/certificateService';
import { exportToMarkdown, exportToPlainText } from '../services/exportService';
import { Icons } from '../components/icons';
import type { Course, Module, Quiz } from '../types';
import { QuizView } from '../components/QuizView';
import { Spinner } from '../components/Spinner';

const ProgressBar = ({ completed, total }: { completed: number; total: number }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-[#6C63FF] h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const CertificateModal = ({ course, user, onClose, score }: { course: Course, user: any, onClose: () => void, score?: string }) => {
    const { language, showToast } = useAppContext();
    const t = translations[language].courseResult;
    const [customName, setCustomName] = useState(user.name);
    const [color, setColor] = useState('#6C63FF');

    const handleDownload = () => {
        generateCertificate({ name: user.name, courseTitle: course.title, customName, color, score });
        showToast("Certificate downloaded!");
        onClose();
    }

    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">{t.customizeCertificate}</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="cert-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.certificateName}</label>
                        <input type="text" id="cert-name" value={customName} onChange={e => setCustomName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="cert-color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.certificateColor}</label>
                        <input type="color" id="cert-color" value={color} onChange={e => setColor(e.target.value)} className="mt-1 block w-full h-10"/>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                    <button onClick={handleDownload} className="py-2 px-4 rounded-lg bg-[#6C63FF] text-white hover:bg-[#5850e0]">Download</button>
                </div>
            </div>
         </div>
    );
};

const NotesSection: React.FC<{ courseId: string; moduleId: number }> = ({ courseId, moduleId }) => {
    const { language, getNote, saveNote, showToast } = useAppContext();
    const t = translations[language].courseResult;
    const [note, setNote] = useState("");
    const debounceTimeout = useRef<number | null>(null);

    useEffect(() => {
        getNote(courseId, moduleId).then(setNote);
    }, [courseId, moduleId, getNote]);

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNote = e.target.value;
        setNote(newNote);

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = window.setTimeout(() => {
            saveNote(courseId, moduleId, newNote);
            showToast(t.notesSaved);
        }, 1000); // Auto-save after 1 second of inactivity
    };

    return (
        <div className="mt-8">
            <h4 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">{t.personalNotes}</h4>
            <textarea
                value={note}
                onChange={handleNoteChange}
                placeholder={t.notesPlaceholder}
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#6C63FF] transition"
            />
        </div>
    );
};

export const CourseResultPage: React.FC = () => {
    const { language, generatedCourse, setGeneratedCourse, currentUser, setPage, sharedCourse, toggleModuleCompletion, getCourseProgress, showToast, saveQuizScore, getQuizScore, triggerModuleGeneration, addCourseToHistory } = useAppContext();
    const t = translations[language];

    const courseData = sharedCourse || generatedCourse;
    const isReadOnly = !!sharedCourse;

    const [activeModuleIndex, setActiveModuleIndex] = useState(0);
    const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [showCertModal, setShowCertModal] = useState(false);
    const [finalScore, setFinalScore] = useState<{score: number, total: number} | null>(null);

    // Initial Load & Lazy Loading Logic
    useEffect(() => {
        const init = async () => {
            if (courseData && currentUser) {
                const progress = await getCourseProgress(courseData.id);
                setCompletedModules(new Set(progress.completedModules));
                const savedScore = await getQuizScore(courseData.id);
                if (savedScore) setFinalScore(savedScore);
            }
        };
        init();
        
        // Lazy Load: Automatically trigger the first module if it's pending
        if (courseData && !isReadOnly && courseData.modules.length > 0) {
            const firstModule = courseData.modules[0];
            if (firstModule.status === 'pending') {
                triggerModuleGeneration(courseData, 0);
            }
        }

        // @ts-ignore
        if (window.aistudio) window.aistudio.hasSelectedApiKey().then(setApiKeySelected);
        
        setQuiz(null);
    }, [courseData?.id]); // Only run on ID change or mount

    // Handle Module Navigation and Lazy Generation
    const handleModuleChange = (index: number) => {
        setActiveModuleIndex(index);
        
        // If the user clicks a module that hasn't been generated yet, generate it now.
        if (courseData && !isReadOnly) {
            const targetModule = courseData.modules[index];
            if (targetModule.status === 'pending') {
                triggerModuleGeneration(courseData, index);
            }
        }
    };

    if (!courseData) return <div className="text-center py-20 dark:text-white">Loading course...</div>;
    
    // Ensure active module is safe
    const safeActiveIndex = Math.min(activeModuleIndex, courseData.modules.length - 1);
    const activeModule = courseData.modules[safeActiveIndex];
    const allModulesCompleted = completedModules.size === courseData.modules.length;

    const handleToggleModule = async (moduleIndex: number) => {
        if (isReadOnly) return;
        await toggleModuleCompletion(courseData.id, moduleIndex);
        const newSet = new Set(completedModules);
        if (newSet.has(moduleIndex)) {
            newSet.delete(moduleIndex);
        } else {
            newSet.add(moduleIndex);
            // If they finished a module, maybe pre-load the next one?
            if (moduleIndex + 1 < courseData.modules.length) {
                const nextModule = courseData.modules[moduleIndex + 1];
                if (nextModule.status === 'pending') {
                    triggerModuleGeneration(courseData, moduleIndex + 1);
                }
            }
        }
        setCompletedModules(newSet);
    };

    const handleGenerateQuiz = async () => {
        setIsGeneratingQuiz(true);
        try {
            const newQuiz = await generateQuiz(courseData, language);
            setQuiz(newQuiz);
        } catch (error) {
            showToast("Failed to generate quiz.", 'error');
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const handleFinishAndQuiz = async () => {
        // Mark current (last) module as done
        if (!completedModules.has(safeActiveIndex)) {
             await handleToggleModule(safeActiveIndex);
        }
        // Start quiz generation
        handleGenerateQuiz();
    };

    const handleQuizComplete = (score: number, total: number) => {
        saveQuizScore(courseData.id, score, total);
        setFinalScore({ score, total });
        setQuiz(null);
        showToast(`Quiz completed! You scored ${score}/${total}`, 'success');
        setShowCertModal(true); // Automatically offer certificate
    }

    const handleShare = () => {
        const url = `${window.location.origin}${window.location.pathname}?share=${courseData.id}`;
        navigator.clipboard.writeText(url);
        showToast(t.courseResult.linkCopied);
    };

    const getScorePercentage = () => {
        if (!finalScore || finalScore.total === 0) return undefined;
        // Convert score to a 0-20 scale
        const grade20 = Math.round((finalScore.score / finalScore.total) * 20);
        return `${grade20} / 20`;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {isGeneratingQuiz && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><Spinner text={t.quiz.generating}/></div>}
            {quiz && <QuizView quiz={quiz} onClose={() => setQuiz(null)} onQuizComplete={handleQuizComplete} />}
            {showCertModal && currentUser && <CertificateModal course={courseData} user={currentUser} onClose={() => setShowCertModal(false)} score={getScorePercentage()} />}

            {isReadOnly && (
                <div className="mb-8 text-center p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300">{t.courseResult.sharedViewTitle}</p>
                    {!currentUser && <button onClick={() => setPage('landing')} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">{t.courseResult.sharedViewLogin}</button>}
                </div>
            )}

            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white mb-2">{courseData.title}</h1>
                <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">{courseData.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-fit sticky top-24">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.courseResult.courseNavigation}</h2>
                        {!isReadOnly && <span className="text-sm font-medium text-gray-500">{completedModules.size} / {courseData.modules.length}</span>}
                    </div>
                    {!isReadOnly && <ProgressBar completed={completedModules.size} total={courseData.modules.length} />}
                    <ul className="space-y-2 mt-4">
                        {courseData.modules.map((m, i) => (
                            <li key={i}>
                                <button onClick={() => handleModuleChange(i)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${i === safeActiveIndex ? 'bg-[#6C63FF] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${completedModules.has(i) ? 'opacity-70' : ''}`}>
                                    {!isReadOnly && <input type="checkbox" checked={completedModules.has(i)} onChange={(e) => {e.stopPropagation(); handleToggleModule(i);}} className="form-checkbox h-5 w-5 rounded text-[#6C63FF] focus:ring-0 cursor-pointer"/>}
                                    <div className="flex flex-col items-start">
                                        <span className={`font-medium ${completedModules.has(i) ? 'line-through' : ''}`}>{i + 1}. {m.title}</span>
                                        {m.status === 'generating' && <span className="text-xs animate-pulse opacity-80">Generating...</span>}
                                        {m.status === 'pending' && <span className="text-xs opacity-60">Tap to load</span>}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {!isReadOnly && allModulesCompleted && (
                        <div className="mt-6 text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <p className="font-semibold text-green-800 dark:text-green-300">{t.courseResult.allModulesCompleted}</p>
                            
                            {finalScore && (
                                <p className="text-xl font-bold text-green-700 dark:text-green-400 my-2">{t.courseResult.finalGrade}: {getScorePercentage()}</p>
                            )}

                             <button onClick={() => currentUser?.isPremium ? setShowCertModal(true) : generateCertificate({ name: currentUser?.name || 'User', courseTitle: courseData.title })} className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
                                <Icons.FileDown className="w-5 h-5"/>{t.courseResult.downloadCertificate}
                            </button>
                            {/* Quiz button hidden here if already done or will be triggered by flow, but kept as backup */}
                            {!finalScore && currentUser?.isPremium && <button onClick={handleGenerateQuiz} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all">{t.courseResult.generateQuiz}</button>}
                        </div>
                    )}
                </aside>

                <main className="md:col-span-3 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg min-h-[500px]">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl sm:text-3xl font-bold text-[#6C63FF]">{activeModule.title}</h3>
                        <div className="flex items-center gap-2">
                             {!isReadOnly && <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Icons.Menu className="w-5 h-5"/></button>}
                             {currentUser?.isPremium && !isReadOnly && activeModule.status === 'completed' && (
                                <div className="relative group">
                                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Icons.FileDown className="w-5 h-5"/></button>
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                        <button onClick={() => exportToMarkdown(courseData)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg">{t.courseResult.exportAsMarkdown}</button>
                                        <button onClick={() => exportToPlainText(courseData)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg">{t.courseResult.exportAsText}</button>
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Content Rendering based on Status */}
                    {activeModule.status === 'pending' && (
                         <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Icons.Stars className="w-16 h-16 text-gray-300 mb-4" />
                            <h4 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Ready to learn?</h4>
                            <p className="text-gray-500 mb-6">This module is waiting for you.</p>
                            <button 
                                onClick={() => triggerModuleGeneration(courseData, safeActiveIndex)}
                                className="bg-[#6C63FF] text-white px-6 py-3 rounded-full font-bold hover:bg-[#5850e0] transition-colors"
                            >
                                Generate Module Content
                            </button>
                         </div>
                    )}

                    {activeModule.status === 'generating' && (
                        <div className="flex flex-col items-center justify-center py-20">
                             <Spinner text={`Writing content for "${activeModule.title}"...`} />
                             <p className="text-sm text-gray-400 mt-4 animate-pulse">Consulting the AI knowledge base...</p>
                        </div>
                    )}

                    {activeModule.status === 'error' && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
                            <Icons.X className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <p className="text-red-700 dark:text-red-300 font-semibold">Something went wrong generating this module.</p>
                            <button 
                                onClick={() => triggerModuleGeneration(courseData, safeActiveIndex)}
                                className="mt-4 text-red-600 hover:text-red-800 font-medium underline"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {(activeModule.status === 'completed' || !activeModule.status) && (
                        <div className="animate-fade-in">
                            
                            <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: activeModule.detailedContent }}></div>
                            
                            {activeModule.exercise && (
                                <div className="mt-8 p-5 bg-purple-50 dark:bg-purple-900/50 border-l-4 border-purple-400 rounded-r-lg">
                                    <p className="font-bold text-purple-800 dark:text-purple-300 text-xl">Practical Exercise</p>
                                    <p className="mt-2">{activeModule.exercise}</p>
                                    {activeModule.exerciseSolution && <details className="mt-4"><summary className="cursor-pointer font-semibold">View Solution</summary><div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg"><p>{activeModule.exerciseSolution}</p></div></details>}
                                </div>
                            )}

                            {!isReadOnly && currentUser && <NotesSection courseId={courseData.id} moduleId={safeActiveIndex} />}
                            
                            {/* Next Module / Finish Navigation */}
                            <div className="mt-12 flex justify-between">
                                <button 
                                    onClick={() => handleModuleChange(Math.max(0, safeActiveIndex - 1))}
                                    disabled={safeActiveIndex === 0}
                                    className="px-4 py-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {safeActiveIndex < courseData.modules.length - 1 ? (
                                    <button 
                                        onClick={() => {
                                            handleToggleModule(safeActiveIndex); // Mark current as done
                                            handleModuleChange(safeActiveIndex + 1); // Go to next
                                        }}
                                        className="px-6 py-2 rounded-lg bg-[#6C63FF] text-white hover:bg-[#5850e0]"
                                    >
                                        Mark Done & Next
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleFinishAndQuiz}
                                        className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-lg font-bold flex items-center gap-2"
                                    >
                                        <Icons.CheckCircle className="w-5 h-5"/>
                                        {t.courseResult.finishAndQuiz}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
