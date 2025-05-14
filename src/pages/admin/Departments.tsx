import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { departmentDAO } from '../../lib/dao';
import type { DepartmentWithUserCount } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';

const AdminDepartments = () => {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<DepartmentWithUserCount[]>([]);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const { data, count } = await departmentDAO.getDepartmentsWithUserCount(
          page,
          pageSize,
          'name',
          'asc',
          searchTerm
        );
        
        setDepartments(data);
        setTotalDepartments(count);
      } catch (error) {
        console.error('Erro ao carregar departamentos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDepartments();
  }, [page, searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Resetar para a primeira página ao buscar
  };

  const confirmDelete = async (id: number, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o departamento "${name}"?`)) {
      try {
        const success = await departmentDAO.delete(id);
        if (success) {
          // Recarregar a lista após exclusão bem-sucedida
          const { data, count } = await departmentDAO.getDepartmentsWithUserCount(
            page,
            pageSize,
            'name',
            'asc',
            searchTerm
          );
          
          setDepartments(data);
          setTotalDepartments(count);
        }
      } catch (error) {
        console.error('Erro ao excluir departamento:', error);
        alert('Não foi possível excluir o departamento. Verifique se não há usuários associados.');
      }
    }
  };

  const totalPages = Math.ceil(totalDepartments / pageSize);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departamentos</h1>
          <p className="text-gray-600">Gerencie os departamentos da organização.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            to="/admin/departments/new"
            className="btn-primary"
          >
            Adicionar Departamento
          </Link>
        </div>
      </div>
      
      {/* Busca */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar departamento
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Nome do departamento..."
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
            </div>
          </div>
        </form>
      </div>
      
      {/* Lista de Departamentos */}
      {loading ? (
        <LoadingScreen />
      ) : departments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Nenhum departamento encontrado</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm
              ? 'Tente ajustar os termos de busca.'
              : 'Adicione departamentos para começar.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuários
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Criação
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map(dept => (
                  <tr key={dept.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{dept.user_count} usuários</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(dept.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/admin/departments/${dept.id}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Editar
                      </Link>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => confirmDelete(dept.id, dept.name)}
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
                  // Cálculo similar ao que fizemos em Users.tsx
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

export default AdminDepartments; 