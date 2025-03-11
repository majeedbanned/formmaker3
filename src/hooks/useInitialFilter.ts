import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { decryptFilter } from '@/utils/encryption';

interface UseInitialFilterProps {
  postedFilter?: Record<string, unknown>;
  hardcodedFilter?: Record<string, unknown>;
}

export function useInitialFilter({ postedFilter, hardcodedFilter }: UseInitialFilterProps = {}) {
  const searchParams = useSearchParams();
  const [initialFilter, setInitialFilter] = useState<Record<string, unknown>>({});

  useEffect(() => {
    // Get filter from query string if it exists
    const encryptedFilter = searchParams.get('filter');
    const queryFilter = encryptedFilter ? decryptFilter(encryptedFilter) : {};

    // Combine all filters with priority: posted > query string > hardcoded
    const combinedFilter = {
      ...(hardcodedFilter || {}),  // Lowest priority
      ...queryFilter,              // Medium priority
      ...(postedFilter || {}),     // Highest priority
    };

    setInitialFilter(combinedFilter);
  }, [searchParams, postedFilter, hardcodedFilter]);

  return initialFilter;
} 