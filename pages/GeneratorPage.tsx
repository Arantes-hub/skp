
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { generateCourse, suggestIdeas } from '../services/geminiService';
import type { GeneratorForm } from '../types';
import { Spinner } from '../components/Spinner';
import { Icons } from '../components/icons';
import { redirectToCheckout } from '../services/stripeService';

const TOTAL_STEPS = 5;

const ProgressIndicator = ({ currentStep }: { currentStep: number }) => {
    const progressPercentage = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
            <div
                className="bg-[#6C63FF] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
            ></div>
        </div>
    );
};

const PaywallModal = ({ onClose }: { onClose: () => void }) => {
    const { language, currentUser } = useAppContext();
    const t = translations[language].paywall;
    const [isLoading, setIsLoading] = useState<'one_time' | 'subscription' | null>(null);

    const handlePayment = async (type: 'one_time' | 'subscription') => {
        if (!currentUser) return;
        setIsLoading(type);
        try {
            await redirectToCheckout(currentUser.uid, type);
        } catch (error) {
            console.error(error);
            setIsLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 z-10">
                    <Icons.X className="w-6 h-6 text-gray-500" />
                </button>
                
                <div className="text-center mb-8 relative z-10">
                    <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <Icons.Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">{t.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
                    {/* Option 1: Pay per course */}
                    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-[#6C63FF] transition-colors bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.option1Title}</h3>
                        <div className="text-3xl font-extrabold text-[#6C63FF] my-2">{t.option1Price}</div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.option1Desc}</p>
                        <button 
                            onClick={() => handlePayment('one_time')}
                            disabled={!!isLoading}
                            className="w-full py-3 rounded-lg font-bold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                            {isLoading === 'one_time' ? '...' : t.option1Btn}
                        </button>
                    </div>

                    {/* Option 2: Subscription */}
                    <div className="border-2 border-[#6C63FF] rounded-xl p-6 bg-purple-50 dark:bg-purple-900/20 shadow-lg transform scale-105">
                        <div className="absolute top-0 right-0 bg-[#6C63FF] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">BEST VALUE</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.option2Title}</h3>
                        <div className="text-3xl font-extrabold text-[#6C63FF] my-2">{t.option2Price}</div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.option2Desc}</p>
                        <button 
                             onClick={() => handlePayment('subscription')}
                             disabled={!!isLoading}
                            className="w-full py-3 rounded-lg font-bold bg-[#6C63FF] text-white hover:bg-[#5850e0] transition-colors shadow-md"
                        >
                             {isLoading === 'subscription' ? '...' : t.option2Btn}
                        </button>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Icons.CheckCircle className="w-3 h-3" /> {t.footer}
                </p>
            </div>
        </div>
    );
};

export const GeneratorPage: React.FC = () => {
    const { language, setPage, setGeneratedCourse, setTranslatedCourse, currentUser, setShowAuthModal, addCourseToHistory, getUserCourseCount, showToast } = useAppContext();
    const t = translations[language];

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<GeneratorForm>({
        topic: '',
        level: 'beginner',
        duration: '30 minutes',
        includeExercises: true,
        generateInEnglish: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            setShowAuthModal(true);
            setPage('landing');
        }
    }, [currentUser, setPage, setShowAuthModal]);

    // Detect payment success from URL (Redirection from Stripe)
    useEffect(() => {
        const url = window.location.href;
        if (url.includes('payment_success=true')) {
            setPaymentSuccess(true);
            setShowPaywall(false);
            const successMsg = language === 'pt' 
                ? 'Pagamento recebido! Pode gerar o seu curso agora.' 
                : 'Payment received! You can now generate your course.';
            showToast(successMsg, 'success');
        }
    }, [language, showToast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };
    
    const onProgress = (message: string) => {
        setLoadingMessage(message);
    };

    const handleSuggestIdeas = async () => {
        setIsSuggesting(true);
        setError(null);
        try {
            const ideas = await suggestIdeas(language);
            if (ideas && ideas.length > 0) {
                setFormData(prev => ({...prev, topic: ideas[Math.floor(Math.random() * ideas.length)]}))
            }
        } catch (err) {
            console.error(err);
            setError(t.generator.suggestionError);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            setShowAuthModal(true);
            return;
        }

        // --- PAYWALL CHECK ---
        // Skip check if user is premium OR if they just came back from a successful payment
        if (!currentUser.isPremium && !paymentSuccess) {
            try {
                const count = await getUserCourseCount();
                if (count >= 1) {
                    setShowPaywall(true);
                    return;
                }
            } catch (err) {
                console.error("Error checking course limit", err);
            }
        }
        // ---------------------

        setIsLoading(true);
        setLoadingMessage(t.generator.loading);
        setError(null);
        setGeneratedCourse(null);
        setTranslatedCourse(null);

        try {
            const course = await generateCourse(formData, language, onProgress, currentUser.uid);
            setGeneratedCourse(course);
            addCourseToHistory(course);

            if (formData.generateInEnglish) {
                const translated = await generateCourse(formData, 'en', onProgress, currentUser.uid);
                setTranslatedCourse(translated);
            }
            setPage('courseResult');
        } catch (err: any) {
            console.error(err);
            // Show the actual error message to help debugging
            const errorMessage = err?.message || err?.toString() || t.generator.generationError;
            setError(`${t.generator.generationError} (${errorMessage})`);
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));


    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Spinner text={loadingMessage || t.generator.loading} /></div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
            
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
                <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">{t.generator.title}</h1>
                <ProgressIndicator currentStep={step} />

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900/50 dark:text-red-300 p-4 mb-6 rounded-md" role="alert"><p>{error}</p></div>}
                
                <form onSubmit={handleSubmit} className="space-y-6 overflow-x-hidden">
                    <div className="relative">
                        {/* Step 1: Topic */}
                        <div className={`transition-all duration-300 ${step !== 1 ? 'opacity-0 -translate-x-full absolute' : 'opacity-100 translate-x-0'}`}>
                             <label htmlFor="topic" className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{t.generator.step1}</label>
                            <div className="relative">
                                <textarea id="topic" name="topic" value={formData.topic} onChange={handleInputChange} placeholder={t.generator.step1Placeholder} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows={3}/>
                                <button type="button" onClick={handleSuggestIdeas} disabled={isSuggesting} className="absolute bottom-3 right-3 flex items-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900 text-xs font-semibold py-1 px-3 rounded-full transition-colors disabled:opacity-50">
                                    <Icons.Stars className="w-4 h-4" />
                                    {isSuggesting ? '...' : t.generator.suggestIdeas}
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Level */}
                        <div className={`transition-all duration-300 ${step !== 2 ? 'opacity-0 -translate-x-full absolute' : 'opacity-100 translate-x-0'}`}>
                           <label htmlFor="level" className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{t.generator.step2}</label>
                            <select id="level" name="level" value={formData.level} onChange={handleInputChange} className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-shadow">
                                <option value="beginner">{t.generator.levels.beginner}</option>
                                <option value="intermediate">{t.generator.levels.intermediate}</option>
                                <option value="advanced">{t.generator.levels.advanced}</option>
                            </select>
                        </div>

                        {/* Step 3: Duration */}
                         <div className={`transition-all duration-300 ${step !== 3 ? 'opacity-0 -translate-x-full absolute' : 'opacity-100 translate-x-0'}`}>
                            <label htmlFor="duration" className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{t.generator.step3}</label>
                            <input type="text" id="duration" name="duration" value={formData.duration} onChange={handleInputChange} placeholder={t.generator.step3Placeholder} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>

                        {/* Step 4: Exercises */}
                        <div className={`transition-all duration-300 ${step !== 4 ? 'opacity-0 -translate-x-full absolute' : 'opacity-100 translate-x-0'}`}>
                             <div className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">{t.generator.step4}</div>
                             <div className="flex gap-4">
                                <label className="flex-1 flex items-center gap-2 cursor-pointer p-3 border dark:border-gray-600 rounded-lg has-[:checked]:bg-purple-50 has-[:checked]:border-purple-400 dark:has-[:checked]:bg-purple-900/50 dark:has-[:checked]:border-purple-500">
                                    <input type="radio" name="includeExercises" checked={formData.includeExercises === true} onChange={() => setFormData(p => ({ ...p, includeExercises: true }))} className="form-radio text-[#6C63FF] bg-gray-100 dark:bg-gray-700"/>
                                    <span className="text-gray-800 dark:text-gray-200">{t.generator.options.yes}</span>
                                </label>
                                <label className="flex-1 flex items-center gap-2 cursor-pointer p-3 border dark:border-gray-600 rounded-lg has-[:checked]:bg-purple-50 has-[:checked]:border-purple-400 dark:has-[:checked]:bg-purple-900/50 dark:has-[:checked]:border-purple-500">
                                    <input type="radio" name="includeExercises" checked={formData.includeExercises === false} onChange={() => setFormData(p => ({ ...p, includeExercises: false }))} className="form-radio text-[#6C63FF] bg-gray-100 dark:bg-gray-700"/>
                                     <span className="text-gray-800 dark:text-gray-200">{t.generator.options.no}</span>
                                </label>
                            </div>
                        </div>

                        {/* Step 5: Translation */}
                         <div className={`transition-all duration-300 ${step !== 5 ? 'opacity-0 -translate-x-full absolute' : 'opacity-100 translate-x-0'}`}>
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                 <label htmlFor="generateInEnglish" className="text-lg font-semibold text-gray-700 dark:text-gray-200">{t.generator.step5}</label>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="generateInEnglish" name="generateInEnglish" checked={formData.generateInEnglish} onChange={handleCheckboxChange} className="sr-only peer"/>
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C63FF]"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                     <div className="flex justify-between items-center pt-6">
                        <button type="button" onClick={prevStep} disabled={step === 1} className="py-2 px-4 text-gray-600 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {t.generator.back}
                        </button>
                        {step < TOTAL_STEPS ? (
                            <button type="button" onClick={nextStep} className="bg-[#6C63FF] hover:bg-[#5850e0] text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all">
                                {t.generator.next}
                            </button>
                        ) : (
                             <button type="submit" className="w-auto bg-[#6C63FF] hover:bg-[#5850e0] text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all text-lg flex items-center justify-center gap-2">
                                <Icons.Rocket className="w-5 h-5"/>
                                {t.generator.generateButton}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
