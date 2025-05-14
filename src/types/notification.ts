export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  show: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export interface NotificationData {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  show: boolean;
} 