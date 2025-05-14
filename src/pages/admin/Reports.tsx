import { useState, useEffect } from 'react';
import { userDAO, trackDAO, departmentDAO, assignmentDAO } from '../../lib/dao';
import type { Department, TrackWithExtras } from '../../types/app';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tracks, setTracks] = useState<TrackWithExtras[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [reportType, setReportType] = useState<string>('completion');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carregar departamentos e trilhas para os filtros
        const deps = await departmentDAO.getAll();
        setDepartments(deps);

        const { data: tracksData } = await trackDAO.getTracks(1, 100);
        setTracks(tracksData);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const generateReport = async () => {
      if (!reportType) return;

      setLoading(true);
      try {
        let data;

        switch (reportType) {
          case 'completion':
            data = await generateCompletionReport();
            break;
          case 'progress':
            data = await generateProgressReport();
            break;
          case 'department':
            data = await generateDepartmentReport();
            break;
          case 'time':
            data = await generateTimeReport();
            break;
          default:
            data = null;
        }

        setReportData(data);
      } catch (error) {
        console.error('Erro ao gerar relatório:', error);
      } finally {
        setLoading(false);
      }
    };

    generateReport();
  }, [reportType, selectedDepartmentId, selectedTrackId]);

  // Gera relatório de conclusão de trilhas
  const generateCompletionReport = async () => {
    // Simulação de dados - numa implementação real, buscaríamos do banco
    const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Concluídos',
            data: [12, 19, 15, 25, 32, 28],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
          {
            label: 'Total Atribuído',
            data: [22, 29, 30, 40, 45, 50],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Taxa de Conclusão de Trilhas',
          },
        },
      },
    };
  };

  // Gera relatório de progresso por dia
  const generateProgressReport = async () => {
    // Simulação de dados
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Vídeos Assistidos',
            data: [65, 59, 80, 81, 56, 25, 10],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Progresso Diário',
          },
        },
      },
    };
  };

  // Gera relatório por departamento
  const generateDepartmentReport = async () => {
    // Simulação de dados
    return {
      type: 'pie',
      data: {
        labels: ['TI', 'RH', 'Marketing', 'Vendas', 'Financeiro'],
        datasets: [
          {
            label: 'Progresso por Departamento',
            data: [85, 65, 70, 55, 90],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Progresso por Departamento (%)',
          },
        },
      },
    };
  };

  // Gera relatório de tempo médio para conclusão
  const generateTimeReport = async () => {
    // Simulação de dados
    const labels = ['Curso 1', 'Curso 2', 'Curso 3', 'Curso 4', 'Curso 5'];
    
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Tempo Médio (dias)',
            data: [5, 8, 3, 10, 7],
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Tempo Médio para Conclusão',
          },
        },
      },
    };
  };

  const renderChart = () => {
    if (!reportData) return null;

    switch (reportData.type) {
      case 'bar':
        return <Bar data={reportData.data} options={reportData.options} />;
      case 'pie':
        return <Pie data={reportData.data} options={reportData.options} />;
      case 'line':
        return <Line data={reportData.data} options={reportData.options} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600">Análise de desempenho e progresso de aprendizado</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Relatório
            </label>
            <select
              id="report-type"
              className="input-field"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="completion">Taxa de Conclusão</option>
              <option value="progress">Progresso Diário</option>
              <option value="department">Progresso por Departamento</option>
              <option value="time">Tempo para Conclusão</option>
            </select>
          </div>

          <div>
            <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <select
              id="department-filter"
              className="input-field"
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
            >
              <option value="">Todos</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="track-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Trilha
            </label>
            <select
              id="track-filter"
              className="input-field"
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
            >
              <option value="">Todas</option>
              {tracks.map(track => (
                <option key={track.id} value={track.id}>{track.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                // Forçar regeneração do relatório
                const currentType = reportType;
                setReportType('');
                setTimeout(() => setReportType(currentType), 10);
              }}
            >
              Gerar Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Relatório */}
      {loading ? (
        <LoadingScreen />
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="w-full h-96">
            {reportData ? (
              renderChart()
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Selecione um tipo de relatório para começar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Métricas adicionais - Resumo */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Usuários Ativos</h3>
            <p className="text-3xl font-bold text-primary-600">78%</p>
            <p className="text-sm text-gray-500 mt-1">dos usuários acessaram a plataforma na última semana</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Taxa de Conclusão</h3>
            <p className="text-3xl font-bold text-green-600">65%</p>
            <p className="text-sm text-gray-500 mt-1">das atribuições são concluídas dentro do prazo</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tempo Médio</h3>
            <p className="text-3xl font-bold text-blue-600">5.2 dias</p>
            <p className="text-sm text-gray-500 mt-1">para conclusão de uma trilha</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports; 