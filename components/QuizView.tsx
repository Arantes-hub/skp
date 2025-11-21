import React, { useState } from 'react';
import { Quiz } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { Icons } from './icons';

interface QuizViewProps {
    quiz: Quiz;
    onClose: () => void;
    onQuizComplete: (score: number, total: number) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ quiz, onClose, onQuizComplete }) => {
    const { language, setPage } = useAppContext();
    const t = translations[language].quiz;

    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
        if (isSubmitted) return;
        setSelectedAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[questionIndex] = optionIndex;
            return newAnswers;
        });
    };

    const calculateScore = () => {
        return quiz.questions.reduce((score, question, index) => {
            return score + (selectedAnswers[index] === question.correctAnswerIndex ? 1 : 0);
        }, 0);
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
        const finalScore = calculateScore();
        onQuizComplete(finalScore, quiz.questions.length);
    };
    
    const score = calculateScore();

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl my-8 animate-fade-in">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{quiz.title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Icons.X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                
                <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
                    {quiz.questions.map((q, qIndex) => {
                        const isCorrect = selectedAnswers[qIndex] === q.correctAnswerIndex;
                        return (
                            <div key={qIndex} className="mb-8 p-5 rounded-lg border dark:border-gray-700">
                                <p className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">{qIndex + 1}. {q.questionText}</p>
                                <div className="space-y-3">
                                    {q.options.map((option, oIndex) => {
                                        let optionClass = 'border-gray-300 dark:border-gray-600';
                                        if (isSubmitted) {
                                            if (oIndex === q.correctAnswerIndex) {
                                                optionClass = 'border-green-500 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-300';
                                            } else if (selectedAnswers[qIndex] === oIndex) {
                                                optionClass = 'border-red-500 bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-300';
                                            }
                                        } else if (selectedAnswers[qIndex] === oIndex) {
                                            optionClass = 'border-[#6C63FF] bg-purple-50 dark:bg-purple-900/50';
                                        }

                                        return (
                                            <button 
                                                key={oIndex}
                                                onClick={() => handleSelectAnswer(qIndex, oIndex)}
                                                disabled={isSubmitted}
                                                className={`w-full text-left p-3 rounded-md border-2 transition-all ${optionClass} disabled:cursor-not-allowed`}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                                {isSubmitted && !isCorrect && (
                                    <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                                       {t.incorrect} <strong>{q.options[q.correctAnswerIndex]}</strong>
                                    </div>
                                )}
                                {isSubmitted && isCorrect && (
                                    <div className="mt-3 text-sm text-green-600 dark:text-green-400">
                                        <strong>{t.correct}</strong>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
                
                <div className="p-6 border-t dark:border-gray-700 text-center sticky bottom-0 bg-white dark:bg-gray-800 rounded-b-2xl">
                    {isSubmitted ? (
                        <div>
                             <p className="text-xl font-bold mb-4">{t.score.replace('{score}', String(score)).replace('{total}', String(quiz.questions.length))}</p>
                             <button onClick={onClose} className="bg-[#6C63FF] hover:bg-[#5850e0] text-white font-bold py-2 px-6 rounded-lg transition-all">
                                 Close
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleSubmit} disabled={selectedAnswers.some(a => a === null)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {t.submit}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};