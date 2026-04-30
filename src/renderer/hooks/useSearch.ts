import { useMemo, useState } from 'react';

interface UseSearchOptions<T> {
  items: T[];
  searchBy: (item: T) => string[];
  initialQuery?: string;
}

export function useSearch<T>({ items, searchBy, initialQuery = '' }: UseSearchOptions<T>) {
  const [query, setQuery] = useState(initialQuery);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) =>
      searchBy(item).some((value) => value.toLowerCase().includes(normalized))
    );
  }, [items, query, searchBy]);

  return {
    query,
    setQuery,
    filteredItems,
    clearQuery: () => setQuery('')
  };
}
