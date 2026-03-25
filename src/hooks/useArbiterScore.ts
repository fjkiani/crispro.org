import { useState, useCallback } from 'react';
import { get, post, ApiError } from '../api/client';
import type { ArbiterScoreResponse, ArbiterScoreRequest } from '../types/arbiter';

interface ArbiterState {
  data: ArbiterScoreResponse | null;
  loading: boolean;
  error: string | null;
}

export function useArbiterScore() {
  const [state, setState] = useState<ArbiterState>({
    data: null,
    loading: false,
    error: null,
  });

  const runDemo = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await get<ArbiterScoreResponse>('/api/v1/progression-arbiter/demo');
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError
        ? `${err.status}: ${err.detail}`
        : 'Network error';
      setState({ data: null, loading: false, error: message });
    }
  }, []);

  const scoreEvent = useCallback(async (request: ArbiterScoreRequest) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await post<ArbiterScoreResponse>(
        '/api/v1/progression-arbiter/score',
        request,
      );
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError
        ? `${err.status}: ${err.detail}`
        : 'Network error';
      setState({ data: null, loading: false, error: message });
    }
  }, []);

  return { ...state, runDemo, scoreEvent };
}
