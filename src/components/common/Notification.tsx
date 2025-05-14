import { Fragment, useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import type { NotificationType, NotificationProps } from '../../types/notification';

const Notification = ({
  type,
  title,
  message,
  show,
  onClose,
  autoClose = true,
  duration = 5000,
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
    
    if (show && autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" aria-hidden="true" />;
      case 'error':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" aria-hidden="true" />;
      case 'warning':
        return <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" aria-hidden="true" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-400';
      case 'error':
        return 'border-red-400';
      case 'warning':
        return 'border-yellow-400';
      case 'info':
        return 'border-blue-400';
    }
  };

  return (
    <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        <Transition
          show={isVisible}
          as={Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={`max-w-sm w-full ${getBgColor()} shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border ${getBorderColor()}`}>
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getIcon()}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">{title}</p>
                  <p className="mt-1 text-sm text-gray-500">{message}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    type="button"
                    className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => {
                      setIsVisible(false);
                      onClose();
                    }}
                  >
                    <span className="sr-only">Fechar</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
};

export default Notification; 