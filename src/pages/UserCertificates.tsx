import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { certificateDAO } from '../lib/dao';
import { useNotification } from '../context/NotificationContext';
import LoadingScreen from '../components/common/LoadingScreen';
import { ArrowDownTrayIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { generateCertificatePDF } from '../lib/certificateGenerator';

interface Certificate {
  id: number;
  user_id: string;
  track_id: number;
  issue_date: string;
  track_name: string;
  track_type?: string;
  track_thumbnail_url?: string;
  downloaded?: boolean;
  download_date?: string;
}

const UserCertificates = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userCertificates = await certificateDAO.getUserCertificates(user.id);
        setCertificates(userCertificates);
      } catch (error) {
        console.error('Erro ao carregar certificados:', error);
        showNotification('error', 'Erro', 'Não foi possível carregar seus certificados.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificates();
  }, [user, showNotification]);

  const handleDownloadCertificate = async (certificateId: number, trackName: string) => {
    try {
      showNotification('info', 'Gerando certificado', 'Seu certificado está sendo gerado, aguarde um momento.');
      
      // Obter o certificado selecionado
      const certificate = certificates.find(cert => cert.id === certificateId);
      
      if (!certificate || !user) {
        throw new Error('Certificado não encontrado');
      }
      
      // Gerar e baixar o PDF do certificado
      await generateCertificatePDF({
        id: certificate.id,
        userName: user.full_name || 'Usuário',
        trackName: certificate.track_name,
        issueDate: certificate.issue_date,
        trackType: certificate.track_type
      });
      
      // Marcar certificado como baixado no banco de dados
      await certificateDAO.markCertificateAsDownloaded(certificateId);
      
      // Atualizar o estado local
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === certificateId 
            ? { ...cert, downloaded: true, download_date: new Date().toISOString() } 
            : cert
        )
      );
      
      showNotification('success', 'Download concluído', `O certificado para "${trackName}" foi baixado com sucesso.`);
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
      showNotification('error', 'Erro no Download', 'Não foi possível baixar o certificado. Tente novamente.');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Certificados</h1>
          <p className="text-gray-600">Visualize e baixe seus certificados conquistados</p>
        </div>
        <Link
          to="/dashboard"
          className="flex items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
          Voltar para Dashboard
        </Link>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum certificado encontrado</h3>
          <p className="mt-1 text-gray-500">
            Complete trilhas de aprendizado para ganhar certificados.
          </p>
          <Link
            to="/dashboard/tracks"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Explorar Trilhas
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(certificate => (
            <div key={certificate.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-400 flex items-center justify-center">
                {certificate.track_thumbnail_url ? (
                  <img 
                    src={certificate.track_thumbnail_url} 
                    alt={certificate.track_name} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {certificate.track_name}
                </h2>
                
                <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                  <div>
                    Emitido em: {new Date(certificate.issue_date).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    {certificate.track_type && (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {certificate.track_type}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleDownloadCertificate(certificate.id, certificate.track_name)}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                    Download PDF
                  </button>
                </div>
                
                {certificate.downloaded && (
                  <div className="mt-2 text-xs text-gray-500 text-right">
                    Baixado em: {certificate.download_date ? new Date(certificate.download_date).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserCertificates; 