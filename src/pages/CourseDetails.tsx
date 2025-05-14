import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/common/LoadingScreen';

/**
 * Este componente é um redirecionador para manter compatibilidade com URLs antigas.
 * O sistema foi adaptado para usar trilhas em vez de cursos, seguindo o esquema SQL.
 */
const CourseDetails = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona para a página de trilhas correspondente
    // Assumimos que courseId e trackId são equivalentes na migração
    navigate(`/dashboard/tracks/${courseId}`, { replace: true });
  }, [courseId, navigate]);

  return <LoadingScreen />;
};

export default CourseDetails; 