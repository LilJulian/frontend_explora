import { routers } from "./routes.js";
import { isAuth } from "../helpers/auth.js";
import Swal from "sweetalert2";

export const router = async (elemento) => {
    const hash = location.hash.slice(1);
    let arregloHash = hash.split("/");

    const [ruta, parametros] = recorrerRutas(routers, arregloHash);

    if (!ruta) {
        elemento.innerHTML = `<h2>Ruta no encontrada</h2>`;
        return;
    }

    // 🔹 Validar autenticación y permisos
    if (ruta.private) {
        const tieneAcceso = await isAuth(ruta.permission); // <-- ahora recibe permiso
        console.log(ruta.permission);
        console.log(tieneAcceso);
        
        if (!tieneAcceso) {
            await Swal.fire({
                icon: "error",
                title: "Acceso denegado",
                text: ruta.permission
                    ? "No tienes permisos para entrar en esta página"
                    : "Debes iniciar sesión para acceder a esta página",
                confirmButtonText: "Ir al inicio"
            });
            location.hash = "#/viajes"; // 👈 tu página principal de cliente
            return;
        }
    }

    // Cargar vista y ejecutar controlador
    await cargarVista(ruta.path, elemento);
    if (ruta.controller) await ruta.controller(parametros);
};

const recorrerRutas = (routers, arregloHash) => {
    let parametros = {};

    // Procesar parámetros si existen (en la cuarta posición)
    if (arregloHash.length === 4) {
        let parametrosSeparados = arregloHash[3].split("&");
        parametrosSeparados.forEach((parametro) => {
            let [clave, valor] = parametro.split("=");
            parametros[clave] = valor;
        });
        arregloHash.pop();
    }

    for (const key in routers) {
        // Ruta inicial (ej: #/)
        if (arregloHash.length === 1 && arregloHash[0] === "") {
            return [routers[key], parametros];
        }

        // Coincidencia con ruta
        if (key === arregloHash[1]) {
            for (const elemento in routers[key]) {
                if (typeof routers[key][elemento] === "object") {
                    return arregloHash.length === 2
                        ? [routers[key][elemento], parametros]
                        : [routers[key][arregloHash[2]], parametros];
                }
            }
            return [routers[key], parametros];
        }
    }

    return [null, {}];
};

const cargarVista = async (path, elemento) => {
    try {
        const seccion = await fetch(`./src/views/${path}`);
        if (!seccion.ok) throw new Error("No pudimos leer el archivo");
        const html = await seccion.text();
        elemento.innerHTML = html;
    } catch (error) {
        elemento.innerHTML = `<h2>Error cargando la vista: ${path}</h2>`;
        console.error(error);
    }
};
