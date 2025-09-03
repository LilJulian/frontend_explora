import * as solicitudes from "../helpers/solicitudes.js";
import { error, success } from "../helpers/alertas.js";

export function loginController() {
  const formulario = document.querySelector('#form');
  if (!formulario) return;

  formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datos = {
      correo: document.querySelector('#correo').value.trim(),
      contrasena: document.querySelector('#contrasena').value.trim()
    };

    if (!datos.correo || !datos.contrasena) {
      error("Debes ingresar correo y contraseña");
      return;
    }

    try {
      let response = await solicitudes.post('auth/login', datos);

      console.log("Respuesta login:", response);

      if (response.error) {
        error(response.error);
        return;
      }

if (response.access_token) {
    let confirmacion = await success("Login exitoso");
    if (confirmacion.isConfirmed) {
        // Guardar tokens en localStorage
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
        localStorage.setItem("id_rol", response.id_rol); // Guardamos el rol también
        console.log(response.id_rol);
        

        const rol = Number(response.id_rol);
        
        // Redirección según rol
switch (rol) {
    case 1: // Admin
        window.location.href = '#/admin';
        break;
    case 2: // Usuario normal
        window.location.href = '#/cliente';
        break;
    case 3: // Super administrador
        window.location.href = '#/superadmin';
        break;
    default:
        window.location.href = '#/login'; // Fallback
}

    }
} else {
    error("Respuesta inesperada del servidor");
}


    } catch (err) {
      console.error("❌ Error en login:", err);
      error("Ocurrió un error al intentar iniciar sesión");
    }
  });
}
