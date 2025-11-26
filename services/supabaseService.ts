
import { supabase } from './supabaseClient';
import type { User, Course, SingleCourseProgress } from '../types';

// --- AUTHENTICATION ---

export const onAuthChange = (callback: (user: User | null) => void) => {
    // Initialize checking current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
            handleUserSession(session.user, callback);
        } else {
            callback(null);
        }
    });

    // Set up listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            handleUserSession(session.user, callback);
        } else {
            callback(null);
        }
    });

    // Return cleanup function compatible with React useEffect
    return () => {
        subscription.unsubscribe();
    };
};

const handleUserSession = async (authUser: any, callback: (user: User | null) => void) => {
    // Fetch extra profile data from 'profiles' table
    const userProfile = await getUserProfile(authUser.id);
    if (userProfile) {
        callback(userProfile);
    } else {
        // If profile doesn't exist yet (e.g. first login), create basic one
        const newUserProfile: User = {
            uid: authUser.id,
            name: authUser.user_metadata.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || null,
            isPremium: false,
        };
        // Try to create the profile
        await createUserProfile(newUserProfile);
        callback(newUserProfile);
    }
}

export const signupWithEmail = async (name: string, email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            }
        }
    });

    if (error) throw error;
    if (!data.user) throw new Error("User creation failed. Please check your email for confirmation if enabled.");

    const newUser: User = {
        uid: data.user.id,
        name: name,
        email: email,
        isPremium: false,
    };
    
    // Ensure profile exists
    await createUserProfile(newUser);
    return newUser;
};

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("Login failed.");

    const user = await getUserProfile(data.user.id);
    // Fallback if profile is missing but auth exists
    if (!user) {
        const fallbackUser: User = {
            uid: data.user.id,
            name: data.user.user_metadata.full_name || email.split('@')[0],
            email: email,
            isPremium: false
        };
        await createUserProfile(fallbackUser);
        return fallbackUser;
    }
    return user;
};

export const loginWithGoogle = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
    if (error) throw error;
};

export const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

// --- USER PROFILE MANAGEMENT ---

const createUserProfile = async (user: User): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: user.uid,
            name: user.name,
            email: user.email,
            is_premium: user.isPremium
        }, { onConflict: 'id' });
    if (error) console.error("Error creating profile:", error);
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

    if (error || !data) return null;

    return {
        uid: data.id,
        name: data.name,
        email: data.email,
        isPremium: data.is_premium
    };
};

export const updateUser = async (uid: string, data: Partial<User>): Promise<User> => {
    const updates: any = {};
    if (data.name) updates.name = data.name;
    if (data.isPremium !== undefined) updates.is_premium = data.isPremium;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', uid);
    
    if (error) throw error;
    
    const updated = await getUserProfile(uid);
    if (!updated) throw new Error("Failed to fetch updated profile");
    return updated;
};

export const refreshUserSession = async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        return getUserProfile(session.user.id);
    }
    return null;
};

// --- COURSE DATA MANAGEMENT ---

export const saveCourse = async (course: Course): Promise<void> => {
    const { error } = await supabase
        .from('courses')
        .upsert({
            id: course.id,
            title: course.title,
            description: course.description,
            modules: course.modules, // Supabase handles JSON automatically
            estimated_duration: course.estimatedDuration,
            conclusion: course.conclusion,
            created_by: course.createdBy,
            created_at: new Date().toISOString()
        });
    
    if (error) {
        console.error("Error saving course:", error);
        throw error;
    }
};

export const getCourse = async (courseId: string): Promise<Course | null> => {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        title: data.title,
        description: data.description,
        modules: data.modules,
        estimatedDuration: data.estimated_duration,
        conclusion: data.conclusion,
        createdBy: data.created_by
    };
};

export const getUserCourses = async (uid: string): Promise<Course[]> => {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('created_by', uid)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching courses:", error);
        return [];
    }

    return data.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        modules: row.modules,
        estimatedDuration: row.estimated_duration,
        conclusion: row.conclusion,
        createdBy: row.created_by
    }));
};

export const getUserCourseCount = async (uid: string): Promise<number> => {
    const { count, error } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', uid);
    
    if (error) {
        console.error("Error counting courses:", error);
        return 0;
    }
    return count || 0;
};

// --- PROGRESS MANAGEMENT ---

export const getCourseProgress = async (uid: string, courseId: string): Promise<SingleCourseProgress> => {
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .match({ user_id: uid, course_id: courseId })
        .single();

    if (error || !data) {
        return { completedModules: [], notes: {}, quizScore: undefined };
    }

    return {
        completedModules: data.completed_modules || [],
        notes: data.notes || {},
        quizScore: data.quiz_score || undefined
    };
};

export const saveCourseProgress = async (uid: string, courseId: string, data: { completedModules: number[] }): Promise<void> => {
    const existing = await getCourseProgress(uid, courseId);
    
    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: uid,
            course_id: courseId,
            completed_modules: data.completedModules,
            notes: existing.notes || {},
            quiz_score: existing.quizScore
        }, { onConflict: 'user_id,course_id' });

    if (error) console.error("Error saving progress:", error);
};

export const saveQuizScore = async (uid: string, courseId: string, score: { score: number; total: number }): Promise<void> => {
    const existing = await getCourseProgress(uid, courseId);
    
    if (existing.quizScore && score.score <= existing.quizScore.score) return;

    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: uid,
            course_id: courseId,
            completed_modules: existing.completedModules,
            notes: existing.notes || {},
            quiz_score: score
        }, { onConflict: 'user_id,course_id' });
        
    if (error) console.error("Error saving quiz score:", error);
};

export const getQuizScore = async (uid: string, courseId: string): Promise<{ score: number; total: number; } | undefined> => {
    const progress = await getCourseProgress(uid, courseId);
    return progress.quizScore;
};

export const saveNote = async (uid: string, courseId: string, moduleId: number, note: string): Promise<void> => {
    const existing = await getCourseProgress(uid, courseId);
    const updatedNotes = { ...existing.notes, [moduleId]: note };

    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: uid,
            course_id: courseId,
            completed_modules: existing.completedModules,
            notes: updatedNotes,
            quiz_score: existing.quizScore
        }, { onConflict: 'user_id,course_id' });

    if (error) console.error("Error saving note:", error);
};

export const getNote = async (uid: string, courseId: string, moduleId: number): Promise<string> => {
    const progress = await getCourseProgress(uid, courseId);
    return progress.notes?.[moduleId] || "";
};
