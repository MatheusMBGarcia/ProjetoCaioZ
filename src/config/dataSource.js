export const USE_MOCK_DATA = false;

export const API_CONFIG = {
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:3001",
  timeout: 10000,
};
