import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layouts
import AuthLayout from './components/layouts/AuthLayout';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminLayout from './components/layouts/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import AuthCallback from './pages/auth/AuthCallback';

// Pages - User Dashboard
import Dashboard from './pages/Dashboard';
import Tracks from './pages/Tracks';
import TrackDetails from './pages/TrackDetails';
import CourseDetails from './pages/CourseDetails';
import LessonDetails from './pages/LessonDetails';
import QuizView from './pages/QuizView';
import UserProfile from './pages/UserProfile';
import UserAssignments from './pages/UserAssignments';
import UserAssignmentDetails from './pages/UserAssignmentDetails';
import UserCertificates from './pages/UserCertificates';
import VerifyCertificate from './pages/VerifyCertificate';

// Pages - Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminUserDetails from './pages/admin/UserDetails';
import AdminDepartments from './pages/admin/Departments';
import AdminDepartmentDetails from './pages/admin/DepartmentDetails';
import AdminTracks from './pages/admin/Tracks';
import AdminTrackDetails from './pages/admin/TrackDetails';
import AdminAssignments from './pages/admin/Assignments';
import AdminAssignmentDetails from './pages/admin/AssignmentDetails';
import AdminVideoDetails from './pages/admin/VideoDetails';
import AdminQuizzes from './pages/admin/Quizzes';
import AdminQuizResults from './pages/admin/QuizResults';
import AdminReports from './pages/admin/Reports';
import AdminCertificates from './pages/admin/Certificates';

// Pages - Error
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';

// Cria cliente React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {/* Rota inicial - Redireciona para login se não estiver autenticado */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Rota de verificação de certificado - Publicamente acessível */}
              <Route path="/verify/:id" element={<VerifyCertificate />} />

              {/* Rotas de autenticação */}
              <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="callback" element={<AuthCallback />} />
              </Route>

              {/* Rotas protegidas - Dashboard do usuário */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="tracks" element={<Tracks />} />
                  <Route path="tracks/:trackId" element={<TrackDetails />} />
                  <Route path="courses/:courseId" element={<CourseDetails />} />
                  <Route path="lessons/:lessonId" element={<LessonDetails />} />
                  <Route path="quiz/:trackId" element={<QuizView />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="assignments" element={<UserAssignments />} />
                  <Route path="assignments/:assignmentId" element={<UserAssignmentDetails />} />
                  <Route path="certificates" element={<UserCertificates />} />
                </Route>
              </Route>

              {/* Rotas administrativas - Apenas para admin */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="users/:userId" element={<AdminUserDetails />} />
                  <Route path="departments" element={<AdminDepartments />} />
                  <Route path="departments/:departmentId" element={<AdminDepartmentDetails />} />
                  <Route path="tracks" element={<AdminTracks />} />
                  <Route path="tracks/:trackId" element={<AdminTrackDetails />} />
                  <Route path="videos/:videoId" element={<AdminVideoDetails />} />
                  <Route path="assignments" element={<AdminAssignments />} />
                  <Route path="assignments/:assignmentId" element={<AdminAssignmentDetails />} />
                  <Route path="quizzes" element={<AdminQuizzes />} />
                  <Route path="quizzes/:quizId" element={<AdminQuizzes />} />
                  <Route path="quizzes/:quizId/results" element={<AdminQuizResults />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="certificates" element={<AdminCertificates />} />
                </Route>
              </Route>

              {/* Páginas de erro */}
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
