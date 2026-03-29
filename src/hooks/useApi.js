import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { immediate = true } = options;

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params });
      setData(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return { data, loading, error, refetch: fetchData, setData };
}
