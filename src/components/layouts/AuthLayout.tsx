import { Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children?: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="/logo.svg"
          alt="GoAcademy"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          GoAcademy
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Plataforma de aprendizado corporativo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 