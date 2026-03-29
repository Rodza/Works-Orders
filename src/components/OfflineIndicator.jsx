import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showSync, setShowSync] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowSync(true);
      setTimeout(() => setShowSync(false), 3000);
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online && !showSync) return null;

  return (
    <div className={`text-center text-sm py-2 px-4 font-medium ${
      online
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800'
    }`}>
      {online ? 'Back online - syncing...' : 'You are offline - changes will sync when connected'}
    </div>
  );
}
