import * as validate from "../helpers/validates.js";
import * as solicitudes from "../helpers/solicitudes.js";
import { success, error } from "../helpers/alertas.js";

export const usuarioController = async () => {
  const tablaBody = document.querySelector("#tablaUsuarios tbody");
  const form = document.getElementById("form");
  const btnRegister = document.getElementById("btnRegister");
  const btnReset = document.getElementById("btnReset");

  const nombre = document.getElementById("nombre");
  const correo = document.getElementById("correo");
  const telefono = document.getElementById("telefono");
  const contrasena = document.getElementById("contrasena");

      const cargarUsuarios = async () => {
      try {
        const usuarios = await solicitudes.get("usuarios");
        tablaBody.innerHTML = "";

        usuarios.forEach(u => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${u.id}</td>
            <td>${u.nombre}</td>
            <td>${u.correo}</td>
            <td>${u.telefono || ""}</td>
            <td>${u.rolNombre}</td>
          `;
          tablaBody.appendChild(tr);
        });

      } catch (err) {
        console.error(err);
        error("No se pudieron cargar los usuarios.");
      }
    };

  // 👉 SOLO si el form existe
  if (form && form.dataset.inited !== "true") {
    form.dataset.inited = "true";

    // Restricciones de entrada en tiempo real
    if (nombre) nombre.addEventListener("keypress", validate.validarTexto);
    if (telefono) {
      telefono.addEventListener("keypress", validate.validarNumero);
      telefono.addEventListener("keypress", (e) => {
        if (e.target.value.length >= 10 && !["Backspace","Delete"].includes(e.key)) {
          e.preventDefault();
        }
      });
    }

    // Limpiar formulario
    btnReset?.addEventListener("click", () => {
      form.reset();
      [...form.querySelectorAll(".error")].forEach(c => c.classList.remove("error"));
    });

    // Submit (solo registrar)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // ✅ Usamos tu validación global
      if (!validate.validarCampos(e)) return;

      const datos = {
        nombre: nombre.value.trim(),
        correo: correo.value.trim(),
        telefono: telefono.value.trim(),
        contrasena: contrasena.value,
        rol: 2
      };

      try {
        btnRegister.disabled = true;
        btnRegister.textContent = "Creando...";

        const resp = await solicitudes.post("auth/register", datos);
        await success(resp.message || "Usuario creado");

        form.reset();

      } catch (err) {
        console.error(err);
        error("Ocurrió un error, revisa la consola.");
      } finally {
        btnRegister.disabled = false;
        btnRegister.textContent = "Guardar";
      }
    });
  }

  // 👉 SOLO si la tabla existe
  if (tablaBody) {
    await cargarUsuarios();
  }
};
