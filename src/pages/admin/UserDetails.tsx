import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { userDAO, departmentDAO, assignmentDAO, certificateDAO } from '../../lib/dao';
import type { User, Department, AssignmentWithDetails, Certificate } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';

// Schema para validação
const userSchema = z.object({
  full_name: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'instructor', 'collaborator']),
  department_id: z.number().nullable(),
  avatar_url: z.string().nullable().optional()
});

type UserFormData = z.infer<typeof userSchema>;

const AdminUserDetails = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [certificates, setCertificates] = useState<(Certificate & { track_name: string })[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  });

  // Determinar se estamos criando um novo usuário ou editando existente
  const isNewUser = userId === 'new';

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
    const fetchUserData = async () => {
      if (isNewUser) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        if (!userId) return;
        
        // Buscar dados do usuário
        const userData = await userDAO.getById(userId);
        if (!userData) {
          navigate('/admin/users');
          return;
        }
        
        // Preencher formulário
        setValue('full_name', userData.full_name);
        setValue('email', userData.email);
        setValue('role', userData.role);
        setValue('department_id', userData.department_id);
        setValue('avatar_url', userData.avatar_url);
        
        // Buscar atribuições do usuário
        const { data: userAssignments } = await assignmentDAO.getUserAssignments(
          userId, 1, 5, 'due_date', 'asc'
        );
        setAssignments(userAssignments);
        
        // Buscar certificados do usuário
        const userCertificates = await certificateDAO.getUserCertificates(userId);
        setCertificates(userCertificates);
        
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setErrorMessage('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, isNewUser, navigate, setValue]);

  const onSubmit = async (data: UserFormData) => {
    setSaving(true);
    try {
      if (isNewUser) {
        // Criar novo usuário
        // Na vida real, precisaríamos gerar uma senha ou enviar convite
        const newUser = await userDAO.create({
          ...data,
          // Valores adicionais necessários para criação
        });
        
        if (newUser) {
          setSuccessMessage('Usuário criado com sucesso!');
          setTimeout(() => {
            navigate(`/admin/users/${newUser.id}`);
          }, 2000);
        }
      } else {
        // Atualizar usuário existente
        const updatedUser = await userDAO.update(userId as string, data);
        
        if (updatedUser) {
          setSuccessMessage('Usuário atualizado com sucesso!');
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setErrorMessage('Erro ao salvar usuário. Tente novamente.');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    // Esta seria uma funcionalidade para resetar a senha do usuário
    // Na implementação real, enviaria um link de redefinição ou geraria uma senha temporária
    alert('Funcionalidade de reset de senha a ser implementada');
  };

  const handleDelete = async () => {
    if (!userId || isNewUser) return;
    
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      try {
        const success = await userDAO.delete(userId);
        
        if (success) {
          setSuccessMessage('Usuário excluído com sucesso!');
          setTimeout(() => {
            navigate('/admin/users');
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        setErrorMessage('Erro ao excluir usuário');
      }
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNewUser ? 'Novo Usuário' : 'Detalhes do Usuário'}
          </h1>
          <p className="text-gray-600">
            {isNewUser 
              ? 'Preencha os campos abaixo para criar um novo usuário'
              : 'Visualize e edite as informações do usuário'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/users"
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </Link>
          {!isNewUser && (
            <button
              type="button"
              onClick={handleDelete}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
      
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
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Informações do Usuário</h2>
            
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="full_name"
                    className="input-field"
                    {...register('full_name')}
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="email"
                    className="input-field"
                    disabled={!isNewUser} // Não permitir edição de email para usuários existentes
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Papel
                </label>
                <div className="mt-1">
                  <select
                    id="role"
                    className="input-field"
                    {...register('role')}
                  >
                    <option value="admin">Administrador</option>
                    <option value="instructor">Instrutor</option>
                    <option value="collaborator">Colaborador</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">
                  Departamento
                </label>
                <div className="mt-1">
                  <select
                    id="department_id"
                    className="input-field"
                    {...register('department_id', {
                      setValueAs: (value) => value === '' ? null : parseInt(value)
                    })}
                  >
                    <option value="">Selecione um departamento</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.department_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.department_id.message}</p>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700">
                  URL da Imagem de Perfil
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="avatar_url"
                    className="input-field"
                    placeholder="https://exemplo.com/avatar.jpg"
                    {...register('avatar_url')}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {!isNewUser && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Segurança</h2>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  Resetar Senha
                </button>
                <p className="mt-1 text-sm text-gray-500">
                  Isso enviará um link de redefinição de senha para o email do usuário.
                </p>
              </div>
            </div>
          )}
          
          <div className="px-6 py-4 bg-gray-50 text-right">
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              {saving ? 'Salvando...' : isNewUser ? 'Criar Usuário' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Seções adicionais para usuários existentes */}
      {!isNewUser && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Atividades recentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Atividades Atribuídas</h3>
            </div>
            <div className="px-6 py-5">
              {assignments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma atividade atribuída a este usuário.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {assignments.map(assignment => (
                    <li key={assignment.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {assignment.track?.name || 'Atividade Geral'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Prazo: {new Date(assignment.due_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          assignment.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : assignment.status === 'expired'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assignment.status === 'completed' 
                            ? 'Concluída' 
                            : assignment.status === 'expired'
                              ? 'Expirada'
                              : assignment.status === 'in_progress' 
                                ? 'Em Andamento' 
                                : 'Não Iniciada'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {assignments.length > 0 && (
                <div className="mt-4 text-right">
                  <Link
                    to={`/admin/assignments?user=${userId}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    Ver todas →
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Certificados */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Certificados</h3>
            </div>
            <div className="px-6 py-5">
              {certificates.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Este usuário ainda não possui certificados.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {certificates.map(cert => (
                    <li key={cert.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{cert.track_name}</p>
                          <p className="text-sm text-gray-500">
                            Emitido em: {new Date(cert.issue_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <button
                          className="text-sm font-medium text-primary-600 hover:text-primary-500"
                          onClick={() => alert('Download de certificado a ser implementado')}
                        >
                          Download
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetails; 