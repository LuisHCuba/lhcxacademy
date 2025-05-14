import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentDAO } from '../lib/dao';
import type { AssignmentWithDetails } from '../types/app';
import LoadingScreen from '../components/common/LoadingScreen';

const UserAssignments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, count } = await assignmentDAO.getUserAssignments(
          user.id,
          page,
          pageSize,
          'due_date',
          'asc',
          statusFilter === 'all' ? undefined : statusFilter as any
        );
        
        setAssignments(data);
        setTotalAssignments(count);
      } catch (error) {
        console.error('Erro ao carregar atribuições:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignments();
  }, [user, page, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Não iniciado</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Em andamento</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800">Concluído</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Expirado</span>;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string, date: string) => {
    const dueDate = new Date(date);
    const today = new Date();
    const isExpired = dueDate < today && status !== 'completed';
    
    if (isExpired) return "border-red-200 bg-red-50";
    
    switch (status) {
      case 'not_started':
        return "border-gray-200";
      case 'in_progress':
        return "border-amber-200 bg-amber-50";
      case 'completed':
        return "border-emerald-200 bg-emerald-50";
      default:
        return "border-gray-200";
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Se for hoje
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    
    // Se for amanhã
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Amanhã';
    }
    
    // Caso contrário, retorna a data formatada
    return date.toLocaleDateString('pt-BR');
  };

  const totalPages = Math.ceil(totalAssignments / pageSize);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Atividades</h1>
        <p className="text-gray-600">Gerencie suas atividades atribuídas.</p>
      </div>
      
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-md ${!statusFilter || statusFilter === 'all' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setStatusFilter('not_started')}
            className={`px-3 py-1.5 text-sm rounded-md ${statusFilter === 'not_started' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'}`}
          >
            Não iniciadas
          </button>
          <button 
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 text-sm rounded-md ${statusFilter === 'in_progress' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'}`}
          >
            Em andamento
          </button>
          <button 
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 text-sm rounded-md ${statusFilter === 'completed' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'}`}
          >
            Concluídas
          </button>
          <button 
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 text-sm rounded-md ${statusFilter === 'expired' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'}`}
          >
            Expiradas
          </button>
        </div>
      </div>
      
      {/* Lista de atividades */}
      {loading ? (
        <LoadingScreen />
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Nenhuma atividade encontrada</h3>
          <p className="mt-1 text-gray-500">
            {statusFilter 
              ? 'Não há atividades que correspondam ao filtro selecionado.' 
              : 'Você não tem nenhuma atividade atribuída no momento.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {assignments.map(assignment => (
                <div 
                  key={assignment.id} 
                  className={`p-4 border-l-4 ${getStatusClass(assignment.status, assignment.due_date)}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {assignment.track?.name || 'Atividade Geral'}
                        </h3>
                        {getStatusBadge(assignment.status)}
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-500">
                        {assignment.department?.name && (
                          <span className="mr-3">Departamento: {assignment.department.name}</span>
                        )}
                        <span>Início: {new Date(assignment.start_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-500">Prazo</div>
                        <div className={`text-sm ${
                          new Date(assignment.due_date) < new Date() && assignment.status !== 'completed'
                            ? 'text-red-600 font-medium'
                            : 'text-gray-900'
                        }`}>
                          {formatDueDate(assignment.due_date)}
                        </div>
                      </div>
                      
                      {assignment.track && (
                        <Link
                          to={`/dashboard/tracks/${assignment.track.id}`}
                          className="btn-primary py-1.5 px-3 text-sm"
                        >
                          Ver Trilha
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // Calcular o número da página para mostrar 5 páginas ao redor da página atual
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${page === pageNum ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="sr-only">Próxima</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserAssignments; 