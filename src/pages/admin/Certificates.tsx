import { useState, useEffect } from 'react';
import { certificateDAO, userDAO, trackDAO } from '../../lib/dao';
import type { Certificate, User, Track } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';
import { PlusCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { generateCertificatePDF } from '../../lib/certificateGenerator';
import { useNotification } from '../../context/NotificationContext';

interface CertificateWithDetails extends Certificate {
  user?: User;
  track?: Track;
}

const AdminCertificates = () => {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([]);
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const { showNotification } = useNotification();
  const pageSize = 10;

  // Carregar usuários e trilhas para o modal de emissão
  useEffect(() => {
    const loadUsersAndTracks = async () => {
      try {
        const usersData = await userDAO.getAll();
        setUsers(usersData);

        const { data: tracksData } = await trackDAO.getTracks(1, 100);
        setTracks(tracksData);
      } catch (error) {
        console.error('Erro ao carregar usuários e trilhas:', error);
      }
    };

    loadUsersAndTracks();
  }, []);

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      try {
        // Consulta base para certificados
        let query = supabase
          .from('certificates')
          .select('*', { count: 'exact' })
          .order('issue_date', { ascending: false });

        // Aplicar filtros de busca
        if (searchTerm) {
          // Infelizmente não podemos buscar diretamente em relacionamentos, 
          // então vamos fazer após buscar os dados
        }

        // Paginação
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
          throw error;
        }

        // Buscar dados dos usuários e trilhas relacionados
        const certificatesWithDetails: CertificateWithDetails[] = [];
        
        for (const cert of data || []) {
          // Buscar dados do usuário
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', cert.user_id)
            .single();

          // Buscar dados da trilha
          const { data: trackData } = await supabase
            .from('tracks')
            .select('*')
            .eq('id', cert.track_id)
            .single();

          certificatesWithDetails.push({
            ...cert,
            user: userData || undefined,
            track: trackData || undefined
          });
        }

        // Filtrar pelo termo de busca
        let filteredData = certificatesWithDetails;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredData = filteredData.filter(cert => 
            cert.user?.full_name?.toLowerCase().includes(term) || 
            cert.user?.email?.toLowerCase().includes(term) ||
            cert.track?.name?.toLowerCase().includes(term)
          );
        }
        
        setCertificates(filteredData);
        setTotalCertificates(count || 0);
      } catch (error) {
        console.error('Erro ao carregar certificados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificates();
  }, [page, searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Resetar para a primeira página ao buscar
  };

  const handleIssueCertificate = () => {
    setShowModal(true);
  };

  const handleSubmitCertificate = async () => {
    if (!selectedUserId || !selectedTrackId) {
      alert('Selecione um usuário e uma trilha para emitir o certificado');
      return;
    }

    try {
      const success = await certificateDAO.issueCertificate(
        selectedUserId,
        selectedTrackId
      );

      if (success) {
        alert('Certificado emitido com sucesso!');
        setShowModal(false);
        setSelectedUserId('');
        setSelectedTrackId(null);
        
        // Recarregar a lista
        setPage(1);
      } else {
        alert('Erro ao emitir certificado. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao emitir certificado:', error);
      alert('Erro ao emitir certificado. Tente novamente.');
    }
  };

  const handleDownloadCertificate = async (certificateId: number) => {
    try {
      // Encontrar o certificado no estado atual
      const certificate = certificates.find(cert => cert.id === certificateId);
      
      if (!certificate || !certificate.user || !certificate.track) {
        showNotification('error', 'Erro', 'Dados do certificado incompletos. Atualize a página e tente novamente.');
        return;
      }
      
      showNotification('info', 'Gerando certificado', 'O certificado está sendo gerado, aguarde um momento.');
      
      // Gerar e baixar o PDF do certificado
      await generateCertificatePDF({
        id: certificate.id,
        userName: certificate.user.full_name || 'Usuário',
        trackName: certificate.track.name,
        issueDate: certificate.issue_date,
        userEmail: certificate.user.email,
        trackType: certificate.track.type
      });
      
      // Marcar certificado como baixado
      await supabase
        .from('certificates')
        .update({ downloaded: true, download_date: new Date().toISOString() })
        .eq('id', certificateId);
      
      // Atualizar o estado
      setCertificates(prevCerts => 
        prevCerts.map(cert => 
          cert.id === certificateId 
            ? { ...cert, downloaded: true, download_date: new Date().toISOString() } 
            : cert
        )
      );
      
      showNotification('success', 'Download concluído', 'O certificado foi baixado com sucesso.');
    } catch (error) {
      console.error('Erro ao fazer download do certificado:', error);
      showNotification('error', 'Erro', 'Não foi possível baixar o certificado. Tente novamente.');
    }
  };

  const handleRevokeCertificate = async (certificateId: number) => {
    if (window.confirm('Tem certeza que deseja revogar este certificado? Esta ação não pode ser desfeita.')) {
      try {
        const success = await certificateDAO.delete(certificateId);
        
        if (success) {
          alert('Certificado revogado com sucesso!');
          
          // Atualizar a lista sem recarregar a página
          setCertificates(prevCerts => prevCerts.filter(cert => cert.id !== certificateId));
          setTotalCertificates(prev => prev - 1);
        } else {
          alert('Erro ao revogar certificado. Tente novamente.');
        }
      } catch (error) {
        console.error('Erro ao revogar certificado:', error);
        alert('Erro ao revogar certificado. Tente novamente.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const totalPages = Math.ceil(totalCertificates / pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificados</h1>
          <p className="text-gray-500">Gerencie certificados emitidos na plataforma</p>
        </div>
        <button 
          onClick={handleIssueCertificate}
          className="btn-primary flex items-center"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Emitir Certificado
        </button>
      </div>
      
      {/* Barra de busca */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Buscar por usuário ou trilha"
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
      
      {/* Lista de certificados */}
      {loading ? (
        <LoadingScreen />
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Nenhum certificado encontrado</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm
              ? 'Tente ajustar os termos de busca.'
              : 'Nenhum certificado foi emitido ainda.'}
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
                    Trilha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Emissão
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map(certificate => (
                  <tr key={certificate.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {certificate.user?.full_name || 'Usuário não encontrado'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {certificate.user?.email || certificate.user_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {certificate.track?.name || 'Trilha não encontrada'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(certificate.issue_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-primary-600 hover:text-primary-900 mr-4 inline-flex items-center"
                        onClick={() => handleDownloadCertificate(certificate.id)}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleRevokeCertificate(certificate.id)}
                      >
                        Revogar
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

      {/* Modal de emissão de certificado */}
      {showModal && (
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Emitir Novo Certificado
                    </h3>
                    <div className="mt-2">
                      <div className="mb-4">
                        <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                          Usuário
                        </label>
                        <select 
                          id="user" 
                          className="input-field w-full"
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                          <option value="">Selecione um usuário</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-4">
                        <label htmlFor="track" className="block text-sm font-medium text-gray-700 mb-1">
                          Trilha
                        </label>
                        <select 
                          id="track" 
                          className="input-field w-full"
                          value={selectedTrackId || ''}
                          onChange={(e) => setSelectedTrackId(e.target.value ? parseInt(e.target.value) : null)}
                        >
                          <option value="">Selecione uma trilha</option>
                          {tracks.map(track => (
                            <option key={track.id} value={track.id}>{track.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="btn-primary sm:ml-3"
                  onClick={handleSubmitCertificate}
                >
                  Emitir Certificado
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCertificates; 