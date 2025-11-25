// src/lib/api.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

/**
 * Llama a la API del backend.
 * - Adjunta automáticamente el Bearer token de Clerk si existe.
 * - Lanza error si la respuesta no es JSON o si el backend responde !ok.
 */
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // 🔐 Añadir token de Clerk si existe (para rutas con requireAuth)
  try {
    if (typeof window !== "undefined" && window.Clerk?.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn("No se pudo obtener token de Clerk", err);
    // No tiramos error aquí; dejamos que el backend responda 401 si hace falta
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    console.error("Respuesta NO JSON desde", url, text);
    throw new Error("NON_JSON_RESPONSE");
  }

  if (!res.ok) {
    const message = data?.error || `Error HTTP ${res.status}`;
    const e = new Error(message);
    e.status = res.status;
    e.data = data;
    throw e;
  }

  return data;
}

/* ====================== NOTIFICACIONES ====================== */

export function getNotificationPreferences() {
  return apiFetch("/api/notifications/preferences");
}

export function updateNotificationPreferences(preferences) {
  return apiFetch("/api/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}
