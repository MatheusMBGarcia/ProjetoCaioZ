import { apiRequest } from "./apiClient";

export const usersApi = {
  list: () => apiRequest("/api/usuarios"),
  get: (id) => apiRequest(`/api/usuarios/${id}`),
  login: (email, password) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  create: (data) =>
    apiRequest("/api/usuarios", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/api/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    apiRequest(`/api/usuarios/${id}`, {
      method: "DELETE",
    }),
};
