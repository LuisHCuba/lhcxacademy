import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userDAO, departmentDAO } from '../../lib/dao';
import type { User, Department, UserFilters } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';

type UserWithDepartment = User & {
  department?: Department | null;
};

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithDepartment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const depts = await departmentDAO.getAll();
        setDepartments(depts);
      } catch (error) {
        console.error('Erro ao carregar departamentos:', error);
      }
    };
    
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Aplicar filtros de busca
        const searchFilters: UserFilters = { ...filters };
        if (searchTerm) {
          searchFilters.search = searchTerm;
        }
        
        // Buscar usuários com filtros, paginação e ordenação
        const { data, count } = await userDAO.getUsers(
          page,
          pageSize,
          'full_name',
          'asc',
          searchFilters
        );
        
        setUsers(data);
        setTotalUsers(count);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [page, filters, searchTerm]);

  const handleFilterChange = (key: string, value: string | number | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1); // Resetar para a primeira página ao filtrar
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // A busca é acionada pelo useEffect quando searchTerm muda
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Administrador</span>;
      case 'instructor':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Instrutor</span>;
      case 'collaborator':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Colaborador</span>;
      default:
        return null;
    }
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie os usuários da plataforma.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            to="/admin/users/new"
            className="btn-primary"
          >
            Adicionar Usuário
          </Link>
        </div>
      </div>
      
      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro de Papel */}
          <div>
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Papel
            </label>
            <select
              id="role-filter"
              className="input-field"
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value || null)}
            >
              <option value="">Todos</option>
              <option value="admin">Administrador</option>
              <option value="instructor">Instrutor</option>
              <option value="collaborator">Colaborador</option>
            </select>
          </div>
          
          {/* Filtro de Departamento */}
          <div>
            <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <select
              id="department-filter"
              className="input-field"
              value={filters.department_id?.toString() || ''}
              onChange={(e) => handleFilterChange('department_id', e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Todos</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          
          {/* Campo de Busca */}
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                id="search"
                placeholder="Nome ou email..."
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
      
      {/* Lista de Usuários */}
      {loading ? (
        <LoadingScreen />
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Nenhum usuário encontrado</h3>
          <p className="mt-1 text-gray-500">
            {Object.keys(filters).length > 0 || searchTerm
              ? 'Tente ajustar os filtros ou termos de busca.'
              : 'Adicione usuários para começar.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Papel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar_url ? (
                            <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.department?.name || 'Não especificado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/admin/users/${user.id}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Editar
                      </Link>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
                            // Implementar lógica de exclusão
                            alert('Funcionalidade de exclusão a implementar');
                          }
                        }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default AdminUsers; 