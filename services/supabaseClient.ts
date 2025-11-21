
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURAÇÃO DA SUPABASE
// 1. Vá a https://supabase.com/dashboard
// 2. Entre no seu projeto e vá a Project Settings -> API.
// 3. Copie o "Project URL" e a "anon public" Key e cole abaixo.
// ------------------------------------------------------------------

// As suas chaves configuradas:
const supabaseUrl = process.env.SUPABASE_URL || 'https://gpqkmehibjpspyvpllbi.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcWttZWhpYmpwc3B5dnBsbGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzc2MjcsImV4cCI6MjA3OTIxMzYyN30.a056HsX0UGVLFXzd8lL5cSRactGwUoE043wh56sVVHM';

// Verifica se as chaves parecem válidas (não são placeholders genéricos)
export const isSupabaseConfigured = () => {
    return supabaseUrl.includes('supabase.co') && 
           !supabaseUrl.includes('placeholder') && 
           !supabaseUrl.includes('INSERT_YOUR_URL');
};

// Evita erros fatais se a URL não for válida durante a inicialização
const getValidUrl = (url: string) => {
    try {
        if (!url.startsWith('http')) return 'https://placeholder.supabase.co';
        new URL(url);
        return url;
    } catch {
        return 'https://placeholder.supabase.co';
    }
};

export const supabase = createClient(
    getValidUrl(supabaseUrl),
    supabaseKey
);
