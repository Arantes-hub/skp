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

declare module "@google/genai" {
  export class GoogleGenAI {
    constructor(config: { apiKey: string });
    models: any;
    chats: any;
    operations: any;
    live: any;
  }
  export const Type: any;
  export type GenerateContentResponse = any;
  export type GenerateVideosOperation = any;
  export type FunctionDeclaration = any;
  export enum Modality {
      AUDIO = 'AUDIO',
      TEXT = 'TEXT',
      IMAGE = 'IMAGE',
      VIDEO = 'VIDEO'
  }
}