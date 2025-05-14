import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackDAO, videoDAO, quizDAO, certificateDAO } from '../lib/dao';
import type { Track, VideoWithProgress, QuizQuestionWithAnswers } from '../types/app';
import LoadingScreen from '../components/common/LoadingScreen';

const TrackDetails = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<Track | null>(null);
  const [videos, setVideos] = useState<VideoWithProgress[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [completedVideosCount, setCompletedVideosCount] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    const fetchTrackDetails = async () => {
      if (!user || !trackId) return;
      
      setLoading(true);
      try {
        // Buscar detalhes da trilha
        const trackData = await trackDAO.getById(parseInt(trackId));
        if (!trackData) {
          console.error('Trilha não encontrada');
          setLoading(false);
          return;
        }
        
        // Buscar vídeos da trilha
        const { data: videosData, count } = await videoDAO.getVideosByTrack(
          parseInt(trackId),
          user.id,
          1,  // página
          100, // limite (assumindo que não haverá mais que 100 vídeos por trilha)
          'order_index',
          'asc'
        );
        
        // Verificar se a trilha tem quiz
        const quizQuestions = await quizDAO.getQuizQuestionsWithAnswers(parseInt(trackId));
        
        // Verificar se o usuário já possui certificado desta trilha
        const userCertificates = await certificateDAO.getUserCertificates(user.id);
        const hasCert = userCertificates.some(cert => cert.track_id === parseInt(trackId));
        
        // Calcular progresso
        const completed = videosData.filter(video => video.status === 'completed').length;
        const percentage = count > 0 ? (completed / count) * 100 : 0;
        
        setTrack(trackData);
        setVideos(videosData);
        setTotalVideos(count);
        setHasQuiz(quizQuestions.length > 0);
        setHasCertificate(hasCert);
        setCompletedVideosCount(completed);
        setProgressPercentage(percentage);
      } catch (error) {
        console.error('Erro ao carregar detalhes da trilha:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrackDetails();
  }, [user, trackId]);

  const isTrackCompleted = completedVideosCount === totalVideos && totalVideos > 0;
  
  const handleGetCertificate = async () => {
    if (!user || !trackId) return;
    
    try {
      const success = await certificateDAO.issueCertificate(user.id, parseInt(trackId));
      if (success) {
        setHasCertificate(true);
        alert('Certificado emitido com sucesso!');
      } else {
        alert('Erro ao emitir certificado. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao emitir certificado:', error);
      alert('Erro ao emitir certificado. Tente novamente.');
    }
  };

  if (loading) return <LoadingScreen />;
  if (!track) return <div className="p-8 text-center">Trilha não encontrada.</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header da trilha */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="relative h-48 md:h-64 bg-gray-200">
          {track.thumbnail_url ? (
            <img 
              src={track.thumbnail_url} 
              alt={track.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-500 to-primary-700">
              <h1 className="text-3xl text-white font-bold">{track.name}</h1>
            </div>
          )}
          
          <div className="absolute top-4 left-4">
            <span className={`text-xs px-2 py-1 rounded-full ${
              track.type === 'track' 
                ? 'bg-blue-100 text-blue-800' 
                : track.type === 'pill' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-amber-100 text-amber-800'
            }`}>
              {track.type === 'track' ? 'Trilha' : track.type === 'pill' ? 'Pílula' : 'Grid'}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{track.name}</h1>
          <p className="text-gray-700 mb-4">{track.description}</p>
          
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-sm text-gray-500">Progresso</div>
                <div className="font-semibold">{Math.round(progressPercentage)}% concluído</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Vídeos</div>
                <div className="font-semibold">{completedVideosCount}/{totalVideos}</div>
              </div>
            </div>
            
            {isTrackCompleted && !hasCertificate && (
              <button 
                onClick={handleGetCertificate}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
              >
                Emitir Certificado
              </button>
            )}
            
            {hasCertificate && (
              <div className="flex items-center space-x-2 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Certificado Emitido</span>
              </div>
            )}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-primary-600 h-2 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Lista de vídeos */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Conteúdo da Trilha</h2>
        </div>
        
        {videos.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Esta trilha ainda não possui conteúdo.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {videos.map((video, index) => (
              <li key={video.id} className="p-4 hover:bg-gray-50">
                <Link to={`/dashboard/lessons/${video.id}`} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      video.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : video.status === 'in_progress' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-gray-100 text-gray-500'
                    }`}>
                      {video.status === 'completed' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-lg font-semibold">{index + 1}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                      <p className="text-sm text-gray-500">{Math.floor(video.estimated_duration / 60)}:{(video.estimated_duration % 60).toString().padStart(2, '0')}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{video.description}</p>
                    
                    {video.status === 'in_progress' && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">Progresso</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-amber-500 h-1.5 rounded-full" 
                            style={{ width: `${(video.watch_time / video.estimated_duration) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        
        {/* Seção de Quiz (se houver) */}
        {hasQuiz && (
          <div className="p-6 border-t border-gray-200">
            <Link 
              to={`/dashboard/quiz/${trackId}`} 
              className="flex items-center justify-between px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium">Avaliação de Conhecimento</h3>
                  <p className="text-sm">Teste seus conhecimentos sobre esta trilha</p>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackDetails; 