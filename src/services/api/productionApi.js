import { apiRequest } from "./apiClient";

export const productionApi = {
  listRecipes: () => apiRequest("/api/producao/fichas"),
  createRecipe: (data) => apiRequest("/api/producao/fichas", { method: "POST", body: JSON.stringify(data) }),
  removeRecipe: (productId) => apiRequest(`/api/producao/fichas/${productId}`, { method: "DELETE" }),
  listHistory: () => apiRequest("/api/producao/historico"),
  register: (data) => apiRequest("/api/producao/registrar", { method: "POST", body: JSON.stringify(data) }),
};
