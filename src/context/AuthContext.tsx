import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase, refreshSession } from '../lib/supabase';
import type { User, AuthContextType } from '../types/app';

// Cria o contexto com um valor padrão
const AuthContext = createContext<AuthContextType | null>(null);

// Provedor do contexto de autenticação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para inicializar o usuário a partir da sessão
  const initializeUser = async () => {
    try {
      setLoading(true);
      
      // Obtem a sessão atual
      const session = await refreshSession();
      
      if (!session) {
        setUser(null);
        return;
      }

      // Busca os dados completos do usuário
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        setUser(null);
        return;
      }

      setUser(userData as User);
    } catch (error) {
      console.error('Erro ao inicializar usuário:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer login
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        return { error };
      }

      await initializeUser();
      return { error: null };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { error: error as Error };
    }
  };

  // Função para cadastrar novo usuário
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Registra o usuário na autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('Erro no cadastro:', authError);
        return { error: authError, user: null };
      }

      if (!authData.user) {
        return { error: new Error('Falha ao criar usuário'), user: null };
      }

      // Cria o perfil do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role: 'collaborator',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) {
        console.error('Erro ao criar perfil do usuário:', userError);
        return { error: userError, user: null };
      }

      await initializeUser();
      return { error: null, user: userData as User };
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      return { error: error as Error, user: null };
    }
  };

  // Função para fazer logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função para resetar senha
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Erro ao solicitar redefinição de senha:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      return { error: error as Error };
    }
  };

  // Função para atualizar senha
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error('Erro ao atualizar senha:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      return { error: error as Error };
    }
  };

  // Configuração de escuta para mudanças na autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          initializeUser();
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Inicializa o usuário ao montar o componente
    initializeUser();

    // Limpa a inscrição ao desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Valor do contexto
  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook para acessar o contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 