import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { translations } from '../../utils/translations';
import * as backendService from '../../services/supabaseService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { Icons } from '../icons';

export const AuthModal: React.FC = () => {
    const { language, setShowAuthModal, showToast } = useAppContext();
    const t = translations[language].auth;
    
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConfigured, setIsConfigured] = useState(true);

    useEffect(() => {
        setIsConfigured(isSupabaseConfigured());
    }, []);

    const handleSuccessfulAuth = () => {
        showToast(isLogin ? t.loginSuccess : t.registerSuccess);
        
        // TRACK REGISTRATION ON META ADS
        if (!isLogin && typeof fbq !== 'undefined') {
            fbq('track', 'CompleteRegistration');
        }

        setShowAuthModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConfigured) {
            setError("Setup Required: Please configure Supabase keys in code.");
            return;
        }

        if (!isLogin && !formData.name) {
            setError("Name is required for registration.");
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            if (isLogin) {
                await backendService.loginWithEmail(formData.email, formData.password);
            } else {
                await backendService.signupWithEmail(formData.name, formData.email, formData.password);
            }
            handleSuccessfulAuth();
        } catch (err: any) {
            setError(err.message || t.authError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!isConfigured) {
            setError("Setup Required: Please configure Supabase keys in code.");
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await backendService.loginWithGoogle();
            // Note: Supabase redirects for Google login, so we might not reach here immediately.
            // The auth listener will handle the state on redirect.
        } catch (err: any) {
            setError(err.message || t.authError);
            setIsLoading(false);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8 animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{isLogin ? t.loginTitle : t.registerTitle}</h2>
                    <button onClick={() => setShowAuthModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Icons.X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {!isConfigured && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Icons.Rocket className="h-5 w-5 text-amber-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-amber-700">
                                    <strong>Falta Configurar:</strong> Abra o arquivo <code>services/supabaseClient.ts</code> e cole as suas chaves URL e ANON KEY.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm dark:bg-red-900/50 dark:text-red-300">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <input type="text" name="name" placeholder={t.name} required onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    )}
                    <input type="email" name="email" placeholder={t.email} required onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="password" name="password" placeholder={t.password} required onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>

                    <button type="submit" disabled={isLoading || !isConfigured} className="w-full bg-[#6C63FF] hover:bg-[#5850e0] text-white font-bold py-3 rounded-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isLoading ? '...' : (isLogin ? t.login : t.register)}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t dark:border-gray-600"></span></div>
                    <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                </div>

                <button onClick={handleGoogleLogin} disabled={isLoading || !isConfigured} className="w-full flex items-center justify-center gap-2 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.596 44 30.035 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                    {t.loginWithGoogle}
                </button>
                
                <p className="text-center mt-6 text-sm">
                    {isLogin ? t.noAccount : t.haveAccount}{' '}
                    <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-[#6C63FF] hover:underline">
                        {isLogin ? t.register : t.login}
                    </button>
                </p>

            </div>
        </div>
    );
};