import { API_CONFIG } from "../../config/dataSource";

export async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  try {
    const response = await fetch(`${API_CONFIG.baseURL}${path}`, {
      ...options,
      headers: {"Content-Type":"application/json", ...(options.headers || {})},
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return response.status === 204 ? null : response.json();
  } finally {
    clearTimeout(timer);
  }
}