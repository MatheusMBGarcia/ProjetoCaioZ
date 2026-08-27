import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { suppliersService } from "../services/suppliersService";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await suppliersService.list();

      setSuppliers(data);
    } catch (err) {
      console.error(err);

      setError(
        "Não foi possível carregar os fornecedores."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplier = async (data) => {
    setBusy(true);
    setError("");

    try {
      const supplier =
        await suppliersService.create(data);

      await load();

      return supplier;
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Não foi possível cadastrar o fornecedor."
      );

      throw err;
    } finally {
      setBusy(false);
    }
  };

  const updateSupplier = async (id, data) => {
    setBusy(true);
    setError("");

    try {
      const supplier =
        await suppliersService.update(id, data);

      await load();

      return supplier;
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Não foi possível atualizar o fornecedor."
      );

      throw err;
    } finally {
      setBusy(false);
    }
  };

  const removeSupplier = async (id) => {
    setBusy(true);
    setError("");

    try {
      await suppliersService.remove(id);

      await load();

      return true;
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Não foi possível excluir o fornecedor."
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
    suppliers,
    loading,
    busy,
    error,

    reload: load,

    createSupplier,
    updateSupplier,
    removeSupplier,
  };
}