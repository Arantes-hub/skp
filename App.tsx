
import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { AccountPage } from './pages/AccountPage';
import { CourseResultPage } from './pages/CourseResultPage';
import { PlansPage } from './pages/PlansPage';
import { AuthModal } from './components/auth/AuthModal';
import { Spinner } from './components/Spinner';
import * as backendService from './services/supabaseService';

const AppContent = () => {
    const { page, setInstallPrompt, isLoading, showAuthModal, setSharedCourse, setGeneratedCourse, setPage, currentUser, showToast, language } = useAppContext();

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, [setInstallPrompt]);
    
    useEffect(() => {
        // Handle shared course links from URL
        const hash = window.location.hash;
        const shareIdMatch = hash.match(/share=([a-zA-Z0-9-]+)/);
        if (shareIdMatch && shareIdMatch[1]) {
            const shareId = shareIdMatch[1];
            backendService.getCourse(shareId).then(course => {
                if (course) {
                    setSharedCourse(course);
                    setGeneratedCourse(null);
                    setPage('courseResult');
                }
            });
        }
    }, [setSharedCourse, setPage]);

    // --- GLOBAL PAYMENT LISTENER ---
    useEffect(() => {
        const handlePaymentSuccess = async () => {
            const url = window.location.href;
            
            // Check for payment success flag in URL
            if (url.includes('payment_success=true') && !isLoading && currentUser) {
                // 1. Remove the query parameter immediately to prevent loops or bad states
                const newUrl = window.location.href.replace('?payment_success=true', '').replace('&payment_success=true', '');
                window.history.replaceState({}, document.title, newUrl);

                // 2. Update the user in Database
                try {
                    await backendService.updateUser(currentUser.uid, { isPremium: true });
                    
                    const successMsg = language === 'pt' 
                        ? 'Pagamento recebido! A sua conta agora é Premium.' 
                        : 'Payment received! Your account is now Premium.';
                    
                    showToast(successMsg, 'success');

                    // 3. Force a full page reload to ensure the Premium status is reflected everywhere
                    // (AppContext, LocalStorage, cached UI states)
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);

                } catch (error) {
                    console.error("Error upgrading user:", error);
                    showToast("Error activating premium. Please contact support.", 'error');
                }
            }
        };

        handlePaymentSuccess();
    }, [isLoading, currentUser, showToast, language]);


    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Spinner text="Loading SkillSpark..." /></div>;
    }

    const renderPage = () => {
        switch (page) {
            case 'generator': return <GeneratorPage />;
            case 'account': return <AccountPage />;
            case 'courseResult': return <CourseResultPage />;
            case 'plans': return <PlansPage />;
            case 'landing':
            default: return <LandingPage />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {showAuthModal && <AuthModal />}
            <Header />
            <main className="flex-grow">
                 <div key={page} className="animate-fade-in">
                    {renderPage()}
                </div>
            </main>
            <Footer />
        </div>
    );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
