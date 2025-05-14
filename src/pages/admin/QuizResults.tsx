import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quizDAO, userDAO, trackDAO } from '../../lib/dao';
import { supabase } from '../../lib/supabase';
import type { Track, User } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowUturnLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface QuizAttemptResult {
  id: number;
  user_id: string;
  question_id: number;
  answer_id: number;
  response_time: number;
  is_correct: boolean;
  score: number;
  created_at: string;
  user?: User;
  question_text?: string;
  answer_text?: string;
}

interface QuizSummary {
  totalAttempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageScore: number;
  averageResponseTime: number;
  userPerformance: {
    userId: string;
    userName: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    averageResponseTime: number;
  }[];
}

const AdminQuizResults = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<Track | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptResult[]>([]);
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchQuizResults = async () => {
      if (!trackId) return;
      
      setLoading(true);
      
      try {
        // Buscar dados da trilha
        const trackData = await trackDAO.getById(parseInt(trackId));
        if (trackData) {
          setTrack(trackData);
        }
        
        // Buscar todas as tentativas de quiz para esta trilha
        // Primeiro, buscar as perguntas desta trilha
        const { data: questions } = await supabase
          .from('quiz_questions')
          .select('id')
          .eq('track_id', trackId);
          
        if (!questions || questions.length === 0) {
          setLoading(false);
          return;
        }
        
        const questionIds = questions.map(q => q.id);
        
        // Buscar todas as tentativas para estas perguntas
        const { data: attemptsData } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            question:quiz_questions(id, question_text, track_id),
            answer:quiz_answers(id, answer_text, is_correct)
          `)
          .in('question_id', questionIds)
          .order('created_at', { ascending: false });
          
        if (!attemptsData) {
          setLoading(false);
          return;
        }
        
        // Estruturar os dados das tentativas
        const formattedAttempts: QuizAttemptResult[] = [];
        const userIds = new Set<string>();
        
        for (const attempt of attemptsData) {
          userIds.add(attempt.user_id);
          
          formattedAttempts.push({
            id: attempt.id,
            user_id: attempt.user_id,
            question_id: attempt.question_id,
            answer_id: attempt.answer_id,
            response_time: attempt.response_time,
            is_correct: attempt.is_correct,
            score: attempt.score,
            created_at: attempt.created_at,
            question_text: attempt.question?.question_text,
            answer_text: attempt.answer?.answer_text
          });
        }
        
        // Buscar informações dos usuários
        if (userIds.size > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('*')
            .in('id', Array.from(userIds));
            
          if (usersData) {
            // Adicionar informações de usuário às tentativas
            formattedAttempts.forEach(attempt => {
              const user = usersData.find(u => u.id === attempt.user_id);
              if (user) {
                attempt.user = user;
              }
            });
          }
        }
        
        setAttempts(formattedAttempts);
        
        // Calcular o resumo das tentativas
        if (formattedAttempts.length > 0) {
          const userPerformance: { [userId: string]: any } = {};
          
          formattedAttempts.forEach(attempt => {
            if (!userPerformance[attempt.user_id]) {
              userPerformance[attempt.user_id] = {
                userId: attempt.user_id,
                userName: attempt.user?.full_name || 'Usuário desconhecido',
                score: 0,
                correctAnswers: 0,
                totalQuestions: 0,
                totalResponseTime: 0
              };
            }
            
            userPerformance[attempt.user_id].score += attempt.score;
            if (attempt.is_correct) {
              userPerformance[attempt.user_id].correctAnswers += 1;
            }
            userPerformance[attempt.user_id].totalQuestions += 1;
            userPerformance[attempt.user_id].totalResponseTime += attempt.response_time;
          });
          
          // Calcular médias por usuário
          Object.values(userPerformance).forEach((user: any) => {
            user.averageResponseTime = user.totalResponseTime / user.totalQuestions;
            delete user.totalResponseTime;
          });
          
          // Calcular o resumo geral
          const totalAttempts = formattedAttempts.length;
          const correctAnswers = formattedAttempts.filter(a => a.is_correct).length;
          const totalScore = formattedAttempts.reduce((sum, a) => sum + a.score, 0);
          const totalResponseTime = formattedAttempts.reduce((sum, a) => sum + a.response_time, 0);
          
          setSummary({
            totalAttempts,
            correctAnswers,
            incorrectAnswers: totalAttempts - correctAnswers,
            averageScore: totalScore / totalAttempts,
            averageResponseTime: totalResponseTime / totalAttempts,
            userPerformance: Object.values(userPerformance)
          });
        }
        
      } catch (error) {
        console.error('Erro ao carregar resultados do quiz:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizResults();
  }, [trackId]);
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Filtrar tentativas por usuário selecionado
  const filteredAttempts = selectedUserId 
    ? attempts.filter(a => a.user_id === selectedUserId)
    : attempts;
  
  if (loading) return <LoadingScreen />;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resultados do Quiz</h1>
          <p className="text-gray-600">
            {track && (
              <span>
                Trilha: <span className="font-medium">{track.name}</span>
              </span>
            )}
          </p>
        </div>
        <Link
          to={`/admin/tracks/${trackId}`}
          className="flex items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
          Voltar para Trilha
        </Link>
      </div>
      
      {!attempts.length ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum resultado de quiz disponível</h3>
          <p className="mt-1 text-sm text-gray-500">
            Não há tentativas de quiz registradas para esta trilha.
          </p>
        </div>
      ) : (
        <>
          {/* Resumo */}
          {summary && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Resumo</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Total de Tentativas</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{summary.totalAttempts}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Taxa de Acerto</div>
                  <div className="mt-1 text-2xl font-semibold text-green-600">
                    {Math.round((summary.correctAnswers / summary.totalAttempts) * 100)}%
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Pontuação Média</div>
                  <div className="mt-1 text-2xl font-semibold text-blue-600">
                    {Math.round(summary.averageScore)}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Tempo Médio de Resposta</div>
                  <div className="mt-1 text-2xl font-semibold text-indigo-600">
                    {formatTime(summary.averageResponseTime)}
                  </div>
                </div>
              </div>
              
              <h3 className="text-md font-medium text-gray-900 mb-3">Desempenho por Usuário</h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taxa de Acerto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pontuação Total
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tempo Médio
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.userPerformance.map((user) => (
                      <tr key={user.userId} className={selectedUserId === user.userId ? 'bg-blue-50' : undefined}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.correctAnswers}/{user.totalQuestions} ({Math.round((user.correctAnswers / user.totalQuestions) * 100)}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{Math.round(user.score)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatTime(user.averageResponseTime)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => setSelectedUserId(selectedUserId === user.userId ? null : user.userId)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            {selectedUserId === user.userId ? 'Mostrar todos' : 'Ver detalhes'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Tentativas detalhadas */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {selectedUserId 
                  ? `Tentativas de ${attempts.find(a => a.user_id === selectedUserId)?.user?.full_name || 'Usuário'}`
                  : 'Todas as Tentativas'
                }
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pergunta
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resposta
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tempo de Resposta
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pontuação
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resultado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attempt.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.user?.full_name || 'Usuário desconhecido'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {attempt.question_text || `Pergunta #${attempt.question_id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {attempt.answer_text || `Resposta #${attempt.answer_id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatTime(attempt.response_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.score}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.is_correct ? (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircleIcon className="h-5 w-5 mr-1" />
                            Correta
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600">
                            <XCircleIcon className="h-5 w-5 mr-1" />
                            Incorreta
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminQuizResults; 