import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trackDAO } from '../../lib/dao';
import type { TrackWithExtras } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

const AdminTracks = () => {
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<TrackWithExtras[]>([]);
  const [totalTracks, setTotalTracks] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const { data, count } = await trackDAO.getTracks(
          page,
          pageSize,
          'name',
          'asc',
          searchTerm
        );
        
        setTracks(data);
        setTotalTracks(count);
      } catch (error) {
        console.error('Erro ao carregar trilhas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTracks();
  }, [page, searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Resetar para a primeira página ao buscar
  };

  const confirmDelete = async (id: number, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a trilha "${name}"?`)) {
      try {
        const success = await trackDAO.delete(id);
        if (success) {
          // Recarregar a lista após exclusão bem-sucedida
          const { data, count } = await trackDAO.getTracks(
            page,
            pageSize,
            'name',
            'asc',
            searchTerm
          );
          
          setTracks(data);
          setTotalTracks(count);
        }
      } catch (error) {
        console.error('Erro ao excluir trilha:', error);
        alert('Não foi possível excluir a trilha. Verifique se não há conteúdos ou atribuições associadas.');
      }
    }
  };

  const totalPages = Math.ceil(totalTracks / pageSize);

  const getTrackTypeLabel = (type: string) => {
    switch (type) {
      case 'track': return 'Trilha';
      case 'pill': return 'Pílula';
      case 'grid': return 'Grid';
      default: return type;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trilhas de Aprendizado</h1>
          <p className="text-gray-500">Gerencie trilhas, pílulas e grids de conteúdo</p>
        </div>
        <Link 
          to="/admin/tracks/new"
          className="btn-primary flex items-center"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Nova Trilha
        </Link>
      </div>
      
      {/* Barra de busca */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Buscar por nome ou descrição"
              className="input-field w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Buscar
          </button>
        </form>
      </div>
      
      {/* Lista de trilhas */}
      {loading ? (
        <LoadingScreen />
      ) : tracks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Nenhuma trilha encontrada</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm
              ? 'Tente ajustar os termos de busca.'
              : 'Adicione trilhas para começar.'}
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
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lições
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tracks.map(track => (
                  <tr key={track.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{track.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{track.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getTrackTypeLabel(track.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {track.lessons_count || 0} lições
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/admin/tracks/${track.id}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Editar
                      </Link>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => confirmDelete(track.id, track.name)}
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

export default AdminTracks; 