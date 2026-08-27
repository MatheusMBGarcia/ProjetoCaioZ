import { apiRequest } from "./apiClient";

export const productsApi = {
  list: () => apiRequest("/api/produtos"),
  get: (id) => apiRequest(`/api/produtos/${id}`),
  create: (data) =>
    apiRequest("/api/produtos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/api/produtos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    apiRequest(`/api/produtos/${id}`, {
      method: "DELETE",
    }),
};
