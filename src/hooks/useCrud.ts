import { useState, useEffect, useCallback } from "react";
import { Entity } from "../types/crud";
import { SortingState } from "@tanstack/react-table";

interface UseCrudProps {
  collectionName: string;
  connectionString: string;
}

export function useCrud({ collectionName, connectionString }: UseCrudProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedSearch, setAdvancedSearch] = useState<Record<string, unknown>>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL(`/api/crud/${collectionName}`, window.location.origin);

      if (searchQuery) {
        url.searchParams.set("query", searchQuery);
      }

      if (Object.keys(advancedSearch).length > 0) {
        url.searchParams.set("filters", JSON.stringify(advancedSearch));
      }

      const response = await fetch(url, {
        headers: {
          "x-mongodb-connection": connectionString,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch entities");

      const data = await response.json();
      setEntities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch entities");
    } finally {
      setLoading(false);
    }
  }, [collectionName, connectionString, searchQuery, advancedSearch]);

  const createEntity = async (data: Record<string, unknown>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/crud/${collectionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connectionString, data }),
      });

      if (!response.ok) throw new Error("Failed to create entity");

      await fetchEntities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entity");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEntity = async (id: string, data: Record<string, unknown>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/crud/${collectionName}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connectionString, id, data }),
      });

      if (!response.ok) throw new Error("Failed to update entity");

      await fetchEntities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entity");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEntity = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/crud/${collectionName}?id=${id}`,
        {
          method: "DELETE",
          headers: {
            "x-mongodb-connection": connectionString,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete entity");

      await fetchEntities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entity");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  return {
    entities,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    advancedSearch,
    setAdvancedSearch,
    sorting,
    setSorting,
    createEntity,
    updateEntity,
    deleteEntity,
  };
} 