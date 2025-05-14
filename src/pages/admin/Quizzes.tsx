import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { quizDAO, trackDAO } from '../../lib/dao';
import { supabase } from '../../lib/supabase';
import type { QuizQuestionWithAnswers, Track } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowUturnLeftIcon, TrashIcon } from '@heroicons/react/24/outline';

const AdminQuizzes = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const trackIdParam = searchParams.get('trackId');
  const navigate = useNavigate();

  const isNewQuiz = quizId === 'new';
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<Track | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestionWithAnswers | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionWithAnswers[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestionWithAnswers | null>(null);
  const [editMode, setEditMode] = useState(isNewQuiz);
  const [saving, setSaving] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(
    trackIdParam ? parseInt(trackIdParam) : null
  );
  const [userId, setUserId] = useState<string | null>(null);

  // Novo formulário de pergunta
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    track_id: selectedTrackId || 0,
    time_limit: 60, // Tempo limite padrão: 60 segundos
    options: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ]
  });

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const { data } = await trackDAO.getTracks(1, 100);
        setTracks(data);
      } catch (error) {
        console.error('Erro ao carregar trilhas:', error);
      }
    };

    fetchTracks();
  }, []);

  useEffect(() => {
    const fetchQuizData = async () => {
      setLoading(true);
      try {
        if (isNewQuiz) {
          // Configurar nova pergunta
          if (selectedTrackId) {
            const trackData = await trackDAO.getById(selectedTrackId);
            if (trackData) {
              setTrack(trackData);
              setSelectedTrackId(trackData.id);
              setQuestionForm(prev => ({
                ...prev,
                track_id: trackData.id
              }));
            }
          }
          setLoading(false);
          return;
        }

        if (!quizId) return;

        // Se estiver editando um quiz existente
        const quizQuestionId = parseInt(quizId);
        const questionsData = await quizDAO.getQuizQuestionById(quizQuestionId);
        
        if (questionsData) {
          setQuiz(questionsData);
          setSelectedQuestion(questionsData);
          
          // Buscar a trilha relacionada
          if (questionsData.track_id) {
            const trackData = await trackDAO.getById(questionsData.track_id);
            if (trackData) {
              setTrack(trackData);
              setSelectedTrackId(trackData.id);
            }
          }
          
          // Buscar todas as questões desta trilha
          const allQuestions = await quizDAO.getQuizQuestionsWithAnswers(questionsData.track_id);
          setQuestions(allQuestions);
          
          // Preencher o formulário com os dados da pergunta
          setQuestionForm({
            question_text: questionsData.question_text,
            track_id: questionsData.track_id,
            time_limit: questionsData.time_limit || 60,
            options: questionsData.answers.map(answer => ({
              text: answer.answer_text,
              is_correct: answer.is_correct
            }))
          });
        } else {
          navigate('/admin/quizzes');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, isNewQuiz, navigate, selectedTrackId]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    getCurrentUser();
  }, []);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setQuestionForm(prev => ({
      ...prev,
      question_text: e.target.value
    }));
  };

  const handleTrackChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const trackIdValue = e.target.value;
    const newTrackId = trackIdValue ? parseInt(trackIdValue) : null;
    setSelectedTrackId(newTrackId);
    
    if (newTrackId) {
      setQuestionForm(prev => ({
        ...prev,
        track_id: newTrackId
      }));
      
      try {
        const trackData = await trackDAO.getById(newTrackId);
        if (trackData) {
          setTrack(trackData);
        }
        
        // Buscar perguntas desta trilha
        const allQuestions = await quizDAO.getQuizQuestionsWithAnswers(newTrackId);
        setQuestions(allQuestions);
      } catch (error) {
        console.error('Erro ao carregar dados da trilha:', error);
      }
    } else {
      setQuestionForm(prev => ({
        ...prev,
        track_id: 0
      }));
      setTrack(null);
      setQuestions([]);
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'is_correct', value: string | boolean) => {
    setQuestionForm(prev => {
      const newOptions = [...prev.options];
      
      if (field === 'is_correct') {
        // Se estamos marcando uma opção como correta, as outras devem ser falsas
        newOptions.forEach((option, i) => {
          newOptions[i] = { ...option, is_correct: i === index ? true : false };
        });
      } else if (field === 'text') {
        // Trate o valor como string apenas quando o campo for 'text'
        newOptions[index] = { 
          ...newOptions[index], 
          text: value as string 
        };
      }
      
      return {
        ...prev,
        options: newOptions
      };
    });
  };

  const handleAddOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { text: '', is_correct: false }
      ]
    }));
  };

  const handleRemoveOption = (index: number) => {
    if (questionForm.options.length <= 2) {
      alert('Um quiz precisa ter pelo menos duas opções.');
      return;
    }
    
    setQuestionForm(prev => {
      const newOptions = prev.options.filter((_, i) => i !== index);
      
      // Se removermos a opção correta, definir a primeira como correta
      if (prev.options[index].is_correct) {
        newOptions[0] = { ...newOptions[0], is_correct: true };
      }
      
      return {
        ...prev,
        options: newOptions
      };
    });
  };

  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setQuestionForm(prev => ({
      ...prev,
      time_limit: isNaN(value) ? 60 : value
    }));
  };

  const validateForm = () => {
    try {
      // Verificar se a pergunta foi preenchida
      if (!questionForm.question_text.trim()) {
        alert('O texto da pergunta é obrigatório.');
        return false;
      }
      
      // Verificar se a trilha foi selecionada
      if (!questionForm.track_id) {
        alert('Selecione uma trilha para esta pergunta.');
        return false;
      }
      
      // Verificar se todas as opções estão preenchidas
      const emptyOptions = questionForm.options.filter(option => !option.text.trim());
      if (emptyOptions.length > 0) {
        alert('Todas as opções precisam ser preenchidas.');
        return false;
      }
      
      // Verificar se há pelo menos uma opção correta
      const hasCorrectOption = questionForm.options.some(option => option.is_correct);
      if (!hasCorrectOption) {
        alert('Pelo menos uma opção precisa ser marcada como correta.');
        return false;
      }
      
      // Verificar se há pelo menos duas opções
      if (questionForm.options.length < 2) {
        alert('O quiz precisa ter pelo menos duas opções.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro na validação do formulário:', error);
      alert('Ocorreu um erro ao validar o formulário. Verifique o console para mais detalhes.');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log para debug
    console.log('Estado atual do formulário:', JSON.stringify({
      question_text: questionForm.question_text,
      track_id: questionForm.track_id,
      time_limit: questionForm.time_limit,
      options: questionForm.options
    }, null, 2));
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      if (!userId) {
        alert('Você precisa estar logado para criar ou editar um quiz.');
        setSaving(false);
        return;
      }
      
      // Garantir que track_id seja um número válido
      const trackId = typeof questionForm.track_id === 'string' 
        ? parseInt(questionForm.track_id) 
        : questionForm.track_id;
      
      if (isNaN(trackId) || trackId <= 0) {
        alert('Selecione uma trilha válida para esta pergunta.');
        setSaving(false);
        return;
      }
      
      if (isNewQuiz) {
        // Criar nova pergunta
        const newQuestion = await quizDAO.createQuestion({
          question_text: questionForm.question_text,
          track_id: trackId,
          time_limit: questionForm.time_limit,
          created_by: userId,
          answers: questionForm.options.map((option, index) => ({
            answer_text: option.text,
            is_correct: option.is_correct,
            order_index: index
          }))
        });
        
        if (newQuestion) {
          alert('Pergunta criada com sucesso!');
          navigate(`/admin/quizzes/${newQuestion.id}`);
        } else {
          alert('Erro ao criar pergunta. Verifique os campos e tente novamente.');
        }
      } else if (quiz) {
        // Atualizar pergunta existente
        const updatedQuestion = await quizDAO.updateQuestion(parseInt(quizId as string), {
          question_text: questionForm.question_text,
          track_id: trackId,
          time_limit: questionForm.time_limit,
          answers: questionForm.options.map((option, index) => ({
            answer_text: option.text,
            is_correct: option.is_correct,
            order_index: index
          }))
        });
        
        if (updatedQuestion) {
          alert('Pergunta atualizada com sucesso!');
          setEditMode(false);
          
          // Atualizar dados do quiz
          const refreshedQuestion = await quizDAO.getQuizQuestionById(parseInt(quizId as string));
          if (refreshedQuestion) {
            setQuiz(refreshedQuestion);
            setSelectedQuestion(refreshedQuestion);
            
            // Atualizar lista de perguntas da trilha
            const trackQuestions = await quizDAO.getQuizQuestionsWithAnswers(refreshedQuestion.track_id);
            setQuestions(trackQuestions);
          }
        } else {
          alert('Erro ao atualizar pergunta. Verifique os campos e tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar pergunta:', error);
      alert(`Ocorreu um erro ao salvar a pergunta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!quizId || isNewQuiz) return;
    
    if (window.confirm('Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.')) {
      try {
        const success = await quizDAO.deleteQuestion(parseInt(quizId));
        
        if (success) {
          alert('Pergunta excluída com sucesso!');
          navigate(`/admin/tracks/${selectedTrackId}`);
        }
      } catch (error) {
        console.error('Erro ao excluir pergunta:', error);
        alert('Ocorreu um erro ao excluir a pergunta. Tente novamente.');
      }
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNewQuiz ? 'Nova Pergunta' : editMode ? 'Editar Pergunta' : 'Detalhes da Pergunta'}
          </h1>
          <p className="text-gray-600">
            {track && (
              <span>
                Trilha: <span className="font-medium">{track.name}</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-3">
          {!isNewQuiz && selectedTrackId && (
            <Link
              to={`/admin/tracks/${selectedTrackId}`}
              className="flex items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowUturnLeftIcon className="mr-2 h-4 w-4" />
              Voltar para Trilha
            </Link>
          )}
          
          {!isNewQuiz && !editMode && (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Editar Pergunta
            </button>
          )}
          
          {!isNewQuiz && (
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
      
      <div className="bg-white shadow rounded-lg">
        {/* Formulário de criação/edição */}
        {(isNewQuiz || editMode) && (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <label htmlFor="track" className="block text-sm font-medium text-gray-700 mb-1">
                Trilha
              </label>
              <select
                id="track"
                className="input-field"
                value={questionForm.track_id || ''}
                onChange={handleTrackChange}
                disabled={!isNewQuiz && quiz?.track_id !== undefined}
              >
                <option value="">Selecione uma trilha</option>
                {tracks.map(track => (
                  <option key={track.id} value={track.id}>{track.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label htmlFor="question_text" className="block text-sm font-medium text-gray-700 mb-1">
                Pergunta
              </label>
              <textarea
                id="question_text"
                rows={3}
                className="input-field"
                value={questionForm.question_text}
                onChange={handleQuestionChange}
                placeholder="Digite a pergunta aqui..."
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="time_limit" className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Limite (segundos)
              </label>
              <input
                type="number"
                id="time_limit"
                className="input-field"
                value={questionForm.time_limit}
                onChange={handleTimeLimitChange}
                min="10"
                max="300"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tempo máximo para responder esta pergunta (de 10 a 300 segundos).
              </p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Opções de Resposta (marque a correta)
                </label>
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:text-primary-800"
                  onClick={handleAddOption}
                >
                  + Adicionar Opção
                </button>
              </div>
              
              <div className="space-y-3">
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-grow">
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="text"
                          className="input-field"
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          placeholder={`Opção ${index + 1}`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={option.is_correct}
                        onChange={() => handleOptionChange(index, 'is_correct', true)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Correta</label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              {!isNewQuiz && (
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                {saving ? 'Salvando...' : isNewQuiz ? 'Criar Pergunta' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}
        
        {/* Visualização da pergunta */}
        {!isNewQuiz && !editMode && selectedQuestion && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900">{selectedQuestion.question_text}</h3>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Opções de Resposta:</h4>
              <div className="space-y-3">
                {selectedQuestion.answers.map((answer, index) => (
                  <div 
                    key={answer.id} 
                    className={`p-3 rounded-md ${
                      answer.is_correct 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-2 text-sm font-medium">{index + 1}.</span>
                      <span>{answer.answer_text}</span>
                      {answer.is_correct && (
                        <span className="ml-auto text-sm font-medium text-green-700">
                          Resposta Correta
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Lista de outras perguntas na trilha */}
      {!isNewQuiz && questions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Outras Perguntas nesta Trilha</h2>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {questions.map(q => (
                <li key={q.id}>
                  <Link
                    to={`/admin/quizzes/${q.id}`}
                    className={`block px-6 py-4 hover:bg-gray-50 ${
                      q.id === parseInt(quizId as string) ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{q.question_text}</div>
                    <div className="text-sm text-gray-500">
                      {q.answers.length} opções • {q.answers.filter(a => a.is_correct).length} resposta(s) correta(s)
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizzes; 