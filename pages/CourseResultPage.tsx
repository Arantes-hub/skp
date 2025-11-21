import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { generateModuleVideo, generateQuiz } from '../services/geminiService';
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

const CertificateModal = ({ course, user, onClose }: { course: Course, user: any, onClose: () => void }) => {
    const { language, showToast } = useAppContext();
    const t = translations[language].courseResult;
    const [customName, setCustomName] = useState(user.name);
    const [color, setColor] = useState('#6C63FF');

    const handleDownload = () => {
        generateCertificate({ name: user.name, courseTitle: course.title, customName, color });
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
    const { language, generatedCourse, currentUser, setPage, sharedCourse, toggleModuleCompletion, getCourseProgress, showToast, saveQuizScore } = useAppContext();
    const t = translations[language];

    const courseData = sharedCourse || generatedCourse;
    const isReadOnly = !!sharedCourse;

    const [course, setCourse] = useState<Course | null>(courseData);
    const [activeModuleIndex, setActiveModuleIndex] = useState(0);
    const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [showCertModal, setShowCertModal] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (courseData && currentUser) {
                const progress = await getCourseProgress(courseData.id);
                setCompletedModules(new Set(progress.completedModules));
            }
        };
        init();
        // @ts-ignore
        if (window.aistudio) window.aistudio.hasSelectedApiKey().then(setApiKeySelected);
        setCourse(courseData);
        setActiveModuleIndex(0);
        setQuiz(null);
    }, [courseData, currentUser]);

    if (!course) return <div className="text-center py-20 dark:text-white">Loading course...</div>;
    
    const activeModule = course.modules[activeModuleIndex];
    const allModulesCompleted = completedModules.size === course.modules.length;

    const handleToggleModule = async (moduleIndex: number) => {
        if (isReadOnly) return;
        await toggleModuleCompletion(course.id, moduleIndex);
        const newSet = new Set(completedModules);
        if (newSet.has(moduleIndex)) newSet.delete(moduleIndex); else newSet.add(moduleIndex);
        setCompletedModules(newSet);
    };

    const handleSelectApiKey = async () => { // @ts-ignore
        if (window.aistudio) { try { await window.aistudio.openSelectKey(); setApiKeySelected(true); } catch (err) { console.error("API key selection failed.", err); } }
    };

    const handleGenerateModuleVideo = async (moduleIndex: number) => {
        if (!course) return;
        const updateModuleState = (index: number, newState: Partial<Module>) => {
            setCourse(p => p && ({ ...p, modules: p.modules.map((m, i) => i === index ? { ...m, ...newState } : m) }));
        };
        updateModuleState(moduleIndex, { videoState: 'generating' });
        try { // @ts-ignore
            if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) { await window.aistudio.openSelectKey(); setApiKeySelected(true); }
            const videoUri = await generateModuleVideo(course.modules[moduleIndex]);
            const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
            const videoBlob = await response.blob();
            updateModuleState(moduleIndex, { videoState: 'success', videoUrl: URL.createObjectURL(videoBlob) });
        } catch(error: any) {
            updateModuleState(moduleIndex, { videoState: 'error' });
            showToast(t.courseResult.videoError, 'error');
        }
    }

    const handleGenerateQuiz = async () => {
        setIsGeneratingQuiz(true);
        try {
            const newQuiz = await generateQuiz(course, language);
            setQuiz(newQuiz);
        } catch (error) {
            showToast("Failed to generate quiz.", 'error');
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const handleQuizComplete = (score: number, total: number) => {
        saveQuizScore(course.id, score, total);
        setQuiz(null);
    }

    const handleShare = () => {
        const url = `${window.location.origin}${window.location.pathname}?share=${course.id}`;
        navigator.clipboard.writeText(url);
        showToast(t.courseResult.linkCopied);
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {isGeneratingQuiz && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><Spinner text={t.quiz.generating}/></div>}
            {quiz && <QuizView quiz={quiz} onClose={() => setQuiz(null)} onQuizComplete={handleQuizComplete} />}
            {showCertModal && currentUser && <CertificateModal course={course} user={currentUser} onClose={() => setShowCertModal(false)} />}

            {isReadOnly && (
                <div className="mb-8 text-center p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300">{t.courseResult.sharedViewTitle}</p>
                    {!currentUser && <button onClick={() => setPage('landing')} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">{t.courseResult.sharedViewLogin}</button>}
                </div>
            )}

            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white mb-2">{course.title}</h1>
                <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">{course.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-fit sticky top-24">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.courseResult.courseNavigation}</h2>
                        {!isReadOnly && <span className="text-sm font-medium text-gray-500">{completedModules.size} / {course.modules.length}</span>}
                    </div>
                    {!isReadOnly && <ProgressBar completed={completedModules.size} total={course.modules.length} />}
                    <ul className="space-y-2 mt-4">
                        {course.modules.map((m, i) => (
                            <li key={i}>
                                <button onClick={() => setActiveModuleIndex(i)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${i === activeModuleIndex ? 'bg-[#6C63FF] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${completedModules.has(i) ? 'opacity-70' : ''}`}>
                                    {!isReadOnly && <input type="checkbox" checked={completedModules.has(i)} onChange={() => handleToggleModule(i)} className="form-checkbox h-5 w-5 rounded text-[#6C63FF] focus:ring-0 cursor-pointer"/>}
                                    <span className={`font-medium ${completedModules.has(i) ? 'line-through' : ''}`}>{i + 1}. {m.title}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {!isReadOnly && allModulesCompleted && (
                        <div className="mt-6 text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <p className="font-semibold text-green-800 dark:text-green-300">{t.courseResult.allModulesCompleted}</p>
                             <button onClick={() => currentUser?.isPremium ? setShowCertModal(true) : generateCertificate({ name: currentUser?.name || 'User', courseTitle: course.title })} className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
                                <Icons.FileDown className="w-5 h-5"/>{t.courseResult.downloadCertificate}
                            </button>
                            {currentUser?.isPremium && <button onClick={handleGenerateQuiz} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all">{t.courseResult.generateQuiz}</button>}
                        </div>
                    )}
                </aside>

                <main className="md:col-span-3 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl sm:text-3xl font-bold text-[#6C63FF]">{activeModule.title}</h3>
                        <div className="flex items-center gap-2">
                             {!isReadOnly && <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Icons.Menu className="w-5 h-5"/></button>}
                             {currentUser?.isPremium && !isReadOnly && (
                                <div className="relative group">
                                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Icons.FileDown className="w-5 h-5"/></button>
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => exportToMarkdown(course)} className="w-full text-left px-4 py-2 text-sm">{t.courseResult.exportAsMarkdown}</button>
                                        <button onClick={() => exportToPlainText(course)} className="w-full text-left px-4 py-2 text-sm">{t.courseResult.exportAsText}</button>
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: activeModule.detailedContent }}></div>
                    {activeModule.exercise && (
                        <div className="mt-8 p-5 bg-purple-50 dark:bg-purple-900/50 border-l-4 border-purple-400 rounded-r-lg">
                            <p className="font-bold text-purple-800 dark:text-purple-300 text-xl">Practical Exercise</p>
                            <p className="mt-2">{activeModule.exercise}</p>
                            {activeModule.exerciseSolution && <details className="mt-4"><summary className="cursor-pointer font-semibold">View Solution</summary><div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg"><p>{activeModule.exerciseSolution}</p></div></details>}
                        </div>
                    )}
                    {!isReadOnly && currentUser && <NotesSection courseId={course.id} moduleId={activeModuleIndex} />}
                    {currentUser?.isPremium && !isReadOnly && (
                        <div className="mt-8 border-t dark:border-gray-600 pt-6">
                            <h4 className="text-xl font-bold mb-4">{t.courseResult.generateModuleVideo}</h4>
                            {activeModule.videoState === 'idle' && (!apiKeySelected ? <button onClick={handleSelectApiKey} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg">{t.courseResult.selectApiKeyButton}</button> : <button onClick={() => handleGenerateModuleVideo(activeModuleIndex)} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Icons.Video className="w-5 h-5" />{t.courseResult.generateModuleVideo.split('(')[0]}</button>)}
                            {activeModule.videoState === 'generating' && <div className="flex items-center gap-3"><Spinner text={t.courseResult.generatingVideo} /></div>}
                            {activeModule.videoState === 'error' && <p className="text-red-700">{t.courseResult.videoError}</p>}
                            {activeModule.videoState === 'success' && activeModule.videoUrl && <video src={activeModule.videoUrl} controls className="w-full rounded-lg aspect-video mt-4"></video>}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};