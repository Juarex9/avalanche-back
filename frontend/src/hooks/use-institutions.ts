"use client";

import { useCallback, useEffect, useState } from "react";

export type Institution = {
  id: string;
  walletAddress: string;
  name: string;
  initials: string;
  kycStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type UseInstitutionsResult = {
  institutions: Institution[];
  loading: boolean;
  error: string | null;
  db: boolean;
  refetch: () => void;
};

export function useInstitutions(): UseInstitutionsResult {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState(false);

  const fetchInstitutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/institutions");
      const data = (await res.json()) as {
        institutions: Institution[];
        db: boolean;
      };
      setInstitutions(data.institutions ?? []);
      setDb(Boolean(data.db));
    } catch {
      setInstitutions([]);
      setDb(false);
      setError("No se pudo cargar el directorio de instituciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInstitutions();
  }, [fetchInstitutions]);

  return {
    institutions,
    loading,
    error,
    db,
    refetch: fetchInstitutions,
  };
}
