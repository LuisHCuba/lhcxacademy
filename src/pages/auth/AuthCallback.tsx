import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../../components/common/LoadingScreen';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Função para processar o callback de autenticação
    const handleAuthCallback = async () => {
      try {
        // Processa o callback da autenticação do Supabase
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro no callback de autenticação:', error);
          setError('Ocorreu um erro ao processar a autenticação. Por favor, tente novamente.');
          // Redirecionar para login após alguns segundos
          setTimeout(() => {
            navigate('/auth/login', { replace: true });
          }, 3000);
          return;
        }
        
        // Se estiver na página de redefinição de senha, redirecionar para essa página
        const hash = window.location.hash;
        if (hash.includes('type=recovery')) {
          navigate('/auth/reset-password', { replace: true });
          return;
        }
        
        // Do contrário, redirecionar para o dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Erro ao processar callback:', err);
        setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
        // Redirecionar para login após alguns segundos
        setTimeout(() => {
          navigate('/auth/login', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Erro de Autenticação</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecionando para a página de login...</p>
          </div>
        </div>
      </div>
    );
  }

  return <LoadingScreen />;
};

export default AuthCallback; 