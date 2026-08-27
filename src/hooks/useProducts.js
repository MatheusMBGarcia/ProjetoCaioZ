import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { productsService } from "../services/productsService";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await productsService.list();

      setProducts(data);
    } catch (err) {
      console.error(err);

      setError(
        "Não foi possível carregar os produtos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = async (data) => {
    setBusy(true);
    setError("");

    try {
      const product =
        await productsService.create(data);

      await load();

      return product;
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Não foi possível cadastrar o produto."
      );

      throw err;
    } finally {
      setBusy(false);
    }
  };

  const updateProduct = async (id, data) => {
    setBusy(true);
    setError("");

    try {
      const product =
        await productsService.update(id, data);

      await load();

      return product;
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Não foi possível atualizar o produto."
      );

      throw err;
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (id) => {
    setBusy(true);
    setError("");

    try {
      await productsService.remove(id);

      await load();

      return true;
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Não foi possível excluir o produto."
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
    products,
    loading,
    busy,
    error,

    reload: load,

    createProduct,
    updateProduct,
    removeProduct,
  };
}