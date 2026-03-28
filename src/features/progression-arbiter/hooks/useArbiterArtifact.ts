import { useState, useEffect } from 'react';

export function useArbiterArtifact(category: string, filename: string) {
  const [data, setData] = useState<string | any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchArtifact() {
      setLoading(true);
      setError(null);
      try {
        const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${baseURL}/api/v1/progression-arbiter/artifacts/${category}/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch artifact: ${response.statusText}`);
        }

        const isJson = filename.endsWith('.json');
        
        if (isJson) {
           const jsonData = await response.json();
           if (isMounted) setData(jsonData);
        } else {
           const textData = await response.text();
           if (isMounted) setData(textData);
        }
      } catch (err: any) {
        console.error("Artifact Fetch Error:", err);
        if (isMounted) setError(err.message || 'Failed to open artifact');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (category && filename) {
        fetchArtifact();
    }

    return () => { isMounted = false; };
  }, [category, filename]);

  return { data, loading, error };
}
