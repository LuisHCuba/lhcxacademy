import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { trackDAO } from '../../lib/dao';
import { supabase } from '../../lib/supabase';
import type { TrackWithExtras, Lesson } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowUturnLeftIcon, PlusCircleIcon, ArrowsUpDownIcon, TrashIcon } from '@heroicons/react/24/outline';

type TrackFormData = {
  name: string;
  description: string;
  type: 'track' | 'pill' | 'grid';
  thumbnail_url: string | null;
};

const AdminTrackDetails = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  const isNewTrack = trackId === 'new';
  
  // Verificar usuário logado ao iniciar
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    getCurrentUser();
  }, []);
  
  const { 
    register, 
    handleSubmit, 
    setValue, 
    formState: { errors } 
  } = useForm<TrackFormData>({
    defaultValues: {
      name: '',
      description: '',
      type: 'track',
      thumbnail_url: null
    }
  });
  
  useEffect(() => {
    const fetchTrackData = async () => {
      if (isNewTrack) {
        setLoading(false);
        return;
      }
      
      try {
        if (!trackId) return;
        
        // Buscar dados da trilha
        const trackData = await trackDAO.getById(parseInt(trackId));
        if (!trackData) {
          navigate('/admin/tracks');
          return;
        }
        
        // Preencher formulário
        setValue('name', trackData.name);
        setValue('description', trackData.description || '');
        setValue('type', trackData.type || 'track');
        setValue('thumbnail_url', trackData.thumbnail_url);
        
        // Buscar aulas desta trilha
        const trackLessons = await trackDAO.getLessons(parseInt(trackId));
        setLessons(trackLessons);
        
      } catch (error) {
        console.error('Erro ao carregar dados da trilha:', error);
        setErrorMessage('Erro ao carregar dados da trilha');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrackData();
  }, [trackId, isNewTrack, navigate, setValue]);

  const onSubmit = async (data: TrackFormData) => {
    setSaving(true);
    try {
      if (!userId) {
        setErrorMessage('Você precisa estar logado para criar ou editar uma trilha.');
        setSaving(false);
        return;
      }
      
      if (isNewTrack) {
        // Criar nova trilha
        const newTrack = await trackDAO.create({
          ...data,
          created_at: new Date().toISOString(),
          created_by: userId // Usar o ID do usuário logado
        });
        
        if (newTrack) {
          setSuccessMessage('Trilha criada com sucesso!');
          setTimeout(() => {
            navigate(`/admin/tracks/${newTrack.id}`);
          }, 2000);
        }
      } else {
        // Atualizar trilha existente
        const updatedTrack = await trackDAO.update(parseInt(trackId as string), data);
        
        if (updatedTrack) {
          setSuccessMessage('Trilha atualizada com sucesso!');
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar trilha:', error);
      setErrorMessage('Erro ao salvar trilha. Tente novamente.');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!trackId || isNewTrack) return;
    
    if (window.confirm('Tem certeza que deseja excluir esta trilha? Isso pode afetar usuários associados.')) {
      try {
        const success = await trackDAO.delete(parseInt(trackId));
        
        if (success) {
          setSuccessMessage('Trilha excluída com sucesso!');
          setTimeout(() => {
            navigate('/admin/tracks');
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao excluir trilha:', error);
        setErrorMessage('Erro ao excluir trilha. Verifique se não existem usuários ou atribuições associadas.');
      }
    }
  };

  const handleReorderLessons = (lessonId: number, direction: 'up' | 'down') => {
    // Implementar reordenação de aulas
    alert('Funcionalidade de reordenação a ser implementada');
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNewTrack ? 'Nova Trilha' : 'Detalhes da Trilha'}
          </h1>
          <p className="text-gray-600">
            {isNewTrack 
              ? 'Preencha os campos abaixo para criar uma nova trilha'
              : 'Visualize e edite as informações da trilha'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/tracks"
            className="flex items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
            Voltar
          </Link>
          {!isNewTrack && (
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
      <div className="bg-white shadow rounded-lg mb-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Informações da Trilha</h2>
            <p className="mt-1 text-sm text-gray-500">
              Preencha as informações básicas da trilha de aprendizado.
            </p>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="name"
                    className="input-field"
                    {...register('name', { required: 'Nome é obrigatório' })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Tipo
                </label>
                <div className="mt-1">
                  <select
                    id="type"
                    className="input-field"
                    {...register('type')}
                  >
                    <option value="track">Trilha</option>
                    <option value="pill">Pílula</option>
                    <option value="grid">Grid</option>
                  </select>
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={4}
                    className="input-field"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700">
                  URL da Imagem de Capa
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="thumbnail_url"
                    className="input-field"
                    placeholder="https://exemplo.com/imagem.jpg"
                    {...register('thumbnail_url')}
                  />
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
              {saving ? 'Salvando...' : isNewTrack ? 'Criar Trilha' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Lista de aulas - apenas para trilhas existentes */}
      {!isNewTrack && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Conteúdo da Trilha</h2>
              <p className="mt-1 text-sm text-gray-500">
                Gerencie as aulas e materiais desta trilha.
              </p>
            </div>
            
            <div className="flex space-x-4">
              <Link
                to={`/admin/videos/new?trackId=${trackId}`}
                className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Adicionar Vídeo
              </Link>
              
              <Link
                to={`/admin/quizzes/new?trackId=${trackId}`}
                className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Adicionar Quiz
              </Link>
            </div>
          </div>
          
          {lessons.length === 0 ? (
            <div className="p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum conteúdo disponível</h3>
              <p className="mt-1 text-sm text-gray-500">
                Adicione vídeos ou quizzes para começar a criar sua trilha de aprendizado.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {lessons.map((lesson, index) => (
                <li key={lesson.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center flex-grow">
                    <div className="flex-shrink-0 mr-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-600 font-semibold">{index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{lesson.title}</span>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lesson.type === 'video' 
                            ? 'bg-blue-100 text-blue-800' 
                            : lesson.type === 'quiz' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lesson.type === 'video' ? 'Vídeo' : lesson.type === 'quiz' ? 'Quiz' : 'Documento'}
                        </span>
                      </div>
                      
                      {lesson.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {lesson.description}
                        </p>
                      )}
                      
                      {lesson.duration && (
                        <p className="text-xs text-gray-500">
                          Duração: {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')} min
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 flex">
                    <button
                      onClick={() => handleReorderLessons(lesson.id, 'up')}
                      disabled={index === 0}
                      className={`p-1 text-gray-400 hover:text-gray-500 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ArrowsUpDownIcon className="h-5 w-5" />
                    </button>
                    
                    <Link
                      to={`/admin/${lesson.type === 'video' ? 'videos' : 'quizzes'}/${lesson.id}`}
                      className="ml-4 text-primary-600 hover:text-primary-800"
                    >
                      Editar
                    </Link>
                    
                    <button
                      onClick={() => window.confirm('Tem certeza que deseja excluir esta lição?')}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTrackDetails; 