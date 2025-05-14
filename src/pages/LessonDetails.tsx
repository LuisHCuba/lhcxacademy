import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videoDAO, trackDAO } from '../lib/dao';
import type { Video, Track, VideoWithProgress } from '../types/app';
import LoadingScreen from '../components/common/LoadingScreen';
import { useNotification } from '../context/NotificationContext';

const LessonDetails = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<Video | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [progress, setProgress] = useState({
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed',
    watchTime: 0,
  });
  const [nextVideo, setNextVideo] = useState<VideoWithProgress | null>(null);
  const [prevVideo, setPrevVideo] = useState<VideoWithProgress | null>(null);
  
  // Estado para o player do YouTube
  const [player, setPlayer] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Referência para o timer de salvamento do progresso
  const saveProgressTimerRef = useRef<number | null>(null);
  const playerTimerRef = useRef<number | null>(null);
  // Estado para controlar se salvou o progresso ao sair da página
  const savedOnUnmountRef = useRef(false);
  
  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!user || !lessonId) return;
      
      setLoading(true);
      try {
        // Buscar detalhes do vídeo
        const videoData = await videoDAO.getById(parseInt(lessonId));
        if (!videoData) {
          console.error('Vídeo não encontrado');
          setLoading(false);
          return;
        }
        
        // Buscar detalhes da trilha
        const trackData = await trackDAO.getById(videoData.track_id);
        
        // Buscar vídeos da trilha para navegação
        const { data: videosData } = await videoDAO.getVideosByTrack(
          videoData.track_id,
          user.id,
          1,  // página
          100, // limite (assumindo que não haverá mais que 100 vídeos por trilha)
          'order_index',
          'asc'
        );
        
        // Encontrar o índice do vídeo atual
        const currentIndex = videosData.findIndex(v => v.id === parseInt(lessonId));
        
        // Definir próximo e anterior vídeos
        if (currentIndex > 0) {
          setPrevVideo(videosData[currentIndex - 1]);
        }
        
        if (currentIndex < videosData.length - 1) {
          setNextVideo(videosData[currentIndex + 1]);
        }
        
        // Definir progresso inicial
        const currentProgress = videosData.find(v => v.id === parseInt(lessonId));
        if (currentProgress) {
          setProgress({
            status: currentProgress.status,
            watchTime: currentProgress.watch_time,
          });
          setCurrentTime(currentProgress.watch_time);
        }
        
        setVideo(videoData);
        setTrack(trackData);
      } catch (error) {
        console.error('Erro ao carregar detalhes do vídeo:', error);
        showNotification('error', 'Erro', 'Não foi possível carregar este vídeo. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideoDetails();
    
    // Limpar timer ao desmontar
    return () => {
      if (saveProgressTimerRef.current) {
        clearInterval(saveProgressTimerRef.current);
      }
      
      if (playerTimerRef.current) {
        clearInterval(playerTimerRef.current);
      }
      
      // Salvar progresso antes de sair da página (se ainda não salvou)
      if (!savedOnUnmountRef.current && video && user) {
        videoDAO.updateProgress(user.id, video.id, progress.status, progress.watchTime);
        savedOnUnmountRef.current = true;
      }
    };
  }, [user, lessonId, showNotification]);
  
  // Configurar salvamento automático de progresso
  useEffect(() => {
    if (video && user && !loading) {
      // Iniciar como 'in_progress' se ainda não estiver concluído
      if (progress.status === 'not_started') {
        setProgress(prev => ({ ...prev, status: 'in_progress' }));
      }
      
      // Configurar timer para salvar progresso a cada 30 segundos
      saveProgressTimerRef.current = window.setInterval(() => {
        videoDAO.updateProgress(user.id, video.id, progress.status, progress.watchTime);
      }, 30000);
    }
    
    return () => {
      if (saveProgressTimerRef.current) {
        clearInterval(saveProgressTimerRef.current);
      }
    };
  }, [video, user, loading, progress.status]);
  
  // Controlar o progresso do vídeo
  const handleTimeUpdate = (currentTime: number) => {
    setCurrentTime(currentTime);
    setProgress(prev => ({ 
      ...prev, 
      watchTime: Math.max(prev.watchTime, Math.floor(currentTime)) 
    }));
    
    // Verificar se o vídeo está quase no final (95% assistido)
    if (totalDuration > 0 && currentTime >= totalDuration * 0.95 && progress.status !== 'completed') {
      handleVideoComplete();
    }
  };
  
  // Formatar tempo (segundos para MM:SS)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Marcar vídeo como concluído
  const handleVideoComplete = async () => {
    if (!video || !user) return;
    
    const newStatus = 'completed';
    setProgress(prev => ({ ...prev, status: newStatus }));
    
    // Salvar o progresso
    try {
      await videoDAO.updateProgress(user.id, video.id, newStatus, video.estimated_duration);
      savedOnUnmountRef.current = true; // Marcamos que já salvou para evitar salvamento duplicado
      
      showNotification('success', 'Concluído', 'Vídeo marcado como concluído!');
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      showNotification('error', 'Erro', 'Não foi possível atualizar o progresso.');
    }
  };
  
  // Renderizar o player do YouTube
  const renderYouTubePlayer = () => {
    if (!video) return null;
    
    // Função para inicializar o player do YouTube
    // Esta função será chamada quando o API do YouTube estiver carregado
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      
      const ytPlayer = new window.YT.Player('youtube-player', {
        videoId: video.youtube_id,
        playerVars: {
          autoplay: 1,
          start: progress.watchTime,
          rel: 0,
          modestbranding: 1,
          controls: 1
        },
        events: {
          onStateChange: (event: any) => {
            // Estado 1 = reproduzindo
            setIsPlaying(event.data === 1);
            
            // Estado 0 = vídeo terminou
            if (event.data === 0) {
              handleVideoComplete();
            }
          },
          onReady: (event: any) => {
            // Armazenar referência ao player
            setPlayer(event.target);
            
            // Obter duração total (só disponível quando o vídeo está pronto)
            const duration = event.target.getDuration();
            setTotalDuration(duration);
            
            // Configurar timer para atualizar o progresso a cada segundo
            playerTimerRef.current = window.setInterval(() => {
              const currentTime = event.target.getCurrentTime();
              handleTimeUpdate(currentTime);
            }, 1000);
          }
        }
      });
    };
    
    // Carrega a API do YouTube se ainda não estiver carregada
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      // Se a API já estiver carregada, inicializa o player diretamente
      initPlayer();
    }
    
    return (
      <div className="aspect-w-16 aspect-h-9 bg-black rounded-t-lg overflow-hidden">
        <div id="youtube-player"></div>
      </div>
    );
  };
  
  // Componente de barra de progresso personalizada
  const CustomProgressBar = () => {
    const progressPercentage = totalDuration > 0 
      ? (currentTime / totalDuration) * 100 
      : 0;
      
    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!player || !totalDuration) return;
      
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const clickPercentage = offsetX / rect.width;
      const seekTime = totalDuration * clickPercentage;
      
      // Buscar para a posição clicada
      player.seekTo(seekTime, true);
      setCurrentTime(seekTime);
    };
    
    return (
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div 
          className="h-2 w-full bg-gray-200 rounded-full cursor-pointer"
          onClick={handleProgressBarClick}
        >
          <div 
            className="h-full bg-primary-600 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    );
  };
  
  if (loading) return <LoadingScreen />;
  if (!video || !track) return <div className="p-8 text-center">Vídeo não encontrado.</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link 
          to={`/dashboard/tracks/${track.id}`}
          className="inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Voltar para {track.name}
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
        {/* Player de vídeo */}
        {renderYouTubePlayer()}
        
        {/* Barra de progresso personalizada */}
        <CustomProgressBar />
        
        {/* Informações do vídeo */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{Math.floor(video.estimated_duration / 60)}:{(video.estimated_duration % 60).toString().padStart(2, '0')} min</span>
            
            <span className="mx-2">•</span>
            
            <div className={`px-2 py-0.5 rounded-full text-xs ${
              progress.status === 'completed' 
                ? 'bg-emerald-100 text-emerald-800' 
                : progress.status === 'in_progress'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-800'
            }`}>
              {progress.status === 'completed' 
                ? 'Concluído' 
                : progress.status === 'in_progress'
                  ? 'Em andamento'
                  : 'Não iniciado'}
            </div>
          </div>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-gray-700">{video.description}</p>
          </div>
          
          {progress.status === 'in_progress' && totalDuration > 0 && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-amber-800 font-medium mb-2">Seu progresso</h3>
              <div className="flex justify-between text-sm text-amber-700 mb-1">
                <span>Você já assistiu {Math.round((currentTime / totalDuration) * 100)}% deste vídeo</span>
                <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2.5">
                <div 
                  className="bg-amber-500 h-2.5 rounded-full" 
                  style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {progress.status === 'completed' && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-emerald-800 font-medium">Vídeo concluído! Continue sua jornada de aprendizado.</h3>
              </div>
            </div>
          )}
          
          {/* Botões de navegação */}
          <div className="flex justify-between mt-8">
            {prevVideo ? (
              <Link 
                to={`/dashboard/lessons/${prevVideo.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Anterior
              </Link>
            ) : (
              <div></div>
            )}
            
            {progress.status !== 'completed' && (
              <button 
                onClick={handleVideoComplete}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Marcar como concluído
              </button>
            )}
            
            {nextVideo ? (
              <Link 
                to={`/dashboard/lessons/${nextVideo.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Próximo
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            ) : (
              <Link 
                to={`/dashboard/tracks/${track.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Concluir trilha
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
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

export default LessonDetails; 