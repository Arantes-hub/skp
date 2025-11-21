
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { Icons } from './icons';

export const Footer: React.FC = () => {
  const { language } = useAppContext();
  const t = translations[language];

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center gap-2">
            <Icons.Rocket className="h-6 w-6 text-[#6C63FF]" />
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">SkillSpark</span>
          </div>
          <div className="flex space-x-6 text-gray-600 dark:text-gray-300">
            <a href="#" className="hover:text-[#6C63FF] dark:hover:text-white transition-colors">{t.footer.contact}</a>
            <a href="#" className="hover:text-[#6C63FF] dark:hover:text-white transition-colors">{t.footer.privacy}</a>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><Icons.Twitter className="h-6 w-6" /></a>
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><Icons.Github className="h-6 w-6" /></a>
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><Icons.Mail className="h-6 w-6" /></a>
          </div>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
          © {new Date().getFullYear()} SkillSpark. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
};