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

export const isAuth = async (requiredPermission = null) => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return false;

    try {
        // 1. Validar token
        let response = await get("auth/validate", true);
        if (!response.valid) {
            const refreshOk = await genNewToken();
            if (!refreshOk) return false;
            response = await get("auth/validate", true);
            if (!response.valid) return false;
        }

        // 2. Si no hay permiso requerido → solo autenticación
        if (!requiredPermission) return true;

        // 3. Obtener info del usuario (con permisos)
        const userInfo = await get("auth/me", true);
        if (!userInfo || !userInfo.permisos) return false;

        // 4. Validar permiso
        return userInfo.permisos.includes(requiredPermission);

    } catch (error) {
        console.warn("Error en isAuth:", error);
        return false;
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