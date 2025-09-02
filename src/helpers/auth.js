import { post, get } from "./solicitudes.js";

export const login = async (correo, contrasena) => {
    const response = await post("auth/login", { correo, contrasena });

    if (response.access_token) {
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
        return true;
    }
    return false;
};

export const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
};

export const isAuth = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return false; // Sin token → no autenticado

    try {
        // Validamos el token actual
        let response = await get("auth/validate", true);

        if (response.valid) return true;

        // Token expirado → intentar renovar
        const refreshOk = await genNewToken();
        if (refreshOk) {
            // Validamos de nuevo con el token renovado
            response = await get("auth/validate", true);
            return response.valid === true;
        }

        return false; // no se pudo renovar
    } catch (error) {
        console.warn("Usuario no autenticado o token inválido:", error);
        return false; // cualquier error → no autenticado
    }
};


const genNewToken = async () => {
    try {
        const refresh_token = localStorage.getItem("refresh_token");
        if (!refresh_token) return false;

        const response = await post("auth/refresh", { refresh_token });

        if (response.access_token) {
            localStorage.setItem("access_token", response.access_token);
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error al renovar token:", error);
        return false;
    }
};

export const getUserInfo = async () => {
    try {
        return await get("auth/me", true);
    } catch (error) {
        console.error("Error al obtener info de usuario:", error);
        return null;
    }
};
