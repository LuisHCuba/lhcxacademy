import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { videoDAO, trackDAO } from '../../lib/dao';
import { supabase } from '../../lib/supabase';
import type { Video, Track } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../context/NotificationContext';

type VideoFormData = {
  title: string;
  description: string;
  youtube_id: string;
  estimated_duration: number;
  order_index: number;
  track_id: number;
};

// Chave para armazenar dados no localStorage
const VIDEO_FORM_STORAGE_KEY = 'video_form_data';

const AdminVideoDetails = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [searchParams] = useSearchParams();
  const trackIdParam = searchParams.get('trackId');
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingDuration, setLoadingDuration] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  
  // Referência para o player do YouTube para obter duração
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  const isNewVideo = videoId === 'new';
  
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
  
  // Recuperar valores padrão do localStorage ou usar valores iniciais
  const getDefaultValues = () => {
    if (isNewVideo) {
      try {
        const savedForm = localStorage.getItem(VIDEO_FORM_STORAGE_KEY);
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
      title: '',
      description: '',
      youtube_id: '',
      estimated_duration: 0,
      order_index: 0,
      track_id: trackIdParam ? parseInt(trackIdParam) : 0
    };
  };
  
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch,
    formState: { errors, isDirty } 
  } = useForm<VideoFormData>({
    defaultValues: getDefaultValues()
  });
  
  // Monitorar o valor atual de track_id
  const selectedTrackId = watch('track_id');
  const youtubeId = watch('youtube_id');
  
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        // Carregar trilhas disponíveis para o select
        const { data } = await trackDAO.getTracks(1, 100);
        setTracks(data);
      } catch (error) {
        console.error('Erro ao carregar trilhas:', error);
      }
    };
    
    fetchTracks();
  }, []);
  
  useEffect(() => {
    const fetchVideoData = async () => {
      if (isNewVideo) {
        setLoading(false);
        setFormInitialized(true);
        return;
      }
      
      try {
        if (!videoId) return;
        
        // Buscar dados do vídeo
        const videoData = await videoDAO.getById(parseInt(videoId));
        
        if (!videoData) {
          navigate('/admin/tracks');
          return;
        }
        
        // Preencher formulário
        setValue('title', videoData.title);
        setValue('description', videoData.description || '');
        setValue('youtube_id', videoData.youtube_id);
        setValue('estimated_duration', videoData.estimated_duration);
        setValue('order_index', videoData.order_index);
        setValue('track_id', videoData.track_id);
        setFormInitialized(true);
        
      } catch (error) {
        console.error('Erro ao carregar dados do vídeo:', error);
        setErrorMessage('Erro ao carregar dados do vídeo');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideoData();
  }, [videoId, isNewVideo, navigate, setValue]);
  
  const getYouTubeEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${youtubeId}`;
  };
  
  const getYouTubeThumbnailUrl = (youtubeId: string) => {
    return `https://img.youtube.com/vi/${youtubeId}/0.jpg`;
  };
  
  const extractYouTubeId = (url: string) => {
    // Suporta formatos como:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    
    if (!url) return '';
    
    // Tentar encontrar o parâmetro v= nas URLs do YouTube
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : url;
  };
  
  // Nova função para obter duração do vídeo automáticamente
  const fetchYouTubeVideoDuration = () => {
    if (!youtubeId) return;
    
    const extractedYoutubeId = extractYouTubeId(youtubeId);
    if (!extractedYoutubeId) return;
    
    setLoadingDuration(true);
    
    // Inicializa a API do YouTube se ainda não estiver inicializada
    if (!window.YT) {
      // Criar um elemento script para carregar a API do YouTube
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      
      // Função que será chamada quando a API estiver carregada
      window.onYouTubeIframeAPIReady = () => {
        createPlayer(extractedYoutubeId);
      };
      
      // Adicionar o script à página
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else {
      // Se a API já estiver carregada, criar o player diretamente
      createPlayer(extractedYoutubeId);
    }
  };
  
  // Função para criar um player oculto para obter a duração
  const createPlayer = (videoId: string) => {
    // Certifique-se de que o container existe
    if (!playerContainerRef.current) return;
    
    // Limpar player anterior se existir
    if (playerRef.current) {
      playerContainerRef.current.innerHTML = '';
    }
    
    // Criar um elemento div para o player
    const playerElement = document.createElement('div');
    playerElement.id = 'youtube-duration-player';
    playerContainerRef.current.appendChild(playerElement);
    
    // Criar o player
    playerRef.current = new window.YT.Player('youtube-duration-player', {
      videoId: videoId,
      height: '1',
      width: '1',
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          // Quando o player estiver pronto, obtém a duração
          const duration = event.target.getDuration();
          setValue('estimated_duration', duration);
          setLoadingDuration(false);
          
          // Remover o player após obter a duração
          setTimeout(() => {
            if (playerContainerRef.current) {
              playerContainerRef.current.innerHTML = '';
            }
          }, 1000);
        },
        onError: () => {
          setLoadingDuration(false);
          showNotification('error', 'Erro', 'Não foi possível obter a duração do vídeo');
        }
      }
    });
  };
  
  const onSubmit = async (data: VideoFormData) => {
    setSaving(true);
    
    // Extrair ID do YouTube se o usuário colou URL completa
    const youtubeId = extractYouTubeId(data.youtube_id);
    
    try {
      if (!userId) {
        setErrorMessage('Você precisa estar logado para criar ou editar um vídeo.');
        setSaving(false);
        return;
      }
      
      const videoData = {
        ...data,
        youtube_id: youtubeId,
      };
      
      if (isNewVideo) {
        // Criar novo vídeo
        const newVideo = await videoDAO.create({
          ...videoData,
          created_at: new Date().toISOString(),
          created_by: userId
        });
        
        if (newVideo) {
          // Limpar dados salvos após sucesso
          localStorage.removeItem(VIDEO_FORM_STORAGE_KEY);
          
          showNotification('success', 'Vídeo criado', 'O vídeo foi criado com sucesso!');
          setTimeout(() => {
            navigate(`/admin/tracks/${data.track_id}`);
          }, 1500);
        }
      } else {
        // Atualizar vídeo existente
        const updatedVideo = await videoDAO.update(parseInt(videoId as string), videoData);
        
        if (updatedVideo) {
          showNotification('success', 'Vídeo atualizado', 'O vídeo foi atualizado com sucesso!');
          setTimeout(() => {
            navigate(`/admin/tracks/${data.track_id}`);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      setErrorMessage('Erro ao salvar vídeo. Tente novamente.');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!videoId || isNewVideo) return;
    
    if (window.confirm('Tem certeza que deseja excluir este vídeo?')) {
      try {
        const trackId = watch('track_id');
        const success = await videoDAO.delete(parseInt(videoId));
        
        if (success) {
          showNotification('success', 'Vídeo excluído', 'O vídeo foi excluído com sucesso!');
          setTimeout(() => {
            navigate(`/admin/tracks/${trackId}`);
          }, 1500);
        }
      } catch (error) {
        console.error('Erro ao excluir vídeo:', error);
        setErrorMessage('Erro ao excluir vídeo. Tente novamente.');
      }
    }
  };
  
  // Salvar formulário no localStorage quando os valores mudarem
  useEffect(() => {
    const subscription = watch((value) => {
      if (isNewVideo && formInitialized) {
        localStorage.setItem(VIDEO_FORM_STORAGE_KEY, JSON.stringify(value));
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch, isNewVideo, formInitialized]);
  
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

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNewVideo ? 'Novo Vídeo' : 'Detalhes do Vídeo'}
          </h1>
          <p className="text-gray-600">
            {isNewVideo 
              ? 'Preencha os campos abaixo para adicionar um novo vídeo'
              : 'Visualize e edite as informações do vídeo'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          {selectedTrackId ? (
            <Link
              to={`/admin/tracks/${selectedTrackId}`}
              className="flex items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
              Voltar para Trilha
            </Link>
          ) : (
            <Link
              to="/admin/tracks"
              className="flex items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
              Voltar para Trilhas
            </Link>
          )}
          
          {!isNewVideo && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Informações do Vídeo</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Preencha os detalhes do vídeo a ser adicionado à trilha.
                </p>
              </div>
              
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 gap-6">
                  <div>
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
                  
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Título
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="title"
                        className="input-field"
                        {...register('title', { required: 'Título é obrigatório' })}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="youtube_id" className="block text-sm font-medium text-gray-700">
                      ID ou URL do YouTube
                    </label>
                    <div className="mt-1 flex">
                      <input
                        type="text"
                        id="youtube_id"
                        className="input-field"
                        placeholder="Exemplo: dQw4w9WgXcQ ou URL completa do YouTube"
                        {...register('youtube_id', { required: 'ID do YouTube é obrigatório' })}
                      />
                      <button
                        type="button"
                        onClick={fetchYouTubeVideoDuration}
                        disabled={!youtubeId || loadingDuration}
                        className="ml-2 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300"
                      >
                        {loadingDuration ? 'Carregando...' : 'Obter Duração'}
                      </button>
                    </div>
                    {errors.youtube_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.youtube_id.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Cole a URL completa do YouTube ou apenas o ID do vídeo (a parte após v= na URL).
                      Clique em "Obter Duração" para capturar automaticamente o tempo do vídeo.
                    </p>
                  </div>
                  
                  <div>
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
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="estimated_duration" className="block text-sm font-medium text-gray-700">
                        Duração (em segundos)
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          id="estimated_duration"
                          className="input-field"
                          min="0"
                          {...register('estimated_duration', { 
                            required: 'Duração é obrigatória',
                            min: { value: 0, message: 'Duração não pode ser negativa' }
                          })}
                        />
                        {errors.estimated_duration && (
                          <p className="mt-1 text-sm text-red-600">{errors.estimated_duration.message}</p>
                        )}
                        {watch('estimated_duration') > 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            Duração formatada: {Math.floor(watch('estimated_duration') / 60)}:
                            {(watch('estimated_duration') % 60).toString().padStart(2, '0')} min
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="order_index" className="block text-sm font-medium text-gray-700">
                        Ordem na Trilha
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          id="order_index"
                          className="input-field"
                          min="0"
                          {...register('order_index', { 
                            required: 'Ordem é obrigatória',
                            min: { value: 0, message: 'Ordem não pode ser negativa' }
                          })}
                        />
                        {errors.order_index && (
                          <p className="mt-1 text-sm text-red-600">{errors.order_index.message}</p>
                        )}
                      </div>
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
                  {saving ? 'Salvando...' : isNewVideo ? 'Adicionar Vídeo' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Preview */}
        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preview</h2>
            
            {watch('youtube_id') ? (
              <div>
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <iframe
                    src={getYouTubeEmbedUrl(extractYouTubeId(watch('youtube_id')))}
                    className="w-full h-full rounded"
                    allowFullScreen
                    title="Preview do vídeo"
                  ></iframe>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900">{watch('title') || 'Título do Vídeo'}</h3>
                  
                  {watch('description') && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-3">
                      {watch('description')}
                    </p>
                  )}
                  
                  {watch('estimated_duration') > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Duração: {Math.floor(watch('estimated_duration') / 60)}:
                      {(watch('estimated_duration') % 60).toString().padStart(2, '0')} min
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sem preview disponível</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Adicione um ID ou URL do YouTube para visualizar o preview.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Container para o player oculto usado para obter a duração */}
      <div ref={playerContainerRef} style={{ display: 'none' }}></div>
    </div>
  );
};

// Definir interface global para o player do YouTube
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default AdminVideoDetails; 