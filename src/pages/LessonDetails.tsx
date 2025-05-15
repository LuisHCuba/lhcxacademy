import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videoDAO, trackDAO } from '../lib/dao';
import type { Video, Track, VideoWithProgress } from '../types/app';
import LoadingScreen from '../components/common/LoadingScreen';
import { useNotification } from '../context/NotificationContext';

const LessonDetails = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  // Estados básicos
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<Video | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [nextVideo, setNextVideo] = useState<VideoWithProgress | null>(null);
  const [prevVideo, setPrevVideo] = useState<VideoWithProgress | null>(null);
  const [progress, setProgress] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  
  // Carregar dados do vídeo e trilha
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !lessonId) return;
      
      try {
        setLoading(true);
        
        // Buscar detalhes do vídeo
        const videoData = await videoDAO.getById(parseInt(lessonId));
        if (!videoData) {
          showNotification('error', 'Erro', 'Vídeo não encontrado');
          setLoading(false);
          return;
        }
        
        // Buscar detalhes da trilha
        const trackData = await trackDAO.getById(videoData.track_id);
        
        // Buscar vídeos da trilha para navegação
        const { data: videosData } = await videoDAO.getVideosByTrack(
          videoData.track_id,
          user.id,
          1,
          100,
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
        
        // Definir status do progresso
        const currentProgress = videosData.find(v => v.id === parseInt(lessonId));
        if (currentProgress) {
          setProgress(currentProgress.status || 'not_started');
        }
        
        setVideo(videoData);
        setTrack(trackData);
      } catch (error) {
        console.error('Erro ao carregar detalhes do vídeo:', error);
        showNotification('error', 'Erro', 'Não foi possível carregar este vídeo');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [lessonId, user, showNotification]);
  
  // Atualizar status do vídeo para "em andamento" quando for visualizado
  useEffect(() => {
    if (!user || !video || loading) return;
    
    // Marcar como em progresso quando a página é carregada, se ainda não estiver concluído
    if (progress === 'not_started') {
      const newStatus = 'in_progress';
      setProgress(newStatus);
      videoDAO.updateProgress(user.id, video.id, newStatus, 0);
    }
  }, [user, video, loading, progress]);
  
  // Marcar vídeo como concluído
  const handleComplete = async () => {
    if (!video || !user) return;
    
    try {
      const newStatus = 'completed';
      setProgress(newStatus);
      
      await videoDAO.updateProgress(user.id, video.id, newStatus, 0);
      
      showNotification('success', 'Concluído', 'Vídeo marcado como concluído!');
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      showNotification('error', 'Erro', 'Não foi possível atualizar o progresso');
    }
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
        {/* Player de vídeo - iframe simples */}
        <div className="relative pt-[56.25%] bg-black rounded-t-lg overflow-hidden">
          <iframe 
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        
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
              progress === 'completed' 
                ? 'bg-emerald-100 text-emerald-800' 
                : progress === 'in_progress'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-800'
            }`}>
              {progress === 'completed' 
                ? 'Concluído' 
                : progress === 'in_progress'
                  ? 'Em andamento'
                  : 'Não iniciado'}
            </div>
          </div>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-gray-700">{video.description}</p>
          </div>
          
          {progress === 'completed' && (
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
            
            {progress !== 'completed' && (
              <button 
                onClick={handleComplete}
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

export default LessonDetails; 