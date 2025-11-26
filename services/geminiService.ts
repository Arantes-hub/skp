
// Fix: Import GenerateContentResponse for explicit typing.
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { GeneratorForm, Course, Module, Quiz } from '../types';
import { translations } from "../utils/translations";

// --- ROBUST CONFIGURATION ---
const apiKey = process.env.API_KEY as string;

if (!apiKey) {
  console.error("CRITICAL ERROR: API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

// Define Types manually to avoid runtime errors if CDN export is flaky
const Types = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT'
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> => {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            console.warn(`API Attempt ${attempt} failed:`, error);
            const isOverloaded = error.toString().includes('503') || error.toString().toLowerCase().includes('overloaded');

            if (attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                await sleep(delay);
            } else {
                throw lastError;
            }
        }
    }
    throw lastError;
};

// --- STEP 1: Generate Outline Only (Fast) ---
export const generateCourse = async (
  formData: GeneratorForm,
  language: 'pt' | 'en',
  onProgress: (message: string) => void,
  userUid: string,
): Promise<Course> => {
  if (!apiKey) throw new Error("API configuration missing. Please check your settings.");
  
  const langInstruction = language === 'pt' ? 'Portuguese (Portugal)' : 'English';
  const t = translations[language];

  try {
    // === Generate Course Outline ===
    onProgress(t.generator.progress.outline);
    
    const outlineSchema = {
        type: Types.OBJECT,
        properties: {
            title: { type: Types.STRING },
            description: { type: Types.STRING },
            moduleTitles: {
                type: Types.ARRAY,
                items: { type: Types.STRING },
                description: "A list of 5 to 8 module titles."
            },
            estimatedDuration: { type: Types.STRING },
            conclusion: { type: Types.STRING }
        },
        required: ["title", "description", "moduleTitles", "estimatedDuration", "conclusion"]
    };

    const outlinePrompt = `
      Create a course outline for the topic "${formData.topic}" for a ${formData.level} level user.
      The course should be structured for someone who can study for ${formData.duration} per day.
      Provide a course 'title', a brief 'description', a list of 5 to 8 'moduleTitles', an 'estimatedDuration' for the whole course, and a final 'conclusion'.
      Respond in ${langInstruction}.
    `;
    
    const outlineApiCall = () => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: outlinePrompt }] },
      config: { responseMimeType: "application/json", responseSchema: outlineSchema },
    });

    const outlineResponse: GenerateContentResponse = await withRetry(outlineApiCall);
    const outlineText = outlineResponse.text?.trim().replace(/^```json\s*|```$/g, '');
    if (!outlineText) throw new Error("Empty response from AI for outline.");
    
    const courseOutline = JSON.parse(outlineText);

    // Initialize modules with 'pending' status
    const initialModules: Module[] = courseOutline.moduleTitles.map((title: string) => ({
        title: title,
        summary: "",
        detailedContent: "",
        status: 'pending' // Mark as pending so UI knows to generate it later
    }));

    const fullCourse: Course = {
      id: crypto.randomUUID(),
      createdBy: userUid,
      title: courseOutline.title,
      description: courseOutline.description,
      modules: initialModules,
      estimatedDuration: courseOutline.estimatedDuration,
      conclusion: courseOutline.conclusion,
    };

    return fullCourse;

  } catch (error) {
    console.error("Error generating course outline:", error);
    throw error;
  }
};

// --- STEP 2: Generate Single Module (Lazy Loading) ---
export const generateSingleModule = async (
    courseTitle: string,
    moduleTitle: string,
    level: string,
    includeExercises: boolean,
    language: 'pt' | 'en'
): Promise<Partial<Module>> => {
    const langInstruction = language === 'pt' ? 'Portuguese (Portugal)' : 'English';
    
    const moduleProperties: any = {
        summary: { type: Types.STRING, description: "A brief, one-sentence summary." },
        detailedContent: { type: Types.STRING, description: "A comprehensive, multi-paragraph explanation of the topic. Use basic HTML tags like <strong>, <ul>, <li> for lists to structure the content. Do NOT use markdown." },
    };
    const moduleRequired = ["summary", "detailedContent"];
    let exercisePromptPart = "Do not include an exercise or solution.";

    if (includeExercises) {
        moduleProperties.exercise = { type: Types.STRING };
        moduleProperties.exerciseSolution = { type: Types.STRING };
        moduleRequired.push("exercise", "exerciseSolution");
        exercisePromptPart = "Also provide a practical 'exercise' and its corresponding 'exerciseSolution'.";
    }

    const moduleSchema = { type: Types.OBJECT, properties: moduleProperties, required: moduleRequired };

    const modulePrompt = `
      For a course titled "${courseTitle}", generate content for the module "${moduleTitle}".
      The target audience is at a ${level} level.
      Provide:
      1. 'summary': A brief, one-sentence overview.
      2. 'detailedContent': A comprehensive, multi-paragraph explanation. Use basic HTML tags like <strong> for emphasis, <ul> and <li> for lists.
      ${exercisePromptPart}
      Respond in ${langInstruction}.
    `;

    try {
        const moduleApiCall = () => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: modulePrompt }] },
            config: { responseMimeType: "application/json", responseSchema: moduleSchema },
        });

        const moduleResponse: GenerateContentResponse = await withRetry(moduleApiCall);
        const moduleText = moduleResponse.text?.trim().replace(/^```json\s*|```$/g, '');
        if (!moduleText) throw new Error(`Empty response for module: ${moduleTitle}`);
        
        return JSON.parse(moduleText);
    } catch (error) {
        console.error(`Error generating module ${moduleTitle}:`, error);
        throw error;
    }
}

export const suggestIdeas = async (language: 'pt' | 'en'): Promise<string[]> => {
    const langInstruction = language === 'pt' ? 'Portuguese (Portugal)' : 'English';
    const ideasSchema = {
        type: Types.OBJECT,
        properties: { ideas: { type: Types.ARRAY, items: { type: Types.STRING } } },
        required: ["ideas"],
    };
    const prompt = `Suggest 3 popular and interesting course topics. Respond in ${langInstruction}.`;

    try {
        const apiCall = () => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: ideasSchema }
        });
        const response: GenerateContentResponse = await withRetry(apiCall);
        const text = response.text?.trim().replace(/^```json\s*|```$/g, '');
        if (!text) return ["Digital Marketing", "Python Programming", "Personal Finance"];
        
        const parsed = JSON.parse(text);
        return parsed.ideas;
    } catch (error) {
        console.error("Error suggesting ideas:", error);
        throw error;
    }
};

export const generateQuiz = async (course: Course, language: 'pt' | 'en'): Promise<Quiz> => {
    const langInstruction = language === 'pt' ? 'Portuguese (Portugal)' : 'English';
    // Only include completed modules in the context
    const completedModules = course.modules.filter(m => m.status === 'completed' || !m.status);
    const courseContentSummary = completedModules.map(m => `Module "${m.title}": ${m.summary}`).join('\n');

    const quizSchema = {
        type: Types.OBJECT,
        properties: {
            title: { type: Types.STRING },
            questions: {
                type: Types.ARRAY,
                items: {
                    type: Types.OBJECT,
                    properties: {
                        questionText: { type: Types.STRING },
                        options: { type: Types.ARRAY, items: { type: Types.STRING } },
                        correctAnswerIndex: { type: Types.INTEGER }
                    },
                    required: ["questionText", "options", "correctAnswerIndex"]
                }
            }
        },
        required: ["title", "questions"]
    };

    const prompt = `
      Based on the following course content, create a multiple-choice quiz with 5 questions to test understanding.
      For each question, provide 4 options and indicate the index of the correct answer (0-3).
      The quiz should be titled "Knowledge Check: {Course Title}".
      Respond in ${langInstruction}.

      Course Title: ${course.title}
      Course Content Summary:
      ${courseContentSummary}
    `;

    try {
        const apiCall = () => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: quizSchema }
        });
        const response: GenerateContentResponse = await withRetry(apiCall);
        const text = response.text?.trim().replace(/^```json\s*|```$/g, '');
        if (!text) throw new Error("Empty response for quiz.");
        
        const parsed = JSON.parse(text);
        return parsed as Quiz;
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw error;
    }
}
