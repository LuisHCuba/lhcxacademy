import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { assignmentDAO, trackDAO, departmentDAO, userDAO } from '../../lib/dao';
import type { Track, Department, User } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowUturnLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabase';

interface AssignmentFormData {
  track_id: number | null;
  department_id: number | null;
  user_id: string | null;
  start_date: string;
  due_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired';
}

// Chave para armazenar dados no localStorage
const FORM_STORAGE_KEY = 'assignment_form_data';

const AdminAssignmentDetails = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [assignmentType, setAssignmentType] = useState<'department' | 'user'>('department');
  const [formInitialized, setFormInitialized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const isNewAssignment = assignmentId === 'new';
  
  // Obter o ID do usuário atual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    
    getCurrentUser();
  }, []);
  
  // Recuperar valores padrão do localStorage ou usar valores iniciais
  const getDefaultValues = () => {
    if (isNewAssignment) {
      try {
        const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
        if (savedForm) {
          const parsedForm = JSON.parse(savedForm);
          return parsedForm;
        }
      } catch (error) {
        console.error('Erro ao recuperar dados do formulário:', error);
      }
    }
    
    // Valores padrão se não houver dados salvos
    return {
      track_id: null,
      department_id: null,
      user_id: null,
      start_date: new Date().toISOString().split('T')[0], // Hoje
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 dias
      status: 'not_started'
    };
  };
  
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch,
    formState: { errors, isDirty } 
  } = useForm<AssignmentFormData>({
    defaultValues: getDefaultValues()
  });
  
  const watchAssignmentType = watch('user_id') ? 'user' : watch('department_id') ? 'department' : assignmentType;
  
  // Salvar formulário no localStorage quando os valores mudarem
  useEffect(() => {
    const subscription = watch((value) => {
      if (isNewAssignment && formInitialized) {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(value));
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch, isNewAssignment, formInitialized]);
  
  // Adicionar evento para salvar antes de sair da página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !saving) {
        // Mostrar confirmação padrão do navegador
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, saving]);
  
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Carregar trilhas disponíveis
        const { data: tracksData } = await trackDAO.getTracks(1, 100);
        setTracks(tracksData);
        
        // Carregar departamentos
        const departmentsData = await departmentDAO.getAll();
        setDepartments(departmentsData);
        
        // Carregar usuários
        const { data: usersData } = await userDAO.getUsers(1, 100);
        setUsers(usersData);
      } catch (error) {
        console.error('Erro ao carregar dados de referência:', error);
      }
    };
    
    fetchReferenceData();
  }, []);
  
  useEffect(() => {
    const fetchAssignmentData = async () => {
      if (isNewAssignment) {
        setLoading(false);
        setFormInitialized(true);
        return;
      }
      
      try {
        if (!assignmentId) return;
        
        // Buscar dados da atribuição
        const { data: assignmentsData } = await assignmentDAO.getAssignmentsWithDetails(
          1, 1, 'due_date', 'asc', '', { id: parseInt(assignmentId) }
        );
        
        if (!assignmentsData || assignmentsData.length === 0) {
          navigate('/admin/assignments');
          return;
        }
        
        const assignment = assignmentsData[0];
        
        // Preencher formulário
        setValue('track_id', assignment.track_id);
        setValue('department_id', assignment.department_id);
        setValue('user_id', assignment.user_id);
        setValue('start_date', new Date(assignment.start_date).toISOString().split('T')[0]);
        setValue('due_date', new Date(assignment.due_date).toISOString().split('T')[0]);
        setValue('status', assignment.status || 'not_started');
        
        // Definir tipo de atribuição
        setAssignmentType(assignment.user_id ? 'user' : 'department');
        setFormInitialized(true);
        
      } catch (error) {
        console.error('Erro ao carregar dados da atribuição:', error);
        setErrorMessage('Erro ao carregar dados da atribuição');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignmentData();
  }, [assignmentId, isNewAssignment, navigate, setValue]);

  const onSubmit = async (data: AssignmentFormData) => {
    setSaving(true);
    
    // Validações adicionais
    if (!data.track_id) {
      setErrorMessage('Selecione uma trilha para a atribuição');
      setSaving(false);
      return;
    }
    
    if (!data.department_id && !data.user_id) {
      setErrorMessage('Selecione um departamento ou usuário para a atribuição');
      setSaving(false);
      return;
    }
    
    // Validar se temos o ID do usuário atual
    if (!currentUserId) {
      setErrorMessage('Você precisa estar logado para criar uma atribuição');
      setSaving(false);
      return;
    }
    
    // Ajustar dados conforme o tipo de atribuição
    if (assignmentType === 'department') {
      data.user_id = null;
    } else {
      data.department_id = null;
    }
    
    try {
      if (isNewAssignment) {
        // Criar nova atribuição
        const newAssignment = await assignmentDAO.create({
          ...data,
          created_at: new Date().toISOString(),
          created_by: currentUserId // Usar ID do usuário atual em vez de "system"
        });
        
        if (newAssignment) {
          // Limpar dados salvos após sucesso
          localStorage.removeItem(FORM_STORAGE_KEY);
          
          showNotification('success', 'Atribuição criada', 'A atribuição foi criada com sucesso!');
          setTimeout(() => {
            navigate('/admin/assignments');
          }, 2000);
        }
      } else {
        // Atualizar atribuição existente
        const updatedAssignment = await assignmentDAO.update(parseInt(assignmentId as string), {
          ...data,
          created_by: currentUserId // Incluir o ID do usuário atual aqui também
        });
        
        if (updatedAssignment) {
          showNotification('success', 'Atribuição atualizada', 'A atribuição foi atualizada com sucesso!');
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar atribuição:', error);
      setErrorMessage('Erro ao salvar atribuição. Tente novamente.');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assignmentId || isNewAssignment) return;
    
    if (window.confirm('Tem certeza que deseja excluir esta atribuição? Esta ação não pode ser desfeita.')) {
      try {
        const success = await assignmentDAO.delete(parseInt(assignmentId));
        
        if (success) {
          setSuccessMessage('Atribuição excluída com sucesso!');
          setTimeout(() => {
            navigate('/admin/assignments');
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao excluir atribuição:', error);
        setErrorMessage('Erro ao excluir atribuição. Tente novamente.');
      }
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNewAssignment ? 'Nova Atribuição' : 'Detalhes da Atribuição'}
          </h1>
          <p className="text-gray-600">
            {isNewAssignment 
              ? 'Preencha os campos abaixo para criar uma nova atribuição'
              : 'Visualize e edite as informações da atribuição'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/assignments"
            className="flex items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
            Voltar
          </Link>
          {!isNewAssignment && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
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
      
      {/* Formulário de edição */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Informações da Atribuição</h2>
            <p className="mt-1 text-sm text-gray-500">
              Preencha as informações da atribuição de trilha.
            </p>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="track_id" className="block text-sm font-medium text-gray-700">
                  Trilha
                </label>
                <div className="mt-1">
                  <select
                    id="track_id"
                    className="input-field"
                    {...register('track_id', { required: 'Trilha é obrigatória' })}
                  >
                    <option value="">Selecione uma trilha</option>
                    {tracks.map(track => (
                      <option key={track.id} value={track.id}>{track.name}</option>
                    ))}
                  </select>
                  {errors.track_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.track_id.message}</p>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <fieldset>
                  <legend className="text-sm font-medium text-gray-700">Atribuir para</legend>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center">
                      <input
                        id="assignment-type-department"
                        name="assignment-type"
                        type="radio"
                        className="h-4 w-4 text-primary-600 border-gray-300"
                        checked={watchAssignmentType === 'department'}
                        onChange={() => setAssignmentType('department')}
                      />
                      <label htmlFor="assignment-type-department" className="ml-3 block text-sm font-medium text-gray-700">
                        Departamento
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="assignment-type-user"
                        name="assignment-type"
                        type="radio"
                        className="h-4 w-4 text-primary-600 border-gray-300"
                        checked={watchAssignmentType === 'user'}
                        onChange={() => setAssignmentType('user')}
                      />
                      <label htmlFor="assignment-type-user" className="ml-3 block text-sm font-medium text-gray-700">
                        Usuário específico
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>
              
              {watchAssignmentType === 'department' && (
                <div className="sm:col-span-6">
                  <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">
                    Departamento
                  </label>
                  <div className="mt-1">
                    <select
                      id="department_id"
                      className="input-field"
                      {...register('department_id')}
                    >
                      <option value="">Selecione um departamento</option>
                      {departments.map(department => (
                        <option key={department.id} value={department.id}>{department.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              {watchAssignmentType === 'user' && (
                <div className="sm:col-span-6">
                  <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
                    Usuário
                  </label>
                  <div className="mt-1">
                    <select
                      id="user_id"
                      className="input-field"
                      {...register('user_id')}
                    >
                      <option value="">Selecione um usuário</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              <div className="sm:col-span-3">
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Data de Início
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="start_date"
                    className="input-field"
                    {...register('start_date', { required: 'Data de início é obrigatória' })}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                  Data de Conclusão
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="due_date"
                    className="input-field"
                    {...register('due_date', { required: 'Data de conclusão é obrigatória' })}
                  />
                  {errors.due_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    className="input-field"
                    {...register('status')}
                  >
                    <option value="not_started">Não iniciado</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="completed">Concluído</option>
                    <option value="expired">Expirado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 text-right">
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              {saving ? 'Salvando...' : isNewAssignment ? 'Criar Atribuição' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAssignmentDetails; 