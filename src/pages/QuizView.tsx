import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackDAO, quizDAO } from '../lib/dao';
import type { QuizQuestionWithAnswers, Track } from '../types/app';
import LoadingScreen from '../components/common/LoadingScreen';

const QuizView = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<Track | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionWithAnswers[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!user || !trackId) return;
      
      setLoading(true);
      try {
        // Buscar detalhes da trilha
        const trackData = await trackDAO.getById(parseInt(trackId));
        if (!trackData) {
          console.error('Trilha não encontrada');
          navigate('/dashboard');
          return;
        }
        
        // Buscar perguntas do quiz
        const quizQuestions = await quizDAO.getQuizQuestionsWithAnswers(parseInt(trackId));
        
        if (quizQuestions.length === 0) {
          console.error('Esta trilha não possui perguntas de quiz');
          navigate(`/dashboard/tracks/${trackId}`);
          return;
        }
        
        setTrack(trackData);
        setQuestions(quizQuestions);
        setTotalScore(quizQuestions.length * 100); // 100 pontos por questão
        setStartTime(Date.now());
      } catch (error) {
        console.error('Erro ao carregar quiz:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [user, trackId, navigate]);
  
  const handleAnswerSelect = (answerId: number) => {
    setSelectedAnswerId(answerId);
  };
  
  const handleNextQuestion = async () => {
    if (selectedAnswerId === null) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = currentQuestion.answers.find(a => a.id === selectedAnswerId);
    
    if (!selectedAnswer || !user || !trackId) return;
    
    // Calcular tempo de resposta e pontuação
    const responseTime = Math.floor((Date.now() - startTime) / 1000);
    const isCorrect = selectedAnswer.is_correct;
    
    // Pontuação base: 100 pontos por acerto
    // Bônus por rapidez: até 50 pontos extras se responder dentro de metade do tempo limite
    const timeBonus = isCorrect ? Math.max(0, 50 - (responseTime / (currentQuestion.time_limit / 2)) * 50) : 0;
    const questionScore = isCorrect ? Math.round(100 + timeBonus) : 0;
    
    // Salvar tentativa
    try {
      await quizDAO.saveQuizAttempt(
        user.id,
        currentQuestion.id,
        selectedAnswerId,
        responseTime,
        isCorrect,
        questionScore
      );
      
      // Atualizar contagem de respostas corretas
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
      }
      
      // Atualizar pontuação
      setScore(prev => prev + questionScore);
    } catch (error) {
      console.error('Erro ao salvar tentativa:', error);
    }
    
    // Avançar para próxima pergunta ou finalizar quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerId(null);
      setStartTime(Date.now());
    } else {
      setQuizCompleted(true);
      setShowResults(true);
    }
  };
  
  if (loading) return <LoadingScreen />;
  if (!track || questions.length === 0) return <div className="p-8 text-center">Quiz não encontrado.</div>;
  
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link 
          to={`/dashboard/tracks/${trackId}`}
          className="inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Voltar para {track.name}
        </Link>
      </div>
      
      {showResults ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Resultados do Quiz</h2>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col items-center mb-8">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900">{score} / {totalScore}</div>
                <div className="text-gray-600">pontos obtidos</div>
              </div>
              
              <div className="w-full max-w-md bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-primary-600 h-4 rounded-full" 
                  style={{ width: `${(score / totalScore) * 100}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 text-center mt-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{correctAnswers} / {questions.length}</div>
                  <div className="text-gray-600">respostas corretas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{Math.round((correctAnswers / questions.length) * 100)}%</div>
                  <div className="text-gray-600">taxa de acerto</div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <Link 
                to={`/dashboard/tracks/${trackId}`} 
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Voltar para a Trilha
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Quiz - {track.name}</h2>
              <div className="text-gray-600">
                Pergunta {currentQuestionIndex + 1} de {questions.length}
              </div>
            </div>
            
            {/* Barra de progresso */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-primary-600 h-2 rounded-full" 
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Pergunta */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{currentQuestion.question_text}</h3>
              <div className="text-sm text-gray-500">
                Tempo limite: {currentQuestion.time_limit} segundos
              </div>
            </div>
            
            {/* Respostas */}
            <div className="space-y-3 mb-8">
              {currentQuestion.answers.map(answer => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  className={`w-full text-left p-4 rounded-lg border ${
                    selectedAnswerId === answer.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {answer.answer_text}
                </button>
              ))}
            </div>
            
            {/* Botão de próxima */}
            <div className="text-right">
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswerId === null}
                className={`px-4 py-2 rounded-md ${
                  selectedAnswerId === null
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {currentQuestionIndex === questions.length - 1 ? 'Finalizar' : 'Próxima'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView; 