import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { movementsService } from "../services/movementsService";

export function useMovements() {
  const [movements, setMovements] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const load = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await movementsService.list();

        setMovements(data);
      } catch (err) {
        console.error(err);

        setError(
          "Não foi possível carregar o histórico."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    movements,
    loading,
    error,

    reload: load,
  };
}