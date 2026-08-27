import { useCallback, useEffect, useState } from "react";
import { productionService } from "../services/productionService";

export function useProduction() {
  const [recipes, setRecipes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r, h] = await Promise.all([
        productionService.listRecipes(),
        productionService.listHistory(),
      ]);
      setRecipes(r);
      setHistory(h);
    } catch (e) {
      console.error(e);
      setError(e.message || "Não foi possível carregar a produção.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveRecipe = async (data) => {
    setBusy(true); setError("");
    try { const r = await productionService.createRecipe(data); await load(); return r; }
    catch (e) { setError(e.message || "Não foi possível salvar a ficha."); throw e; }
    finally { setBusy(false); }
  };

  const removeRecipe = async (productId) => {
    setBusy(true); setError("");
    try { await productionService.removeRecipe(productId); await load(); }
    catch (e) { setError(e.message || "Não foi possível excluir a ficha."); throw e; }
    finally { setBusy(false); }
  };

  const registerProduction = async (data) => {
    setBusy(true); setError("");
    try { const r = await productionService.register(data); await load(); return r; }
    catch (e) { setError(e.message || "Não foi possível registrar a produção."); throw e; }
    finally { setBusy(false); }
  };

  return { recipes, history, loading, busy, error, reload: load, saveRecipe, removeRecipe, registerProduction };
}
