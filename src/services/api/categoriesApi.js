import { apiRequest } from "./apiClient";

export const categoriesApi = {
  list: () => apiRequest("/api/categorias"),
  create: (data) =>
    apiRequest("/api/categorias", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/api/categorias/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    apiRequest(`/api/categorias/${id}`, {
      method: "DELETE",
    }),
};
