// src/controllers/registroController.js
import * as validate from "../helpers/validates.js";
import * as solicitudes from "../helpers/solicitudes.js";
import { error, success } from "../helpers/alertas.js";

export const registroController = async (parametros = null) => {
  const formulario = document.getElementById("form");
  if (!formulario) return;

  // evita añadir listeners repetidos si la vista se vuelve a renderizar
  if (formulario.dataset.inited === "true") return;
  formulario.dataset.inited = "true";

  const nombre = document.getElementById("nombre");
  const correo = document.getElementById("correo");
  const telefono = document.getElementById("telefono");
  const contrasena = document.getElementById("contrasena");
  const btn = document.getElementById("btnRegister");

  // VALIDACIONES (tus helpers)
  if (nombre) nombre.addEventListener("keydown", (e) => validate.validarTexto(e));
  if (telefono) telefono.addEventListener("keydown", (e) => validate.validarNumero(e));

  if (nombre) nombre.addEventListener("blur", (e) => { 
    validate.validarCampo(e); 
    validate.validarMinimo(nombre, 3); 
  });
  if (correo) correo.addEventListener("blur", (e) => { 
    validate.validarCampo(e); 
    validate.validarEmail(correo); 
  });
  if (telefono) telefono.addEventListener("blur", (e) => {
    validate.validarCampo(e);
    if (telefono.value && telefono.value.length !== 10) {
      validate.agregarError(telefono, "Debe tener 10 dígitos");
    }
  });
  if (contrasena) contrasena.addEventListener("blur", (e) => { 
    validate.validarCampo(e); 
    validate.validarContrasena(contrasena); 
  });

  // SUBMIT
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (btn) { btn.disabled = true; btn.textContent = "Registrando..."; }

    try {
      if (!validate.validarCampos(e)) {
        if (btn) { btn.disabled = false; btn.textContent = "Registrarse"; }
        return;
      }

      const datos = {
        nombre: nombre.value.trim(),
        correo: correo.value.trim(),
        telefono: telefono.value.trim(),
        contrasena: contrasena.value
      };

      console.log("📤 Enviando datos al backend:", datos);

      const respuesta = await solicitudes.post(  "auth/register", datos);
      console.log("📥 Respuesta del backend:", respuesta);

      if (!respuesta) {
        error("No se recibió respuesta del servidor.");
        return;
      }

      if (respuesta.error) {
        error(respuesta.error || "Error al registrar usuario");
        return;
      }

      await success(respuesta.message || "Usuario creado con éxito");
      location.hash = "#/login";

    } catch (err) {
      console.error("❌ Error en registro:", err);
      error("Ocurrió un error al registrar. Revisa la consola.");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Registrarse"; }
    }
  });
};
