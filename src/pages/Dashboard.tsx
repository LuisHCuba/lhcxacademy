import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackDAO, assignmentDAO, certificateDAO } from '../lib/dao';
import type { TrackWithProgress, AssignmentWithDetails, Certificate } from '../types/app';
import LoadingScreen from '../components/common/LoadingScreen';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentTracks, setRecentTracks] = useState<TrackWithProgress[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<AssignmentWithDetails[]>([]);
  const [certificates, setCertificates] = useState<(Certificate & { track_name: string })[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Buscar trilhas recentes com progresso
        const { data: tracks } = await trackDAO.getTracksWithProgress(
          user.id,
          1, // página 1
          4, // apenas 4 itens
          'created_at', // ordenar por data de criação
          'desc' // mais recentes primeiro
        );
        
        // Buscar atividades pendentes
        const { data: assignments } = await assignmentDAO.getUserAssignments(
          user.id,
          1, 
          3,
          'due_date',
          'asc',
          'in_progress'
        );
        
        // Buscar certificados do usuário
        const userCertificates = await certificateDAO.getUserCertificates(user.id);
        
        setRecentTracks(tracks);
        setPendingAssignments(assignments);
        setCertificates(userCertificates.slice(0, 3)); // Apenas 3 certificados mais recentes
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  if (loading) return <LoadingScreen />;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {user?.full_name}!
        </h1>
        <p className="text-gray-600">Aqui está um resumo da sua atividade na plataforma.</p>
      </div>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Progresso Geral</h2>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-primary-600">
              {recentTracks.length > 0 
                ? Math.round(recentTracks.reduce((sum, track) => sum + track.progress_percentage, 0) / recentTracks.length) 
                : 0}%
            </div>
            <div className="ml-2 text-gray-500">concluído</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Atividades Pendentes</h2>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-amber-500">{pendingAssignments.length}</div>
            <div className="ml-2 text-gray-500">aguardando sua ação</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Certificados</h2>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-emerald-500">{certificates.length}</div>
            <div className="ml-2 text-gray-500">conquistados</div>
          </div>
        </div>
      </div>
      
      {/* Trilhas Recentes */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Trilhas Recentes</h2>
          <Link to="/dashboard/tracks" className="text-primary-600 hover:text-primary-700">
            Ver todas
          </Link>
        </div>
        
        {recentTracks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Você ainda não iniciou nenhuma trilha de aprendizado.</p>
            <Link to="/dashboard/tracks" className="mt-4 btn-primary inline-block">
              Explorar trilhas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentTracks.map(track => (
              <Link 
                key={track.id} 
                to={`/dashboard/tracks/${track.id}`}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative pb-[60%]">
                  <img 
                    src={track.thumbnail_url || '/placeholder-course.jpg'} 
                    alt={track.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="text-white font-semibold">{track.name}</div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="text-sm text-gray-500 mb-2">
                    {track.type === 'track' ? 'Trilha' : track.type === 'pill' ? 'Pílula' : 'Grid'}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">{track.total_videos} vídeos</div>
                    <div className="text-sm font-semibold text-primary-600">{Math.round(track.progress_percentage)}%</div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-primary-600 h-1.5 rounded-full" 
                      style={{ width: `${track.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Atividades Pendentes */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Atividades Pendentes</h2>
          <Link to="/dashboard/assignments" className="text-primary-600 hover:text-primary-700">
            Ver todas
          </Link>
        </div>
        
        {pendingAssignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Você não tem atividades pendentes no momento.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {pendingAssignments.map(assignment => (
                <li key={assignment.id} className="p-4 hover:bg-gray-50">
                  <Link to={`/dashboard/assignments/${assignment.id}`} className="block">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{assignment.track?.name || 'Atividade Geral'}</div>
                        <div className="text-sm text-gray-500">
                          {assignment.department?.name && `Departamento: ${assignment.department.name}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-amber-500">Prazo</div>
                        <div className="text-sm text-gray-500">
                          {new Date(assignment.due_date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Certificados */}
      {certificates.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Certificados Recentes</h2>
            <Link to="/dashboard/profile" className="text-primary-600 hover:text-primary-700">
              Ver todos
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-white rounded-lg shadow p-6">
                <div className="text-emerald-600 mb-2">
                  <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium">{cert.track_name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Emitido em {new Date(cert.issue_date).toLocaleDateString('pt-BR')}
                </p>
                <button className="mt-4 px-3 py-1 text-sm text-emerald-700 border border-emerald-600 rounded-md hover:bg-emerald-50">
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 