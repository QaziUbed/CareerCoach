import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

interface UseApiCallResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  deps: any[] = []
): UseApiCallResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Something went wrong';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    fetchData();
  }, deps);

  return { data, isLoading, error, refetch: fetchData };
}
