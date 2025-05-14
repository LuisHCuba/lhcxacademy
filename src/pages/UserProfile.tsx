import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { userDAO, certificateDAO, departmentDAO } from '../lib/dao';
import { useNotification } from '../context/NotificationContext';
import type { User, Certificate, Department } from '../types/app';
import LoadingScreen from '../components/common/LoadingScreen';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// Schema para validação
const userProfileSchema = z.object({
  full_name: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  avatar_url: z.string().nullable().optional()
});

type UserProfileFormData = z.infer<typeof userProfileSchema>;

const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [certificates, setCertificates] = useState<(Certificate & { track_name: string })[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema)
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Carregar certificados do usuário
        const userCertificates = await certificateDAO.getUserCertificates(user.id);
        setCertificates(userCertificates);
        
        // Buscar informações do departamento se o usuário tiver um
        if (user.department_id) {
          const departmentData = await departmentDAO.getById(user.department_id);
          setDepartment(departmentData);
        }
        
        // Preencher formulário com dados do usuário
        setValue('full_name', user.full_name);
        setValue('email', user.email);
        setValue('avatar_url', user.avatar_url);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setErrorMessage('Não foi possível carregar seus dados. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, setValue]);

  const onSubmit = async (data: UserProfileFormData) => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Atualizar dados do usuário
      const updatedUser = await userDAO.update(user.id, {
        full_name: data.full_name,
        avatar_url: data.avatar_url
      });
      
      if (updatedUser) {
        setSuccessMessage('Perfil atualizado com sucesso!');
        
        // Limpar mensagem após 3 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setErrorMessage('Não foi possível atualizar seu perfil. Tente novamente mais tarde.');
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCertificate = async (certificateId: number, trackName: string) => {
    try {
      // Em uma implementação real, aqui seria gerado o PDF do certificado
      // Para essa demonstração, apenas mostramos uma notificação
      
      showNotification('success', 'Download Iniciado', `O certificado para "${trackName}" está sendo baixado.`);
      
      // Marcar certificado como baixado
      await certificateDAO.markCertificateAsDownloaded(certificateId);
      
      // Atualizar o estado local
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === certificateId 
            ? { ...cert, downloaded: true, download_date: new Date().toISOString() } 
            : cert
        )
      );
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
      showNotification('error', 'Erro no Download', 'Não foi possível baixar o certificado. Tente novamente.');
    }
  };

  if (authLoading || loading) return <LoadingScreen />;
  if (!user) return <div className="p-8 text-center">Usuário não encontrado.</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Coluna do perfil */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>
            
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
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label className="form-label" htmlFor="full_name">
                  Nome Completo
                </label>
                <input
                  id="full_name"
                  type="text"
                  className="input-field"
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <div className="error-message">{errors.full_name.message}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="form-label" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  disabled
                  {...register('email')}
                />
                <p className="mt-1 text-sm text-gray-500">O e-mail não pode ser alterado.</p>
              </div>
              
              <div className="mb-6">
                <label className="form-label" htmlFor="avatar_url">
                  URL da Imagem de Perfil
                </label>
                <input
                  id="avatar_url"
                  type="text"
                  className="input-field"
                  placeholder="https://exemplo.com/minha-foto.jpg"
                  {...register('avatar_url')}
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Informações da conta */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informações da Conta</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Papel</p>
                <p className="font-medium">
                  {user.role === 'admin' ? 'Administrador' : 
                   user.role === 'instructor' ? 'Instrutor' : 'Colaborador'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Departamento</p>
                <p className="font-medium">
                  {department ? department.name : 'Não especificado'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Data de Registro</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Coluna dos certificados */}
        <div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Meus Certificados</h2>
              {certificates.length > 3 && (
                <a href="/dashboard/certificates" className="text-sm text-primary-600 hover:text-primary-800">
                  Ver todos
                </a>
              )}
            </div>
            
            {certificates.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">Você ainda não possui certificados.</p>
                <p className="text-gray-500 mt-1">Complete trilhas para receber certificados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.slice(0, 3).map(cert => (
                  <div key={cert.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start">
                      <div className="text-emerald-500 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{cert.track_name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Emitido em {new Date(cert.issue_date).toLocaleDateString('pt-BR')}
                        </p>
                        {cert.downloaded && cert.download_date && (
                          <p className="text-xs text-gray-400 mt-1">
                            Baixado em {new Date(cert.download_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <button 
                        className="inline-flex items-center px-3 py-1 text-sm text-emerald-700 border border-emerald-600 rounded-md hover:bg-emerald-50"
                        onClick={() => handleDownloadCertificate(cert.id, cert.track_name)}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 