import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { Icons } from '../components/icons';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800/50 rounded-xl shadow-md dark:shadow-2xl transition-transform hover:scale-105">
        <div className="mb-4 text-[#6C63FF]">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
);

// FIX: Explicitly type TestimonialCard as a React.FC to resolve the error with the 'key' prop.
const TestimonialCard: React.FC<{ name: string; role: string; text: string; avatarUrl: string }> = ({ name, role, text, avatarUrl }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-lg dark:shadow-2xl flex flex-col h-full animate-fade-in transition-transform hover:scale-105">
        <div className="flex items-center mb-4">
            <img src={avatarUrl} alt={name} className="w-12 h-12 rounded-full mr-4 border-2 border-[#6C63FF]" />
            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
            </div>
        </div>
        <div className="flex mb-4">
            {[...Array(5)].map((_, i) => (
                <Icons.Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
        </div>
        <p className="text-gray-600 dark:text-gray-300 flex-grow relative italic">
            <Icons.Quote className="w-10 h-10 text-gray-200 dark:text-gray-700 absolute -top-4 -left-3" />
            <span className="relative">{text}</span>
        </p>
    </div>
);


export const LandingPage: React.FC = () => {
    const { language, setPage, currentUser, setShowAuthModal } = useAppContext();
    const t = translations[language];

    const handleCTA = () => {
        if (!currentUser) {
            setShowAuthModal(true);
        } else {
            setPage('generator');
        }
    };

    return (
        <div className="w-full">
            {/* Hero Section */}
            <section className="bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 flex flex-col items-center justify-center text-center">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
                            {t.landing.title}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
                            {t.landing.subtitle}
                        </p>
                        <button
                            onClick={handleCTA}
                            className="bg-[#6C63FF] hover:bg-[#5850e0] text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
                        >
                            {t.landing.cta}
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900/60">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Icons.Rocket className="w-12 h-12" />}
                            title={t.landing.feature1Title}
                            description={t.landing.feature1Desc}
                        />
                        <FeatureCard
                            icon={<Icons.BrainCircuit className="w-12 h-12" />}
                            title={t.landing.feature2Title}
                            description={t.landing.feature2Desc}
                        />
                        <FeatureCard
                            icon={<Icons.BookOpen className="w-12 h-12" />}
                            title={t.landing.feature3Title}
                            description={t.landing.feature3Desc}
                        />
                    </div>
                </div>
            </section>
            
            {/* New Testimonials Section */}
            <section className="py-20 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
                            {t.testimonials.title}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {t.testimonials.reviews.map((review, index) => (
                           <TestimonialCard 
                                key={index}
                                name={review.name}
                                role={review.role}
                                text={review.text}
                                avatarUrl={review.avatarUrl}
                           />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
