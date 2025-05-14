import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userDAO, trackDAO, departmentDAO } from '../../lib/dao';
import LoadingScreen from '../../components/common/LoadingScreen';
import {
  UsersIcon,
  BookOpenIcon,
  RectangleGroupIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

type StatCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  linkTo: string;
  linkText: string;
  color: string;
};

const StatCard = ({ title, value, description, icon, linkTo, linkText, color }: StatCardProps) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd>
              <div className="text-lg font-medium text-gray-900">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <div className="bg-gray-50 px-5 py-3">
      <div className="text-sm">
        <Link to={linkTo} className="font-medium text-primary-600 hover:text-primary-500">
          {linkText}
        </Link>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTracks: 0,
    totalDepartments: 0,
    completionRate: "0%",
    activeAssignments: 0,
    certificatesIssued: 0,
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Buscar estatísticas básicas
        const usersCount = await userDAO.count();
        const tracksCount = await trackDAO.count();
        const departmentsCount = await departmentDAO.count();
        
        // Buscar informações de atribuições
        const assignmentsStats = await userDAO.getAssignmentsStats();
        
        // Calcular taxa de conclusão
        const completionRate = assignmentsStats.total > 0
          ? Math.round((assignmentsStats.completed / assignmentsStats.total) * 100)
          : 0;
        
        // Certificados emitidos
        const certificatesCount = await userDAO.getCertificatesCount();
        
        setStats({
          totalUsers: usersCount,
          totalTracks: tracksCount,
          totalDepartments: departmentsCount,
          completionRate: `${completionRate}%`,
          activeAssignments: assignmentsStats.active,
          certificatesIssued: certificatesCount,
        });
        
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  if (loading) return <LoadingScreen />;
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="mt-1 text-gray-600">Visão geral da plataforma Go Academy</p>
      </div>
      
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Usuários"
          value={stats.totalUsers}
          description="Total de usuários registrados na plataforma"
          icon={<UsersIcon className="h-6 w-6 text-white" />}
          linkTo="/admin/users"
          linkText="Ver todos os usuários"
          color="bg-blue-500"
        />
        
        <StatCard
          title="Trilhas"
          value={stats.totalTracks}
          description="Total de trilhas de aprendizado"
          icon={<BookOpenIcon className="h-6 w-6 text-white" />}
          linkTo="/admin/tracks"
          linkText="Gerenciar trilhas"
          color="bg-green-500"
        />
        
        <StatCard
          title="Departamentos"
          value={stats.totalDepartments}
          description="Total de departamentos na organização"
          icon={<RectangleGroupIcon className="h-6 w-6 text-white" />}
          linkTo="/admin/departments"
          linkText="Ver departamentos"
          color="bg-indigo-500"
        />
        
        <StatCard
          title="Taxa de Conclusão"
          value={stats.completionRate}
          description="Percentual médio de conclusão de trilhas"
          icon={<ChartBarIcon className="h-6 w-6 text-white" />}
          linkTo="/admin/reports"
          linkText="Ver relatórios detalhados"
          color="bg-purple-500"
        />
        
        <StatCard
          title="Atividades Ativas"
          value={stats.activeAssignments}
          description="Atividades em andamento atualmente"
          icon={<DocumentTextIcon className="h-6 w-6 text-white" />}
          linkTo="/admin/assignments"
          linkText="Gerenciar atividades"
          color="bg-yellow-500"
        />
        
        <StatCard
          title="Certificados"
          value={stats.certificatesIssued}
          description="Total de certificados emitidos"
          icon={<AcademicCapIcon className="h-6 w-6 text-white" />}
          linkTo="/admin/certificates"
          linkText="Ver certificados"
          color="bg-red-500"
        />
      </div>
      
      {/* Seção de ações rápidas */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/users/new"
            className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <UsersIcon className="mx-auto h-8 w-8 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Adicionar Usuário
            </span>
          </Link>
          
          <Link
            to="/admin/departments/new"
            className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <RectangleGroupIcon className="mx-auto h-8 w-8 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Novo Departamento
            </span>
          </Link>
          
          <Link
            to="/admin/tracks/new"
            className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <BookOpenIcon className="mx-auto h-8 w-8 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Criar Trilha
            </span>
          </Link>
          
          <Link
            to="/admin/assignments/new"
            className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Atribuir Atividade
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 