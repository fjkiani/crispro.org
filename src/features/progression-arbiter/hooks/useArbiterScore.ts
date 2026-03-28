import { useState, useCallback } from 'react';
import { post, ApiError } from '../../../api/client';
import type { ArbiterScoreResponse, ArbiterScoreRequest, RadiologyParseResponse } from '../types/arbiter';
import { ARBITER_DEFAULTS } from '../constants';

interface ArbiterState {
  form: ArbiterScoreRequest;
  data: ArbiterScoreResponse | null;
  parseResult: RadiologyParseResponse | null;
  loading: boolean;
  error: string | null;
}

export function useArbiterScore() {
  const [state, setState] = useState<ArbiterState>({
    form: ARBITER_DEFAULTS,
    data: null,
    parseResult: null,
    loading: false,
    error: null,
  });

  const setForm = useCallback((form: ArbiterScoreRequest) => {
    setState(prev => ({ ...prev, form }));
  }, []);

  const scoreEvent = useCallback(async (request: ArbiterScoreRequest) => {
    setState(prev => ({ ...prev, data: null, loading: true, error: null }));
    try {
      console.log('Sending payload to backend:', request);
      const data = await post<ArbiterScoreResponse>(
        '/api/v1/progression-arbiter/score',
        request,
      );
      console.log('Received response from backend:', data);
      setState(prev => ({ ...prev, data, loading: false, error: null }));
    } catch (err) {
      const message = err instanceof ApiError
        ? `${err.status}: ${err.detail}`
        : 'Network error';
      setState(prev => ({ ...prev, data: null, loading: false, error: message }));
    }
  }, []);

  const parseReport = useCallback(async (text: string): Promise<RadiologyParseResponse | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await post<RadiologyParseResponse>(
        '/api/v1/progression-arbiter/parse-report',
        { text },
      );
      setState(prev => ({ ...prev, parseResult: result, loading: false }));
      return result;
    } catch (err) {
      const message = err instanceof ApiError
        ? `${err.status}: ${err.detail}`
        : 'Network error';
      setState(prev => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, []);

  return { ...state, setForm, scoreEvent, parseReport };
}
