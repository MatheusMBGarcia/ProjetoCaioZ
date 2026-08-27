import { apiRequest } from "./apiClient";

export const suppliersApi = {
  list: () => apiRequest("/api/fornecedores"),
  get: (id) => apiRequest(`/api/fornecedores/${id}`),
  create: (data) =>
    apiRequest("/api/fornecedores", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/api/fornecedores/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    apiRequest(`/api/fornecedores/${id}`, {
      method: "DELETE",
    }),
};
