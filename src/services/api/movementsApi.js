import { apiRequest } from "./apiClient";

export const movementsApi = {
  list: (type = null) =>
    apiRequest(
      type
        ? `/api/movimentacoes?type=${encodeURIComponent(type)}`
        : "/api/movimentacoes"
    ),

  createEntry: (data) =>
    apiRequest("/api/movimentacoes/entrada", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createExit: (data) =>
    apiRequest("/api/movimentacoes/saida", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
