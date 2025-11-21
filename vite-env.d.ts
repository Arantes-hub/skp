// Reference to vite/client removed as it is missing in the environment
// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
  }
}

interface Window {
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}

// Mock type definitions for @google/genai to satisfy TypeScript build
// The actual implementation is loaded via CDN in index.html
declare module '@google/genai' {
  export class GoogleGenAI {
    constructor(config: { apiKey: string });
    models: {
      generateContent: (params: any) => Promise<GenerateContentResponse>;
      generateVideos: (params: any) => Promise<GenerateVideosOperation>;
      generateImages: (params: any) => Promise<any>;
    };
    operations: {
      getVideosOperation: (params: { operation: GenerateVideosOperation }) => Promise<GenerateVideosOperation>;
    };
    chats: {
        create: (config: any) => any;
    };
  }

  export enum Type {
    TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    INTEGER = 'INTEGER',
    BOOLEAN = 'BOOLEAN',
    ARRAY = 'ARRAY',
    OBJECT = 'OBJECT',
    NULL = 'NULL'
  }

  export interface GenerateContentResponse {
    text: string;
    candidates?: Array<{
      content: {
        parts: Array<{ text?: string; inlineData?: any }>;
      };
      groundingMetadata?: any;
    }>;
  }

  export interface GenerateVideosOperation {
    done: boolean;
    response?: {
        generatedVideos?: Array<{
            video?: {
                uri: string;
            }
        }>
    }
  }
}
