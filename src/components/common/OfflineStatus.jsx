import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      // Hide success notification after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification && isOnline) return null;

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showNotification ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${isOnline ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5" />
            <span className="font-medium text-sm">¡Conexión restablecida!</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 animate-pulse" />
            <div className="flex flex-col">
              <span className="font-medium text-sm">Sin conexión a Internet</span>
              <span className="text-xs opacity-80">La aplicación está funcionando en modo offline.</span>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="ml-2 p-1 hover:bg-red-100 rounded-full transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineStatus;
