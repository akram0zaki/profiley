import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useCurrentProfile } from './profile';

export function useProcessedCvReadiness() {
  const { appUser, loading: profileLoading } = useCurrentProfile();
  const [hasProcessedCv, setHasProcessedCv] = useState(false);
  const [processedCvCount, setProcessedCvCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading) {
      setLoading(true);
      return;
    }
    if (!appUser?.id) {
      setHasProcessedCv(false);
      setProcessedCvCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void supabase
      .from('uploaded_documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', appUser.id)
      .eq('document_kind', 'cv')
      .eq('processing_status', 'completed')
      .then(({ count, error }) => {
        if (cancelled) return;
        if (error) {
          setHasProcessedCv(false);
          setProcessedCvCount(0);
          setLoading(false);
          return;
        }
        const nextCount = count ?? 0;
        setHasProcessedCv(nextCount > 0);
        setProcessedCvCount(nextCount);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appUser?.id, profileLoading]);

  return { hasProcessedCv, processedCvCount, loading: profileLoading || loading };
}