// src/helpers/solicitudes.js

const url = "http://localhost:8080/pruebaApi/api";

/**
 * 🔧 Helper para codificar objetos a formato x-www-form-urlencoded
 */
const encodeForm = (data) =>
  Object.keys(data)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");

/**
 * 🔧 Helper para añadir el token en headers si existe
 */
function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Realiza una petición GET al backend
 * @param {string} endpoint - Ruta del endpoint (ejemplo: "auth/refresh")
 */
export const get = async (endpoint) => {
  const res = await fetch(`${url}/${endpoint}`, {
    method: "GET",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) throw new Error(`Error GET ${endpoint}: ${res.status}`);
  return await res.json();
};

/**
 * Realiza una petición POST al backend
 * @param {object} datos - Datos a enviar en el body
 * @param {string} endpoint - Ruta del endpoint (ejemplo: "auth/login")
 */
// solicitudes.js
export const post = async (endpoint, datos = {}) => {
  const res = await fetch(`${url}/${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...getAuthHeaders(),
    },
    body: new URLSearchParams(datos),
  });

  if (!res.ok) throw new Error(`Error POST ${endpoint}: ${res.status}`);
  return await res.json();
};



/**
 * Realiza una petición PUT al backend
 * @param {object} datos - Datos a enviar en el body
 * @param {string} endpoint - Ruta del endpoint (ejemplo: "usuarios/1")
 */
export const put = async (datos, endpoint) => {
  const res = await fetch(`${url}/${endpoint}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json", // 👈 importante
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datos), // 👈 enviamos JSON plano
  });

  if (!res.ok) throw new Error(`Error PUT ${endpoint}: ${res.status}`);
  return await res.json();
};




/**
 * Realiza una petición DELETE al backend
 * @param {string} endpoint - Ruta del endpoint (ejemplo: "usuarios/1")
 */
export const delet = async (endpoint) => {
  const res = await fetch(`${url}/${endpoint}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) throw new Error(`Error DELETE ${endpoint}: ${res.status}`);
  return await res.json();
};
