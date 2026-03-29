import { useState, useEffect, useCallback } from 'react';
import { fullSync, getPendingSyncCount } from '../services/sync';

export function useOffline() {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      triggerSync();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count on mount
    getPendingSyncCount().then(setPendingCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      await fullSync();
      const count = await getPendingSyncCount();
      setPendingCount(count);
    } catch {
      // Sync failed, will retry later
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  return { online, syncing, pendingCount, triggerSync };
}
