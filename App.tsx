import React, { useEffect, useState } from 'react';
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
    const { page, setInstallPrompt, isLoading, showAuthModal, setSharedCourse, setGeneratedCourse, setPage, currentUser, showToast, language, refreshProfile } = useAppContext();
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

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
            // We ensure we wait for currentUser to be loaded so we have the UID to update
            if (url.includes('payment_success=true') && !isLoading && currentUser) {
                setIsVerifyingPayment(true);
                
                // 1. Update the user in Database
                try {
                    console.log("Payment detected. Updating user profile...");
                    await backendService.updateUser(currentUser.uid, { isPremium: true });
                    
                    const successMsg = language === 'pt' 
                        ? 'Pagamento confirmado! A sua conta agora é Premium.' 
                        : 'Payment confirmed! Your account is now Premium.';
                    
                    showToast(successMsg, 'success');

                    // TRACK PURCHASE ON META ADS
                    if (typeof fbq !== 'undefined') {
                        fbq('track', 'Purchase', {
                            value: 14.99,
                            currency: 'EUR',
                            content_name: 'Premium Subscription'
                        });
                    }

                    // 2. Remove the query parameter
                    const newUrl = window.location.href.replace('?payment_success=true', '').replace('&payment_success=true', '');
                    window.history.replaceState({}, document.title, newUrl);

                    // 3. Refresh profile internally without full reload
                    await refreshProfile();
                    
                    // 4. Force navigation to generator to "unlock" it visually
                    setPage('generator');

                } catch (error: any) {
                    console.error("Error upgrading user:", error);
                    
                    // Specific error message for RLS policy issues
                    if (error.message && (error.message.includes("policy") || error.message.includes("permission"))) {
                        const rlsMsg = language === 'pt'
                            ? "Erro de Permissão: Execute o script FIX_DATABASE.sql no Supabase."
                            : "Database Permission Error: Please run FIX_DATABASE.sql in Supabase.";
                        showToast(rlsMsg, 'error');
                    } else {
                        showToast("Error activating premium. Please contact support.", 'error');
                    }
                } finally {
                    setIsVerifyingPayment(false);
                }
            }
        };

        handlePaymentSuccess();
    }, [isLoading, currentUser, showToast, language, refreshProfile, setPage]);


    if (isLoading || isVerifyingPayment) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <Spinner text={isVerifyingPayment ? (language === 'pt' ? "A verificar pagamento..." : "Verifying payment...") : "Loading SkillSpark..."} />
            </div>
        );
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