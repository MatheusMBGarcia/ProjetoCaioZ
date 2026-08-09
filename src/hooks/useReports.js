import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { productsService } from "../services/productsService";
import { movementsService } from "../services/movementsService";

export function useReports() {
  const [products, setProducts] =
    useState([]);

  const [movements, setMovements] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        productsData,
        movementsData,
      ] = await Promise.all([
        productsService.list(),
        movementsService.list(),
      ]);

      setProducts(productsData);
      setMovements(movementsData);
    } catch (err) {
      console.error(err);

      setError(
        "Não foi possível carregar os relatórios."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    products,
    movements,
    loading,
    error,
    reload: load,
  };
}