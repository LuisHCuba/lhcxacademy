import { Fragment, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  UsersIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChartBarIcon,
  HomeIcon,
  RectangleGroupIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  category: 'core' | 'content' | 'reports';
};

const navigation: NavigationItem[] = [
  // Núcleo
  { name: 'Dashboard', href: '/admin', icon: HomeIcon, category: 'core' },
  { name: 'Usuários', href: '/admin/users', icon: UsersIcon, category: 'core' },
  { name: 'Departamentos', href: '/admin/departments', icon: RectangleGroupIcon, category: 'core' },
  
  // Conteúdo
  { name: 'Trilhas', href: '/admin/tracks', icon: BookOpenIcon, category: 'content' },
  { name: 'Atribuições', href: '/admin/assignments', icon: DocumentTextIcon, category: 'content' },
  { name: 'Quizzes', href: '/admin/quizzes', icon: QuestionMarkCircleIcon, category: 'content' },
  { name: 'Certificados', href: '/admin/certificates', icon: AcademicCapIcon, category: 'content' },
  
  // Relatórios e Configurações
  { name: 'Relatórios', href: '/admin/reports', icon: ChartBarIcon, category: 'reports' },
  // Remover temporariamente o item Configurações
  // { name: 'Configurações', href: '/admin/settings', icon: Cog6ToothIcon, category: 'reports' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type AdminLayoutProps = {
  children?: ReactNode;
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  // Verificar se o usuário é admin
  if (user?.role !== 'admin') {
    navigate('/403');
    return null;
  }

  // Agrupar navegação por categoria
  const coreNavigation = navigation.filter(item => item.category === 'core');
  const contentNavigation = navigation.filter(item => item.category === 'content');
  const reportsNavigation = navigation.filter(item => item.category === 'reports');

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
            <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-primary-700">
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
                <div className="text-white text-xl font-bold">GoAcademy <span className="text-primary-300">Admin</span></div>
              </div>
              <div className="mt-5 flex-1 h-0 overflow-y-auto">
                <nav className="px-2 space-y-6">
                  <div>
                    <p className="text-primary-200 text-xs uppercase tracking-wider font-semibold mb-2 px-2">Núcleo</p>
                    <div className="space-y-1">
                      {coreNavigation.map((item) => (
                        <Link
                          key={`mobile-core-${item.name}`}
                          to={item.href}
                          className={classNames(
                            location.pathname === item.href
                              ? 'bg-primary-800 text-white'
                              : 'text-primary-100 hover:bg-primary-600',
                            'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              location.pathname === item.href
                                ? 'text-primary-100'
                                : 'text-primary-300 group-hover:text-primary-100',
                              'mr-4 flex-shrink-0 h-6 w-6'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-primary-200 text-xs uppercase tracking-wider font-semibold mb-2 px-2">Conteúdo</p>
                    <div className="space-y-1">
                      {contentNavigation.map((item) => (
                        <Link
                          key={`mobile-content-${item.name}`}
                          to={item.href}
                          className={classNames(
                            location.pathname === item.href
                              ? 'bg-primary-800 text-white'
                              : 'text-primary-100 hover:bg-primary-600',
                            'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              location.pathname === item.href
                                ? 'text-primary-100'
                                : 'text-primary-300 group-hover:text-primary-100',
                              'mr-4 flex-shrink-0 h-6 w-6'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-primary-200 text-xs uppercase tracking-wider font-semibold mb-2 px-2">Relatórios</p>
                    <div className="space-y-1">
                      {reportsNavigation.map((item) => (
                        <Link
                          key={`mobile-reports-${item.name}`}
                          to={item.href}
                          className={classNames(
                            location.pathname === item.href
                              ? 'bg-primary-800 text-white'
                              : 'text-primary-100 hover:bg-primary-600',
                            'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              location.pathname === item.href
                                ? 'text-primary-100'
                                : 'text-primary-300 group-hover:text-primary-100',
                              'mr-4 flex-shrink-0 h-6 w-6'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
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
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-700">
              <div className="text-white text-xl font-bold">GoAcademy <span className="text-primary-300">Admin</span></div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto bg-primary-800">
              <nav className="flex-1 px-2 py-4 space-y-6">
                <div>
                  <p className="text-primary-200 text-xs uppercase tracking-wider font-semibold mb-2 px-2">Núcleo</p>
                  <div className="space-y-1">
                    {coreNavigation.map((item) => (
                      <Link
                        key={`desktop-core-${item.name}`}
                        to={item.href}
                        className={classNames(
                          location.pathname === item.href
                            ? 'bg-primary-900 text-white'
                            : 'text-primary-100 hover:bg-primary-700 hover:text-white',
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            location.pathname === item.href
                              ? 'text-primary-100'
                              : 'text-primary-300 group-hover:text-primary-100',
                            'mr-3 flex-shrink-0 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-primary-200 text-xs uppercase tracking-wider font-semibold mb-2 px-2">Conteúdo</p>
                  <div className="space-y-1">
                    {contentNavigation.map((item) => (
                      <Link
                        key={`desktop-content-${item.name}`}
                        to={item.href}
                        className={classNames(
                          location.pathname === item.href
                            ? 'bg-primary-900 text-white'
                            : 'text-primary-100 hover:bg-primary-700 hover:text-white',
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            location.pathname === item.href
                              ? 'text-primary-100'
                              : 'text-primary-300 group-hover:text-primary-100',
                            'mr-3 flex-shrink-0 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-primary-200 text-xs uppercase tracking-wider font-semibold mb-2 px-2">Relatórios</p>
                  <div className="space-y-1">
                    {reportsNavigation.map((item) => (
                      <Link
                        key={`desktop-reports-${item.name}`}
                        to={item.href}
                        className={classNames(
                          location.pathname === item.href
                            ? 'bg-primary-900 text-white'
                            : 'text-primary-100 hover:bg-primary-700 hover:text-white',
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            location.pathname === item.href
                              ? 'text-primary-100'
                              : 'text-primary-300 group-hover:text-primary-100',
                            'mr-3 flex-shrink-0 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
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
              <span className="text-lg font-semibold text-gray-900">
                Painel Administrativo
              </span>
              
              {/* Botão para voltar ao dashboard do usuário */}
              <Link
                to="/dashboard"
                className="ml-4 flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Voltar ao Dashboard
              </Link>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
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
                      <span className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-white" />
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
          <div className="py-6 px-4 sm:px-6 md:px-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 