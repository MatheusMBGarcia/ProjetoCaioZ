import { useCallback, useEffect, useState } from "react";
import { productsService } from "../services/productsService";

export function useProducts() {
  const [products,setProducts] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setProducts(await productsService.list()); }
    catch { setError("Não foi possível carregar os produtos."); }
    finally { setLoading(false); }
  },[]);

  useEffect(() => { load(); },[load]);
  return {products,loading,error,reload:load};
}