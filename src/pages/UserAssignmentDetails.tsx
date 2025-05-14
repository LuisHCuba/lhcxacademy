import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentDAO } from '../lib/dao';
import type { AssignmentWithDetails } from '../types/app';
import LoadingScreen from '../components/common/LoadingScreen';

const UserAssignmentDetails = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentWithDetails | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!user || !assignmentId) return;
      
      setLoading(true);
      try {
        // Buscar detalhes da atividade
        const assignmentData = await assignmentDAO.getById(parseInt(assignmentId));
        if (!assignmentData) {
          console.error('Atividade não encontrada');
          setLoading(false);
          return;
        }
        
        // Aqui você também pode buscar detalhes relacionados e complementares
        
        setAssignment(assignmentData as AssignmentWithDetails);
      } catch (error) {
        console.error('Erro ao carregar detalhes da atividade:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignmentDetails();
  }, [user, assignmentId]);

  const handleStatusChange = async (newStatus: 'not_started' | 'in_progress' | 'completed') => {
    if (!user || !assignment) return;
    
    setUpdating(true);
    try {
      // Atualizar status da atividade
      const updatedAssignment = await assignmentDAO.update(assignment.id, {
        status: newStatus
      });
      
      if (updatedAssignment) {
        setAssignment({
          ...assignment,
          status: newStatus
        });
        
        setSuccessMessage('Status atualizado com sucesso!');
        
        // Limpar mensagem após 3 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setErrorMessage('Não foi possível atualizar o status. Tente novamente mais tarde.');
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return <span className="px-2 py-1 text-sm rounded-full bg-gray-100 text-gray-800">Não iniciado</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-sm rounded-full bg-amber-100 text-amber-800">Em andamento</span>;
      case 'completed':
        return <span className="px-2 py-1 text-sm rounded-full bg-emerald-100 text-emerald-800">Concluído</span>;
      case 'expired':
        return <span className="px-2 py-1 text-sm rounded-full bg-red-100 text-red-800">Expirado</span>;
      default:
        return null;
    }
  };

  const isExpired = () => {
    if (!assignment) return false;
    
    const dueDate = new Date(assignment.due_date);
    const today = new Date();
    return dueDate < today && assignment.status !== 'completed';
  };

  const daysRemaining = () => {
    if (!assignment) return 0;
    
    const dueDate = new Date(assignment.due_date);
    const today = new Date();
    
    // Se já passou o prazo, retorna negativo
    if (dueDate < today) {
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return -diffDays;
    }
    
    // Se ainda não passou, retorna positivo
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) return <LoadingScreen />;
  if (!assignment) return <div className="p-8 text-center">Atividade não encontrada.</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link 
          to="/dashboard/assignments"
          className="inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Voltar para Atividades
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {assignment.track?.name || 'Atividade Geral'}
                </h1>
                {getStatusBadge(assignment.status)}
              </div>
              
              {assignment.department?.name && (
                <p className="text-gray-600">
                  Departamento: {assignment.department.name}
                </p>
              )}
            </div>
            
            {assignment.track && (
              <Link
                to={`/dashboard/tracks/${assignment.track.id}`}
                className="btn-primary py-2 px-4 text-sm"
              >
                Ver Trilha
              </Link>
            )}
          </div>
        </div>
        
        {/* Corpo */}
        <div className="p-6">
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {errorMessage}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes da Atividade</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Data de Início</p>
                  <p className="font-medium">
                    {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Prazo</p>
                  <p className={`font-medium ${isExpired() ? 'text-red-600' : ''}`}>
                    {new Date(assignment.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Atribuído por</p>
                  <p className="font-medium">
                    {assignment.created_by || 'Sistema'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Tempo Restante</p>
                  <p className={`font-medium ${
                    daysRemaining() < 0 
                      ? 'text-red-600' 
                      : daysRemaining() <= 3 
                        ? 'text-amber-600' 
                        : 'text-emerald-600'
                  }`}>
                    {daysRemaining() === 0 
                      ? 'Vence hoje!' 
                      : daysRemaining() > 0 
                        ? `${daysRemaining()} dia${daysRemaining() > 1 ? 's' : ''} restante${daysRemaining() > 1 ? 's' : ''}` 
                        : `Vencido há ${Math.abs(daysRemaining())} dia${Math.abs(daysRemaining()) > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Atualizar Status</h2>
              
              <p className="text-gray-600 mb-4">
                Escolha uma das opções abaixo para atualizar o status da sua atividade.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('not_started')}
                  disabled={updating || assignment.status === 'not_started' || isExpired()}
                  className={`px-3 py-2 rounded-md border text-sm font-medium ${
                    assignment.status === 'not_started'
                      ? 'bg-gray-100 text-gray-800 border-gray-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } ${(updating || isExpired()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Não Iniciado
                </button>
                
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={updating || assignment.status === 'in_progress' || isExpired()}
                  className={`px-3 py-2 rounded-md border text-sm font-medium ${
                    assignment.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } ${(updating || isExpired()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Em Andamento
                </button>
                
                <button
                  onClick={() => handleStatusChange('completed')}
                  disabled={updating || assignment.status === 'completed'}
                  className={`px-3 py-2 rounded-md border text-sm font-medium ${
                    assignment.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Concluído
                </button>
              </div>
              
              {isExpired() && assignment.status !== 'completed' && (
                <div className="mt-4 text-sm text-red-600">
                  Esta atividade está vencida. Você ainda pode marcá-la como concluída.
                </div>
              )}
            </div>
          </div>
          
          {/* Detalhes da trilha, se houver */}
          {assignment.track && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalhes da Trilha</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                  {assignment.track.thumbnail_url && (
                    <div className="w-full md:w-48 h-32 overflow-hidden rounded-md">
                      <img 
                        src={assignment.track.thumbnail_url} 
                        alt={assignment.track.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {assignment.track.name}
                    </h3>
                    
                    <p className="text-gray-600 mb-3">
                      {assignment.track.description}
                    </p>
                    
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      assignment.track.type === 'track' 
                        ? 'bg-blue-100 text-blue-800' 
                        : assignment.track.type === 'pill' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {assignment.track.type === 'track' ? 'Trilha' : assignment.track.type === 'pill' ? 'Pílula' : 'Grid'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAssignmentDetails; 