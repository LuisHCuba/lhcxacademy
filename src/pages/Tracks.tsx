import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackDAO } from '../lib/dao';
import type { TrackWithProgress, TrackFilters } from '../types/app';
import LoadingScreen from '../components/common/LoadingScreen';

const Tracks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<TrackWithProgress[]>([]);
  const [totalTracks, setTotalTracks] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TrackFilters>({});
  const pageSize = 8;

  useEffect(() => {
    const fetchTracks = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, count } = await trackDAO.getTracksWithProgress(
          user.id,
          page,
          pageSize,
          'name',
          'asc',
          searchTerm,
          filters
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
  }, [user, page, searchTerm, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Resetar para a primeira página ao buscar
  };

  const handleFilterChange = (type: 'track' | 'pill' | 'grid' | null) => {
    setFilters(prev => ({
      ...prev,
      type
    }));
    setPage(1);
  };

  const totalPages = Math.ceil(totalTracks / pageSize);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Trilhas de Aprendizado</h1>
        <p className="text-gray-600">Explore nossas trilhas de conhecimento e aprimores suas habilidades.</p>
      </div>
      
      {/* Barra de busca e filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="w-full md:w-1/2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar trilhas..."
                className="input-field pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </form>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => handleFilterChange(null)} 
              className={`px-3 py-1.5 text-sm rounded-md ${!filters.type ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'}`}
            >
              Todas
            </button>
            <button 
              onClick={() => handleFilterChange('track')} 
              className={`px-3 py-1.5 text-sm rounded-md ${filters.type === 'track' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'}`}
            >
              Trilhas
            </button>
            <button 
              onClick={() => handleFilterChange('pill')} 
              className={`px-3 py-1.5 text-sm rounded-md ${filters.type === 'pill' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'}`}
            >
              Pílulas
            </button>
            <button 
              onClick={() => handleFilterChange('grid')} 
              className={`px-3 py-1.5 text-sm rounded-md ${filters.type === 'grid' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'}`}
            >
              Grids
            </button>
          </div>
        </div>
      </div>
      
      {/* Lista de trilhas */}
      {loading ? (
        <LoadingScreen />
      ) : tracks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Nenhuma trilha encontrada</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm 
              ? `Não encontramos resultados para "${searchTerm}". Tente outra busca.` 
              : 'Você não possui trilhas atribuídas. As trilhas são mostradas apenas quando atribuídas a você ou ao seu departamento.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tracks.map(track => (
              <Link 
                key={track.id} 
                to={`/dashboard/tracks/${track.id}`}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative pb-[60%]">
                  <img 
                    src={track.thumbnail_url || '/placeholder-course.jpg'} 
                    alt={track.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      track.type === 'track' 
                        ? 'bg-blue-100 text-blue-800' 
                        : track.type === 'pill' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {track.type === 'track' ? 'Trilha' : track.type === 'pill' ? 'Pílula' : 'Grid'}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="text-white font-semibold">{track.name}</div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-600">{track.total_videos} vídeos</div>
                    <div className="text-sm font-semibold text-primary-600">{Math.round(track.progress_percentage)}%</div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-primary-600 h-1.5 rounded-full" 
                      style={{ width: `${track.progress_percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600 line-clamp-2">
                    {track.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
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

export default Tracks; 