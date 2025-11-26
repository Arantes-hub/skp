
export type Language = 'pt' | 'en';
export type Theme = 'light' | 'dark';

export type Page = 'landing' | 'generator' | 'account' | 'courseResult' | 'plans';

export interface GeneratorForm {
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  includeExercises: boolean;
  generateInEnglish: boolean;
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  title: string;
  questions: Question[];
}

export interface Module {
  title: string;
  summary: string; // Initially empty until generated
  detailedContent: string; // Initially empty until generated
  exercise?: string;
  exerciseSolution?: string;
  videoUrl?: string | null;
  videoState?: 'idle' | 'generating' | 'success' | 'error';
  // New field for lazy loading
  status?: 'pending' | 'generating' | 'completed' | 'error';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  estimatedDuration: string;
  conclusion: string;
  createdBy: string;
}

export interface User {
  uid: string;
  name: string;
  email: string | null;
  isPremium: boolean;
}

// Fix: Add a dedicated type for a single course's progress data.
export interface SingleCourseProgress {
    completedModules: number[];
    quizScore?: { score: number; total: number };
    notes?: { [moduleId: number]: string };
}

// Updated CourseProgress for new features
export interface CourseProgress {
    [courseId: string]: SingleCourseProgress;
}

// New Toast type
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// Heavily updated AppContextType for new features
export interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  page: Page;
  setPage: (page: Page) => void;
  
  currentUser: User | null;
  isLoading: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  logout: () => void;
  
  generatedCourse: Course | null;
  setGeneratedCourse: (course: Course | null) => void;
  translatedCourse: Course | null;
  setTranslatedCourse: (course: Course | null) => void;
  addCourseToHistory: (course: Course) => Promise<void>;
  getUserCourses: () => Promise<Course[]>;
  getUserCourseCount: () => Promise<number>;

  getCourseProgress: (courseId: string) => Promise<{ completedModules: number[] }>;
  toggleModuleCompletion: (courseId: string, moduleId: number) => Promise<void>;

  sharedCourse: Course | null;
  setSharedCourse: (course: Course | null) => void;

  installPrompt: Event | null;
  setInstallPrompt: (event: Event | null) => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;

  viewCourseFromHistory: (course: Course) => void;
  
  // New features
  showToast: (message: string, type?: 'success' | 'error') => void;
  saveQuizScore: (courseId: string, score: number, total: number) => Promise<void>;
  getQuizScore: (courseId: string) => Promise<{ score: number; total: number } | undefined>;
  saveNote: (courseId: string, moduleId: number, note: string) => Promise<void>;
  getNote: (courseId: string, moduleId: number) => Promise<string>;
  
  // Lazy Loading Feature
  triggerModuleGeneration: (course: Course, moduleIndex: number) => Promise<void>;
}
