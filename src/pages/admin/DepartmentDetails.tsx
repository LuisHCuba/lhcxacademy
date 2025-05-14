import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { departmentDAO, userDAO } from '../../lib/dao';
import type { Department, UserWithDepartment } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';

// Schema para validação
const departmentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres')
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

const AdminDepartmentDetails = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithDepartment[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema)
  });

  // Determinar se estamos criando um novo departamento ou editando existente
  const isNewDepartment = departmentId === 'new';

  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (isNewDepartment) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        if (!departmentId) return;
        
        // Buscar dados do departamento
        const deptData = await departmentDAO.getById(parseInt(departmentId));
        if (!deptData) {
          navigate('/admin/departments');
          return;
        }
        
        // Preencher formulário
        setValue('name', deptData.name);
        
        // Buscar usuários deste departamento (limitado a 10 para performance)
        const { data: departmentUsers } = await userDAO.getUsersWithDepartment(
          1, 10, 'full_name', 'asc', '', { department_id: parseInt(departmentId) }
        );
        setUsers(departmentUsers);
        
      } catch (error) {
        console.error('Erro ao carregar dados do departamento:', error);
        setErrorMessage('Erro ao carregar dados do departamento');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDepartmentData();
  }, [departmentId, isNewDepartment, navigate, setValue]);

  const onSubmit = async (data: DepartmentFormData) => {
    setSaving(true);
    try {
      if (isNewDepartment) {
        // Criar novo departamento
        const newDept = await departmentDAO.create({
          name: data.name,
          created_at: new Date().toISOString()
        });
        
        if (newDept) {
          setSuccessMessage('Departamento criado com sucesso!');
          setTimeout(() => {
            navigate(`/admin/departments/${newDept.id}`);
          }, 2000);
        }
      } else {
        // Atualizar departamento existente
        const updatedDept = await departmentDAO.update(parseInt(departmentId as string), data);
        
        if (updatedDept) {
          setSuccessMessage('Departamento atualizado com sucesso!');
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar departamento:', error);
      setErrorMessage('Erro ao salvar departamento. Tente novamente.');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!departmentId || isNewDepartment) return;
    
    if (window.confirm('Tem certeza que deseja excluir este departamento? Isso pode afetar usuários associados.')) {
      try {
        const success = await departmentDAO.delete(parseInt(departmentId));
        
        if (success) {
          setSuccessMessage('Departamento excluído com sucesso!');
          setTimeout(() => {
            navigate('/admin/departments');
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao excluir departamento:', error);
        setErrorMessage('Erro ao excluir departamento. Verifique se não existem usuários associados.');
      }
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNewDepartment ? 'Novo Departamento' : 'Detalhes do Departamento'}
          </h1>
          <p className="text-gray-600">
            {isNewDepartment 
              ? 'Preencha os campos abaixo para criar um novo departamento'
              : 'Visualize e edite as informações do departamento'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/departments"
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </Link>
          {!isNewDepartment && (
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
            <h2 className="text-lg font-medium text-gray-900">Informações do Departamento</h2>
            
            <div className="mt-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome do Departamento
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  className="input-field"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 text-right">
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              {saving ? 'Salvando...' : isNewDepartment ? 'Criar Departamento' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Membros do departamento (apenas para departamentos existentes) */}
      {!isNewDepartment && (
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Membros do Departamento</h3>
              <Link
                to={`/admin/users?department=${departmentId}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Ver todos
              </Link>
            </div>
            <div className="px-6 py-5">
              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhum usuário associado a este departamento.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {users.map(user => (
                    <li key={user.id} className="py-4 flex items-center justify-between">
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
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                      >
                        Ver detalhes
                      </Link>
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

export default AdminDepartmentDetails; 