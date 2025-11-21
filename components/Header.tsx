import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { Icons } from './icons';

const UserMenu: React.FC = () => {
    const { language, setPage, logout, currentUser } = useAppContext();
    const t = translations[language];
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <Icons.User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="hidden sm:inline font-medium text-gray-700 dark:text-gray-300">{currentUser?.name}</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50">
                    <button 
                        onClick={() => { setPage('account'); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >{t.header.account}</button>
                    <button 
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                    >{t.header.logout}</button>
                </div>
            )}
        </div>
    );
};


export const Header: React.FC = () => {
  const { language, setLanguage, setPage, currentUser, setShowAuthModal, installPrompt, setInstallPrompt, theme, setTheme } = useAppContext();
  const t = translations[language];

  const handleLanguageToggle = () => setLanguage(language === 'pt' ? 'en' : 'pt');
  const handleThemeToggle = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleInstallClick = () => {
    if (!installPrompt) return;
    (installPrompt as any).prompt();
    (installPrompt as any).userChoice.then(() => setInstallPrompt(null));
  };
  
  const handleNav = (page: 'generator' | 'plans' | 'landing' | 'account') => {
      setPage(page);
  }

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => handleNav('landing')}
        >
          <Icons.Rocket className="h-8 w-8 text-[#6C63FF]" />
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">SkillSpark</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => currentUser ? handleNav('generator') : setShowAuthModal(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#6C63FF] dark:hover:text-white transition-colors"
          >
            {t.header.generateCourse}
          </button>
          <button 
            onClick={() => handleNav('plans')}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#6C63FF] dark:hover:text-white transition-colors"
          >
            {t.header.plans}
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
           {installPrompt && (
            <button 
              onClick={handleInstallClick} 
              className="hidden md:flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-all"
              aria-label={t.header.installApp}
            >
              <Icons.Download className="h-4 w-4" />
              {t.header.installApp}
            </button>
          )}

          <button onClick={handleThemeToggle} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
             {theme === 'light' ? <Icons.Moon className="h-5 w-5 text-gray-600 dark:text-gray-300"/> : <Icons.Sun className="h-5 w-5 text-gray-600 dark:text-gray-300"/>}
          </button>
          <button onClick={handleLanguageToggle} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Icons.Languages className="h-5 w-5 text-gray-600 dark:text-gray-300"/>
          </button>
          
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

          {currentUser ? (
            <UserMenu />
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)} 
              className="hidden md:flex items-center bg-[#6C63FF] hover:bg-[#5850e0] text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              {t.header.login}
            </button>
          )}
           
           {/* Mobile Buttons */}
           {installPrompt && (
             <button onClick={handleInstallClick} className="md:hidden p-2"><Icons.Download className="h-6 w-6 text-green-600" /></button>
           )}
           <button onClick={() => currentUser ? handleNav('account') : setShowAuthModal(true)} className="md:hidden p-2">
             {currentUser ? <Icons.User className="h-6 w-6 text-gray-700 dark:text-gray-300"/> : <Icons.LogIn className="h-6 w-6 text-gray-700 dark:text-gray-300"/>}
           </button>
        </div>
      </div>
    </header>
  );
};