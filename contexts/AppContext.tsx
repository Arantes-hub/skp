
import React, { createContext, useState, useContext, ReactNode, useEffect, PropsWithChildren } from 'react';
import type { Language, Page, User, Course, Theme, AppContextType, Toast as ToastType } from '../types';
// SWITCHED TO SUPABASE SERVICE
import * as backendService from '../services/supabaseService';
import { Toast } from '../components/Toast';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [language, setLanguage] = useState<Language>('pt');
  const [page, setInternalPage] = useState<Page>('landing');
  
  // Real authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Manages initial auth check
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [generatedCourse, setGeneratedCourse] = useState<Course | null>(null);
  const [translatedCourse, setTranslatedCourse] = useState<Course | null>(null);
  const [sharedCourse, setSharedCourse] = useState<Course | null>(null);
  
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  
  const [toasts, setToasts] = useState<ToastType[]>([]);
  
  // --- REAL AUTH LISTENER ---
  useEffect(() => {
    // Backend service must return a cleanup function
    const unsubscribe = backendService.onAuthChange((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    // Cleanup subscription on unmount
    return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    };
  }, []);

  // --- ROUTING ---
  const setPage = (newPage: Page) => {
    window.location.hash = `#/${newPage}`;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').split('?')[0];
      const validPages: Page[] = ['landing', 'generator', 'account', 'courseResult', 'plans'];
      if (validPages.includes(hash as Page)) {
        setInternalPage(hash as Page);
      } else {
        setInternalPage('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const newToast: ToastType = { id: Date.now(), message, type };
    setToasts(prev => [...prev, newToast]);
  };

  const logout = async () => {
    await backendService.logout();
    // The onAuthChange listener will automatically set currentUser to null
    setPage('landing');
  };

  const addCourseToHistory = async (course: Course) => {
    await backendService.saveCourse(course);
  };

  const getUserCourses = async (): Promise<Course[]> => {
    if (!currentUser) return [];
    return backendService.getUserCourses(currentUser.uid);
  };

  const getUserCourseCount = async (): Promise<number> => {
    if (!currentUser) return 0;
    return backendService.getUserCourseCount(currentUser.uid);
  }

  const getCourseProgress = async (courseId: string) => {
    if (!currentUser) return { completedModules: [] };
    return backendService.getCourseProgress(currentUser.uid, courseId);
  }

  const toggleModuleCompletion = async (courseId: string, moduleId: number) => {
      if (!currentUser) return;
      const progress = await getCourseProgress(courseId);
      const newProgressSet = new Set(progress.completedModules || []);
      if (newProgressSet.has(moduleId)) {
          newProgressSet.delete(moduleId);
      } else {
          newProgressSet.add(moduleId);
      }
      await backendService.saveCourseProgress(currentUser.uid, courseId, { completedModules: Array.from(newProgressSet) });
  };
  
  const viewCourseFromHistory = (course: Course) => {
    setGeneratedCourse(course);
    setSharedCourse(null);
    setPage('courseResult');
  };

  const saveQuizScore = async (courseId: string, score: number, total: number) => {
    if (!currentUser) return;
    await backendService.saveQuizScore(currentUser.uid, courseId, { score, total });
    showToast("Quiz score saved!");
  };
  const getQuizScore = (courseId: string) => {
      if (!currentUser) return Promise.resolve(undefined);
      return backendService.getQuizScore(currentUser.uid, courseId);
  }
  const saveNote = (courseId: string, moduleId: number, note: string) => {
      if (!currentUser) return Promise.resolve();
      return backendService.saveNote(currentUser.uid, courseId, moduleId, note);
  };
  const getNote = (courseId: string, moduleId: number) => {
      if (!currentUser) return Promise.resolve("");
      return backendService.getNote(currentUser.uid, courseId, moduleId);
  }

  const value: AppContextType = {
    language, setLanguage, page, setPage, currentUser, isLoading, showAuthModal,
    setShowAuthModal, logout, generatedCourse, setGeneratedCourse,
    translatedCourse, setTranslatedCourse, addCourseToHistory, getUserCourses, getUserCourseCount,
    getCourseProgress, toggleModuleCompletion, sharedCourse, setSharedCourse,
    installPrompt, setInstallPrompt, theme, setTheme, viewCourseFromHistory,
    showToast, saveQuizScore, getQuizScore, saveNote, getNote,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={() => setToasts(t => t.filter(x => x.id !== toast.id))} />
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
