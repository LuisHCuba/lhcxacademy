import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// Carrega as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente do Supabase não estão configuradas. Verifique o arquivo .env');
}

// Cria e exporta o cliente do Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Função de utilidade para verificar e renovar sessão
export const refreshSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  // Verifica se o token está prestes a expirar
  const expiresAt = session?.expires_at ?? 0;
  const isExpired = expiresAt * 1000 < Date.now() + 60 * 1000; // 1 minuto antes de expirar
  
  if (isExpired) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Erro ao renovar a sessão:', error);
      return null;
    }
    return data.session;
  }
  
  return session;
}; 