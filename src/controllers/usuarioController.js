import * as validate from "../helpers/validates.js";
import * as solicitudes from "../helpers/solicitudes.js";
import { success, error, confirm } from "../helpers/alertas.js";

export const usuarioController = async () => {
  const tablaBody = document.querySelector("#tablaUsuarios tbody");
  const form = document.getElementById("form");
  const btnRegister = document.getElementById("btnRegister");
  const btnReset = document.getElementById("btnReset");

  // Campos del formulario
  const idInput = document.getElementById("id");
  const nombre = document.getElementById("nombre");
  const correo = document.getElementById("correo");
  const telefono = document.getElementById("telefono");
  const contrasena = document.getElementById("contrasena");

  // Evita añadir listeners repetidos
  if (form.dataset.inited !== "true") {
    form.dataset.inited = "true";

    // Validaciones en tiempo real
    if (nombre) nombre.addEventListener("keydown", (e) => validate.validarTexto(e));
    if (telefono) telefono.addEventListener("keydown", (e) => validate.validarNumero(e));

    // Limpiar formulario
    btnReset.addEventListener("click", () => {
      form.reset();
      idInput.value = "";
      [...form.querySelectorAll(".error")].forEach(c => c.classList.remove("error"));
    });

    // Submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!validate.validarCampos(e)) return;

      const datos = {
        nombre: nombre.value.trim(),
        correo: correo.value.trim(),
        telefono: telefono.value.trim(),
        contrasena: contrasena.value
      };

      try {
        btnRegister.disabled = true;
        btnRegister.textContent = idInput.value ? "Actualizando..." : "Creando...";

        if (idInput.value) {
          // Actualizar
          const resp = await solicitudes.put(datos, `usuarios/${idInput.value}`);
          await success(resp.mensaje || "Usuario actualizado");
        } else {
          // Crear
          const resp = await solicitudes.post(datos, "usuarios");
          await success(resp.mensaje || "Usuario creado");
        }

        form.reset();
        idInput.value = "";
        await cargarUsuarios();

      } catch (err) {
        console.error(err);
        error("Ocurrió un error, revisa la consola.");
      } finally {
        btnRegister.disabled = false;
        btnRegister.textContent = "Guardar";
      }
    });
  }

  // Cargar usuarios en la tabla
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
          <td>
            <button data-id="${u.id}" class="editar">Editar</button>
            <button data-id="${u.id}" class="eliminar">Eliminar</button>
          </td>
        `;
        tablaBody.appendChild(tr);
      });

      // Editar
      tablaBody.querySelectorAll(".editar").forEach(btn => {
        btn.addEventListener("click", async () => {
          const user = await solicitudes.get(`usuarios/${btn.dataset.id}`);
          idInput.value = user.id;
          nombre.value = user.nombre;
          correo.value = user.correo;
          telefono.value = user.telefono || "";
          contrasena.value = user.contrasena || "";
        });
      });

      // Eliminar
      tablaBody.querySelectorAll(".eliminar").forEach(btn => {
        btn.addEventListener("click", async () => {
          const confirmacion = await confirm("¿Deseas eliminar este usuario?");
          if (!confirmacion.isConfirmed) return;

          try {
            const resp = await solicitudes.delet(`usuarios/${btn.dataset.id}`);
            await success(resp.mensaje || "Usuario eliminado");
            await cargarUsuarios();
          } catch (err) {
            console.error(err);
            error("No se pudo eliminar el usuario.");
          }
        });
      });

    } catch (err) {
      console.error(err);
      error("No se pudieron cargar los usuarios.");
    }
  };

  // Carga inicial
  await cargarUsuarios();
};
