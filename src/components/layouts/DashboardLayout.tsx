import { Fragment, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  BookOpenIcon,
  DocumentTextIcon,
  HomeIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { ReactNode } from 'react';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  roles: string[];
};

const navigation: NavigationItem[] = [
  { name: 'Início', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'instructor', 'collaborator'] },
  { name: 'Cursos', href: '/dashboard/tracks', icon: BookOpenIcon, roles: ['admin', 'instructor', 'collaborator'] },
  { name: 'Atividades', href: '/dashboard/assignments', icon: DocumentTextIcon, roles: ['admin', 'instructor', 'collaborator'] },
  { name: 'Certificados', href: '/dashboard/certificates', icon: AcademicCapIcon, roles: ['admin', 'instructor', 'collaborator'] },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type DashboardLayoutProps = {
  children?: ReactNode;
};

// Tipo para as notificações do usuário
type UserNotification = {
  id: number;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const { user, signOut } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Exemplo de notificações do usuário (em um sistema real viriam da API)
  const userNotifications: UserNotification[] = [
    { id: 101, title: 'Nova trilha disponível!', message: 'Uma nova trilha foi adicionada para seu departamento.', date: '2 horas atrás', read: false },
    { id: 102, title: 'Certificado emitido', message: 'Seu certificado para a trilha "React Avançado" foi emitido.', date: '1 dia atrás', read: true },
    { id: 103, title: 'Prazo expirando', message: 'Uma atividade atribuída a você expira em 2 dias.', date: '2 dias atrás', read: false },
  ];

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const handleNotificationClick = (notification: UserNotification) => {
    // Marcar notificação como lida (em um sistema real faria uma chamada API)
    // E mostrar uma notificação toast
    showNotification('info', notification.title, notification.message);
    setShowNotificationMenu(false);
  };

  // Filtra navegação com base no papel do usuário
  const filteredNavigation = navigation.filter((item) => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar mobile */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 flex z-40 md:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Fechar sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-shrink-0 flex items-center px-4">
                <img
                  className="h-8 w-auto"
                  src="/logo.jpeg"
                  alt="GoAcademy"
                />
              </div>
              <div className="mt-5 flex-1 h-0 overflow-y-auto">
                <nav className="px-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <Link
                      key={`mobile-nav-${item.name}`}
                      to={item.href}
                      className={classNames(
                        location.pathname === item.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          location.pathname === item.href
                            ? 'text-gray-500'
                            : 'text-gray-400 group-hover:text-gray-500',
                          'mr-4 flex-shrink-0 h-6 w-6'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Espaço em branco */}
          </div>
        </Dialog>
      </Transition.Root>

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-gray-200">
              <img
                className="h-8 w-auto"
                src="/logo.jpeg"
                alt="GoAcademy"
              />
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 bg-white space-y-1">
                {filteredNavigation.map((item) => (
                  <Link
                    key={`desktop-nav-${item.name}`}
                    to={item.href}
                    className={classNames(
                      location.pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        location.pathname === item.href
                          ? 'text-gray-500'
                          : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-6 w-6'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Mostra link para área admin apenas para usuários admin */}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center text-sm px-3 py-1.5 ml-2 rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100"
                >
                  <ShieldCheckIcon className="h-5 w-5 mr-1.5" />
                  Área Administrativa
                </Link>
              )}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notificações */}
              <div className="relative">
                <button
                  type="button"
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                >
                  <span className="sr-only">Ver notificações</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-xs text-white">
                    {unreadCount}
                  </span>
                )}
                
                {/* Menu de notificações */}
                {showNotificationMenu && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-medium text-gray-900">Notificações</h3>
                    </div>
                    <div className="py-1 max-h-60 overflow-y-auto">
                      {userNotifications.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          Nenhuma notificação
                        </div>
                      ) : (
                        userNotifications.map(notification => (
                          <button
                            key={`user-notification-${notification.id}`}
                            className={`w-full text-left px-4 py-2 text-sm ${notification.read ? 'text-gray-500' : 'text-gray-900 bg-gray-50'}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="font-medium">{notification.title}</div>
                            <div className="text-xs mt-1">{notification.message}</div>
                            <div className="text-xs mt-1 text-gray-400">{notification.date}</div>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-gray-50"
                        onClick={() => setShowNotificationMenu(false)}
                      >
                        Marcar todas como lidas
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Perfil do usuário */}
              <Menu as="div" className="ml-3 relative">
                <div>
                  <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <span className="sr-only">Abrir menu de usuário</span>
                    <span className="inline-block mr-2 text-gray-700">{user?.full_name}</span>
                    {user?.avatar_url ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.avatar_url}
                        alt=""
                      />
                    ) : (
                      <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      </span>
                    )}
                    <ChevronDownIcon className="ml-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/dashboard/profile"
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          Meu Perfil
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/dashboard/assignments"
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          Minhas Atividades
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleSignOut}
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block w-full text-left px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          Sair
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 