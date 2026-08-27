import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { movementsService } from "../services/movementsService";
import { productsService } from "../services/productsService";

export function useExits() {
  const [exits, setExits] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const load = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const [
          exitsData,
          productsData,
        ] = await Promise.all([
          movementsService.list(
            "SAIDA"
          ),

          productsService.list(),
        ]);

        setExits(
          exitsData
        );

        setProducts(
          productsData
        );
      } catch (err) {
        console.error(err);

        setError(
          "Não foi possível carregar as saídas."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createExit =
    async (data) => {
      setBusy(true);
      setError("");

      try {
        const exit =
          await movementsService.createExit(
            data
          );

        await load();

        return exit;
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Não foi possível registrar a saída."
        );

        throw err;
      } finally {
        setBusy(false);
      }
    };

  useEffect(() => {
    load();
  }, [load]);

  return {
    exits,
    products,

    loading,
    busy,
    error,

    reload: load,

    createExit,
  };
}