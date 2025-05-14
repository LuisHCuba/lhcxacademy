import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assignmentDAO, userDAO, trackDAO, departmentDAO } from '../../lib/dao';
import type { AssignmentWithDetails, Department, TrackWithExtras } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

const AdminAssignments = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tracks, setTracks] = useState<TrackWithExtras[]>([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department_id: '',
    track_id: '',
    status: ''
  });
  const pageSize = 10;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const deps = await departmentDAO.getAll();
        setDepartments(deps);
      } catch (error) {
        console.error('Erro ao carregar departamentos:', error);
      }
    };

    const fetchTracks = async () => {
      try {
        const { data } = await trackDAO.getTracks(1, 100); // Buscar até 100 trilhas
        setTracks(data);
      } catch (error) {
        console.error('Erro ao carregar trilhas:', error);
      }
    };

    fetchDepartments();
    fetchTracks();
  }, []);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        // Construir objeto de filtros
        const assignmentFilters: any = {};
        if (filters.department_id) assignmentFilters.department_id = parseInt(filters.department_id);
        if (filters.track_id) assignmentFilters.track_id = parseInt(filters.track_id);
        if (filters.status) assignmentFilters.status = filters.status;

        const { data, count } = await assignmentDAO.getAssignmentsWithDetails(
          page,
          pageSize,
          'due_date',
          'asc',
          searchTerm,
          assignmentFilters
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
  }, [page, searchTerm, filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Resetar para a primeira página ao buscar
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1); // Resetar para a primeira página ao filtrar
  };

  const confirmDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta atribuição?')) {
      try {
        const success = await assignmentDAO.delete(id);
        if (success) {
          // Recarregar a lista após exclusão bem-sucedida
          const assignmentFilters: any = {};
          if (filters.department_id) assignmentFilters.department_id = parseInt(filters.department_id);
          if (filters.track_id) assignmentFilters.track_id = parseInt(filters.track_id);
          if (filters.status) assignmentFilters.status = filters.status;

          const { data, count } = await assignmentDAO.getAssignmentsWithDetails(
            page,
            pageSize,
            'due_date',
            'asc',
            searchTerm,
            assignmentFilters
          );
          
          setAssignments(data);
          setTotalAssignments(count);
        }
      } catch (error) {
        console.error('Erro ao excluir atribuição:', error);
        alert('Não foi possível excluir a atribuição. Tente novamente.');
      }
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return { label: 'Não iniciado', color: 'bg-gray-100 text-gray-800' };
      case 'in_progress': return { label: 'Em andamento', color: 'bg-amber-100 text-amber-800' };
      case 'completed': return { label: 'Concluído', color: 'bg-green-100 text-green-800' };
      case 'expired': return { label: 'Expirado', color: 'bg-red-100 text-red-800' };
      default: return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const totalPages = Math.ceil(totalAssignments / pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atribuições</h1>
          <p className="text-gray-500">Gerencie trilhas atribuídas a usuários e departamentos</p>
        </div>
        <Link 
          to="/admin/assignments/new"
          className="btn-primary flex items-center"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Nova Atribuição
        </Link>
      </div>
      
      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Filtro de Departamento */}
          <div>
            <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <select
              id="department-filter"
              className="input-field"
              value={filters.department_id}
              onChange={(e) => handleFilterChange('department_id', e.target.value)}
            >
              <option value="">Todos</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Trilha */}
          <div>
            <label htmlFor="track-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Trilha
            </label>
            <select
              id="track-filter"
              className="input-field"
              value={filters.track_id}
              onChange={(e) => handleFilterChange('track_id', e.target.value)}
            >
              <option value="">Todas</option>
              {tracks.map(track => (
                <option key={track.id} value={track.id}>{track.name}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Status */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              className="input-field"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="not_started">Não iniciado</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluído</option>
              <option value="expired">Expirado</option>
            </select>
          </div>
          
          {/* Campo de Busca */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                id="search"
                placeholder="Buscar atribuições..."
                className="input-field pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 px-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Lista de atribuições */}
      {loading ? (
        <LoadingScreen />
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Nenhuma atribuição encontrada</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm || filters.department_id || filters.track_id || filters.status
              ? 'Tente ajustar os filtros ou termos de busca.'
              : 'Adicione atribuições para começar.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trilha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atribuído a
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map(assignment => {
                  const status = getStatusLabel(assignment.status);
                  return (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.track?.name || 'Trilha não encontrada'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignment.user_id ? (
                          <div className="text-sm text-gray-500">Usuário específico</div>
                        ) : assignment.department ? (
                          <div className="text-sm text-gray-500">
                            Departamento: {assignment.department.name}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Não atribuído</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(assignment.start_date)} - {formatDate(assignment.due_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/admin/assignments/${assignment.id}`}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Editar
                        </Link>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => confirmDelete(assignment.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    page === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Anterior</span>
                  &lsaquo;
                </button>
                
                {/* Botões de página */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  // Lógica para mostrar páginas ao redor da página atual
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (page <= 3) {
                    pageNum = idx + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = page - 2 + idx;
                  }
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        page === pageNum
                          ? 'bg-primary-50 text-primary-600 z-10'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    page === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Próxima</span>
                  &rsaquo;
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAssignments; 