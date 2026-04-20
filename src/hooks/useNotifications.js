/**
 * Hook para gestión de notificaciones (Toasts)
 */
import { useState, useCallback } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const newNotification = { id, message, type };
    
    setNotifications(prev => [...prev, newNotification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, [removeNotification]);

  const success = useCallback((msg, dur) => showNotification(msg, 'success', dur), [showNotification]);
  const error = useCallback((msg, dur) => showNotification(msg, 'error', dur), [showNotification]);
  const info = useCallback((msg, dur) => showNotification(msg, 'info', dur), [showNotification]);
  const warning = useCallback((msg, dur) => showNotification(msg, 'warning', dur), [showNotification]);

  return {
    notifications,
    showNotification,
    removeNotification,
    success,
    error,
    info,
    warning
  };
}
