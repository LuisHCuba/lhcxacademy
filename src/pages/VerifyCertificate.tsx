import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateDAO } from '../lib/dao';
import { supabase } from '../lib/supabase';
import LoadingScreen from '../components/common/LoadingScreen';
import { ArrowUturnLeftIcon, CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface CertificateDetails {
  id: number;
  user_full_name: string;
  track_name: string;
  issue_date: string;
  is_valid: boolean;
}

const VerifyCertificate = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CertificateDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      if (!id) {
        setError('ID do certificado não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const certificateId = parseInt(id);
        
        if (isNaN(certificateId)) {
          setError('ID do certificado inválido');
          return;
        }

        // Buscar certificado no banco de dados
        const certificateData = await certificateDAO.getById(certificateId);
        
        if (!certificateData) {
          setError('Certificado não encontrado');
          return;
        }

        // Buscar detalhes adicionais (nome do usuário e nome da trilha)
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', certificateData.user_id)
          .single();

        const { data: trackData } = await supabase
          .from('tracks')
          .select('name')
          .eq('id', certificateData.track_id)
          .single();

        setCertificate({
          id: certificateData.id,
          user_full_name: userData?.full_name || 'Usuário não encontrado',
          track_name: trackData?.name || 'Trilha não encontrada',
          issue_date: certificateData.issue_date,
          is_valid: true
        });
      } catch (error) {
        console.error('Erro ao verificar certificado:', error);
        setError('Erro ao verificar o certificado. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [id]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Verificação de Certificado</h1>
          <p className="mt-2 text-gray-600">
            Confira a autenticidade do certificado
          </p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <XCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Certificado Inválido</h3>
              <p className="mt-2 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                >
                  <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Link>
              </div>
            </div>
          ) : certificate ? (
            <div className="p-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckBadgeIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-center text-gray-900">Certificado Válido</h3>
              
              <div className="mt-6 border-t border-gray-200 pt-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID do Certificado</dt>
                    <dd className="mt-1 text-sm text-gray-900">{certificate.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Participante</dt>
                    <dd className="mt-1 text-sm text-gray-900">{certificate.user_full_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Curso</dt>
                    <dd className="mt-1 text-sm text-gray-900">{certificate.track_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Data de Emissão</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(certificate.issue_date).toLocaleDateString('pt-BR')}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Link>
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>GoAcademy - Plataforma de Aprendizado Corporativo</p>
          <p className="mt-1">© {new Date().getFullYear()} Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;