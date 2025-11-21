
// Fix: Import GenerateContentResponse and GenerateVideosOperation for explicit typing.
import { GoogleGenAI, Type, GenerateContentResponse, GenerateVideosOperation } from "@google/genai";
import type { GeneratorForm, Course, Module, Quiz } from '../types';
import { translations } from "../utils/translations";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 1000): Promise<T> => {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const isOverloaded = error.toString().includes('503') || error.toString().toLowerCase().includes('overloaded');

            if (isOverloaded && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.warn(`API is overloaded. Retrying attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
                await sleep(delay);
            } else {
                throw lastError;
            }
        }
    }
    throw lastError;
};

// New multi-step generation process for better reliability
export const generateCourse = async (
  formData: GeneratorForm,
  language: 'pt' | 'en',
  onProgress: (message: string) => void,
  userUid: string,
): Promise<Course> => {
  const langInstruction = language === 'pt' ? 'Portuguese (Portugal)' : 'English';
  const t = translations[language];

  try {
    // === STEP 1: Generate Course Outline ===
    onProgress(t.generator.progress.outline);
    
    const outlineSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            moduleTitles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of 5 to 8 module titles."
            },
            estimatedDuration: { type: Type.STRING },
            conclusion: { type: Type.STRING }
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
    const outlineText = outlineResponse.text.trim().replace(/^```json\s*|```$/g, '');
    const courseOutline = JSON.parse(outlineText);

    const fullCourse: Course = {
      id: crypto.randomUUID(),
      createdBy: userUid,
      title: courseOutline.title,
      description: courseOutline.description,
      modules: [],
      estimatedDuration: courseOutline.estimatedDuration,
      conclusion: courseOutline.conclusion,
    };

    // === STEP 2: Generate Each Module's Content in a Single Call ===
    for (let i = 0; i < courseOutline.moduleTitles.length; i++) {
        const moduleTitle = courseOutline.moduleTitles[i];
        
        const progressMsg = t.generator.progress.module
          .replace('{current}', String(i + 1))
          .replace('{total}', String(courseOutline.moduleTitles.length))
          .replace('{title}', moduleTitle);
        onProgress(progressMsg);
        
        const moduleProperties: any = {
            summary: { type: Type.STRING, description: "A brief, one-sentence summary." },
            detailedContent: { type: Type.STRING, description: "A comprehensive, multi-paragraph explanation formatted with HTML tags (like <strong>, <ul>, <li>) for better readability." },
        };
        const moduleRequired = ["summary", "detailedContent"];
        let exercisePromptPart = "Do not include an exercise or solution.";

        if (formData.includeExercises) {
            moduleProperties.exercise = { type: Type.STRING };
            moduleProperties.exerciseSolution = { type: Type.STRING };
            moduleRequired.push("exercise", "exerciseSolution");
            exercisePromptPart = "Also provide a practical 'exercise' and its corresponding 'exerciseSolution'.";
        }

        const moduleSchema = { type: Type.OBJECT, properties: moduleProperties, required: moduleRequired };

        const modulePrompt = `
          For a course titled "${courseOutline.title}", generate content for the module "${moduleTitle}".
          The target audience is at a ${formData.level} level.
          Provide:
          1. 'summary': A brief, one-sentence overview.
          2. 'detailedContent': A comprehensive, multi-paragraph explanation of the topic. Use basic HTML tags like <strong> for emphasis, <ul> and <li> for lists to structure the content.
          ${exercisePromptPart}
          Respond in ${langInstruction}.
        `;

        const moduleApiCall = () => ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: modulePrompt }] },
            config: { responseMimeType: "application/json", responseSchema: moduleSchema },
        });

        const moduleResponse: GenerateContentResponse = await withRetry(moduleApiCall);
        const moduleText = moduleResponse.text.trim().replace(/^```json\s*|```$/g, '');
        const moduleContent = JSON.parse(moduleText);

        const newModule: Module = {
            title: moduleTitle,
            summary: moduleContent.summary,
            detailedContent: moduleContent.detailedContent,
            exercise: moduleContent.exercise,
            exerciseSolution: moduleContent.exerciseSolution,
            videoState: 'idle',
        };
        
        fullCourse.modules.push(newModule);
    }

    return fullCourse;

  } catch (error) {
    console.error("Error generating course:", error);
    throw error;
  }
};

export const suggestIdeas = async (language: 'pt' | 'en'): Promise<string[]> => {
    const langInstruction = language === 'pt' ? 'Portuguese (Portugal)' : 'English';
    const ideasSchema = {
        type: Type.OBJECT,
        properties: { ideas: { type: Type.ARRAY, items: { type: Type.STRING } } },
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
        const parsed = JSON.parse(response.text.trim().replace(/^```json\s*|```$/g, ''));
        return parsed.ideas;
    } catch (error) {
        console.error("Error suggesting ideas:", error);
        throw error;
    }
};

export const generateModuleVideo = async (module: Module): Promise<string> => {
    const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `Create a short, dynamic summary video for a single course module titled "${module.title}". The module content is about: ${module.summary}. Keep the video focused and engaging, suitable for an e-learning platform.`;

    try {
        const initialApiCall = () => videoAI.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt, config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        });

        let operation: GenerateVideosOperation = await withRetry(initialApiCall);
        
        while (!operation.done) {
            await sleep(10000);
            const pollingApiCall = () => videoAI.operations.getVideosOperation({ operation });
            operation = await withRetry(pollingApiCall);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation succeeded, but no URI was returned.");
        
        return downloadLink;
    } catch (error) {
        console.error("Error generating module video:", error);
        throw error;
    }
};

export const generateQuiz = async (course: Course, language: 'pt' | 'en'): Promise<Quiz> => {
    const langInstruction = language === 'pt' ? 'Portuguese (Portugal)' : 'English';
    const courseContentSummary = course.modules.map(m => `Module "${m.title}": ${m.summary}`).join('\n');

    const quizSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        questionText: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswerIndex: { type: Type.INTEGER }
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
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: quizSchema }
        });
        const response: GenerateContentResponse = await withRetry(apiCall);
        const parsed = JSON.parse(response.text.trim().replace(/^```json\s*|```$/g, ''));
        return parsed as Quiz;
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw error;
    }
}
