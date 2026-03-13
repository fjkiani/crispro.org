import { useState, useCallback } from 'react';
import { get, post, ApiError } from '../api/client';
import type { PlatinumWindowResponse, PlatinumWindowRequest } from '../types/platinum';

interface ScoreState {
  data: PlatinumWindowResponse | null;
  loading: boolean;
  error: string | null;
}

export function usePlatinumScore() {
  const [state, setState] = useState<ScoreState>({
    data: null,
    loading: false,
    error: null,
  });

  const runDemo = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await get<PlatinumWindowResponse>('/api/v1/platinum-window/demo');
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError
        ? `${err.status}: ${err.detail}`
        : 'Network error';
      setState({ data: null, loading: false, error: message });
    }
  }, []);

  const scorePatient = useCallback(async (request: PlatinumWindowRequest, apiKey: string) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await post<PlatinumWindowResponse>(
        '/api/v1/platinum-window/score',
        request,
        { 'X-API-Key': apiKey },
      );
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError
        ? `${err.status}: ${err.detail}`
        : 'Network error';
      setState({ data: null, loading: false, error: message });
    }
  }, []);

  return { ...state, runDemo, scorePatient };
}
