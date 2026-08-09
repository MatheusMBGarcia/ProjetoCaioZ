import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { movementsService } from "../services/movementsService";
import { productsService } from "../services/productsService";
import { suppliersService } from "../services/suppliersService";

export function useEntries() {
  const [entries, setEntries] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [suppliers, setSuppliers] =
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
          entriesData,
          productsData,
          suppliersData,
        ] = await Promise.all([
          movementsService.list(
            "ENTRADA"
          ),

          productsService.list(),

          suppliersService.list(),
        ]);

        setEntries(
          entriesData
        );

        setProducts(
          productsData
        );

        setSuppliers(
          suppliersData.filter(
            (supplier) =>
              supplier.active !== false
          )
        );
      } catch (err) {
        console.error(err);

        setError(
          "Não foi possível carregar as entradas."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createEntry =
    async (data) => {
      setBusy(true);
      setError("");

      try {
        const entry =
          await movementsService.createEntry(
            data
          );

        await load();

        return entry;
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Não foi possível registrar a entrada."
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
    entries,
    products,
    suppliers,

    loading,
    busy,
    error,

    reload: load,

    createEntry,
  };
}