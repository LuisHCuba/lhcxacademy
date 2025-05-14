import { createContext, useContext, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import Notification from '../components/common/Notification';
import type { NotificationType, NotificationData } from '../types/notification';

interface NotificationContextProps {
  showNotification: (type: NotificationType, title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const idCounterRef = useRef(0);  // Usar useRef em vez de useState para evitar re-renderizações

  const showNotification = (type: NotificationType, title: string, message: string) => {
    const id = idCounterRef.current;
    idCounterRef.current += 1;  // Incrementar o contador de ID
    
    setNotifications(prev => [
      ...prev,
      {
        id,
        type,
        title,
        message,
        show: true
      }
    ]);

    // Remover a notificação automaticamente após 5 segundos
    setTimeout(() => {
      closeNotification(id);
    }, 5000);
  };

  const closeNotification = (id: number) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      <div className="fixed top-4 right-4 z-50 space-y-4 max-w-md">
        {notifications.map(notification => (
          <Notification
            key={`notification-${notification.id}`}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            show={notification.show}
            onClose={() => closeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext; 