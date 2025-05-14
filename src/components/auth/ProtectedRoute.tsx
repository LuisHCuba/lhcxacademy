import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../common/LoadingScreen';

type ProtectedRouteProps = {
  allowedRoles?: ('admin' | 'instructor' | 'collaborator')[];
};

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Enquanto verifica a autenticação, mostra tela de carregamento
  if (loading) {
    return <LoadingScreen />;
  }

  // Se não estiver autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Se tiver restrição de papel e o usuário não tiver o papel permitido
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  // Se tudo estiver ok, renderiza as rotas filhas
  return <Outlet />;
};

export default ProtectedRoute; 