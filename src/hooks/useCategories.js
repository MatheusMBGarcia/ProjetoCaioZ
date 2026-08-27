import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { categoriesService } from "../services/categoriesService";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await categoriesService.list();

      setCategories(data);
    } catch (err) {
      console.error(err);

      setError(
        "Não foi possível carregar as categorias."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = async (data) => {
    setBusy(true);
    setError("");

    try {
      const category =
        await categoriesService.create(data);

      await load();

      return category;
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Não foi possível cadastrar a categoria."
      );

      throw err;
    } finally {
      setBusy(false);
    }
  };

  const updateCategory = async (id, data) => {
    setBusy(true);
    setError("");

    try {
      const category =
        await categoriesService.update(id, data);

      await load();

      return category;
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Não foi possível atualizar a categoria."
      );

      throw err;
    } finally {
      setBusy(false);
    }
  };

  const removeCategory = async (id) => {
    setBusy(true);
    setError("");

    try {
      await categoriesService.remove(id);

      await load();

      return true;
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Não foi possível excluir a categoria."
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
    categories,
    loading,
    busy,
    error,

    reload: load,

    createCategory,
    updateCategory,
    removeCategory,
  };
}