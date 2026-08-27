import { API_CONFIG } from "../../config/dataSource";

export async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    API_CONFIG.timeout
  );

  try {
    const response = await fetch(
      `${API_CONFIG.baseURL}${path}`,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        signal: controller.signal,
      }
    );

    const contentType =
      response.headers.get("content-type") || "";

    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        body?.erro ||
        body?.error ||
        body?.message ||
        (typeof body === "string" ? body : "") ||
        `API ${response.status}`;

      throw new Error(message);
    }

    return response.status === 204 ? null : body;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "A API demorou demais para responder."
      );
    }

    if (
      error instanceof TypeError &&
      String(error.message).toLowerCase().includes("fetch")
    ) {
      throw new Error(
        "Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3001."
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}
