// src/controllers/usuarioController.js
import * as validate from "../helpers/validates.js";
import * as solicitudes from "../helpers/solicitudes.js";
import Swal from "sweetalert2";

export const usuarioController = async () => {
  const form = document.getElementById("form");
  const btnRegister = document.getElementById("btnRegister");
  const btnReset = document.getElementById("btnReset");
  const tablaBody = document.querySelector("#tablaUsuarios tbody");

  // 🔑 editando y usuarioIdEditar se guardan en dataset del form
  // Así no se pierden cuando cambias de vista
  let editando = form?.dataset.editando === "true";
  let usuarioIdEditar = form?.dataset.usuarioId || null;

  const waitForElement = (selector, timeout = 3000) => {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        const found = document.querySelector(selector);
        if (found) resolve(found);
        else reject(new Error(`Timeout esperando ${selector}`));
      }, timeout);
    });
  };

  // ================== Cargar Roles ==================
  const cargarRoles = async () => {
    try {
      const roles = await solicitudes.get("roles");
      const selectRol = document.getElementById("rol");
      if (!selectRol) return;
      selectRol.innerHTML = `<option value="">Seleccione un rol</option>`;
      roles.forEach((r) => {
        const option = document.createElement("option");
        option.value = r.id;
        option.textContent = r.nombre;
        selectRol.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los roles.",
      });
    }
  };

  // ================== Cargar Usuarios ==================
  const cargarUsuarios = async () => {
    if (!tablaBody) return;
    try {
      const usuarios = await solicitudes.get("usuarios");
      tablaBody.innerHTML = "";

      usuarios.forEach((u) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${u.id}</td>
          <td>${u.nombre}</td>
          <td>${u.correo}</td>
          <td>${u.telefono || ""}</td>
          <td>${u.rolNombre}</td>
          <td class="usuarios__acciones">
            <button class="btnEditar usuarios__btn" data-id="${u.id}">Editar</button>
            <button class="btnEliminar usuarios__btn" data-id="${u.id}">Eliminar</button>
          </td>
        `;
        tablaBody.appendChild(tr);
      });

      // Acción Editar
      tablaBody.querySelectorAll(".btnEditar").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          try {
            const u = await solicitudes.get(`usuarios/${id}`);
            if (!u) return;

            // Guardamos estado ANTES de cambiar de vista
            sessionStorage.setItem("usuarioEditando", "true");
            sessionStorage.setItem("usuarioIdEditar", id);

            location.hash = "#/usuarios"; // 👈 Ir al formulario
          } catch (err) {
            console.error(err);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "No se pudo cargar el usuario.",
            });
          }
        });
      });

      // Acción Eliminar
      tablaBody.querySelectorAll(".btnEliminar").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const confirmacion = await Swal.fire({
            icon: "warning",
            title: "¿Eliminar usuario?",
            text: "Esta acción no se puede deshacer",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
          });

          if (confirmacion.isConfirmed) {
            try {
              const resp = await solicitudes.delet(`usuarios/${id}`);
              await Swal.fire({
                icon: "success",
                title: "Eliminado",
                text: resp.message || "Usuario eliminado",
              });
              await cargarUsuarios();
            } catch (err) {
              console.error(err);
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo eliminar el usuario",
              });
            }
          }
        });
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los usuarios.",
      });
    }
  };

  // ================== Inicializar Formulario ==================
  if (form && form.dataset.inited !== "true") {
    form.dataset.inited = "true";

    await cargarRoles();

    // Recuperar estado si viene de editar
    const editandoStorage = sessionStorage.getItem("usuarioEditando");
    const idStorage = sessionStorage.getItem("usuarioIdEditar");
    if (editandoStorage === "true" && idStorage) {
      editando = true;
      usuarioIdEditar = idStorage;
      form.dataset.editando = "true";
      form.dataset.usuarioId = idStorage;

      try {
        const u = await solicitudes.get(`usuarios/${idStorage}`);
        document.getElementById("id").value = u.id;
        document.getElementById("nombre").value = u.nombre;
        document.getElementById("correo").value = u.correo;
        document.getElementById("telefono").value = u.telefono || "";
        document.getElementById("rol").value = u.rol;
        if (btnRegister) btnRegister.textContent = "Actualizar";
      } catch (error) {
        console.error("Error al cargar datos de edición:", error);
      }
      sessionStorage.removeItem("usuarioEditando");
      sessionStorage.removeItem("usuarioIdEditar");
    }

    const nombre = document.getElementById("nombre");
    const correo = document.getElementById("correo");
    const telefono = document.getElementById("telefono");
    const contrasena = document.getElementById("contrasena");

    // Validaciones en blur
    if (nombre) nombre.addEventListener("blur", (e) => {
      validate.validarCampo(e.target);
      validate.validarMinimo(e.target, 3);
    });

    if (correo) correo.addEventListener("blur", (e) => {
      validate.validarCampo(e.target);
      validate.validarEmail(e.target);
    });

    if (telefono) telefono.addEventListener("blur", (e) => {
      validate.validarCampo(e.target);
      if (e.target.value && e.target.value.length !== 10) {
        validate.agregarError(e.target, "Debe tener 10 dígitos");
      }
    });

    if (contrasena) contrasena.addEventListener("blur", (e) => {
      validate.validarCampo(e.target);
      validate.validarContrasena(e.target);
    });

    // Reset form
    btnReset?.addEventListener("click", () => {
      form.reset();
      form.dataset.editando = "false";
      form.dataset.usuarioId = "";
      editando = false;
      usuarioIdEditar = null;
      if (btnRegister) btnRegister.textContent = "Guardar";
      [...form.querySelectorAll(".error")].forEach((c) => c.classList.remove("error"));
    });

    // Submit form
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (btnRegister) {
        btnRegister.disabled = true;
        btnRegister.textContent = editando ? "Actualizando..." : "Creando...";
      }

      try {
        if (!validate.validarCampos(e)) {
          btnRegister.disabled = false;
          btnRegister.textContent = editando ? "Actualizar" : "Guardar";
          return;
        }

        const datos = {
          nombre: nombre.value.trim(),
          correo: correo.value.trim(),
          telefono: telefono.value.trim(),
          contrasena: contrasena.value,
          rol: parseInt(document.getElementById("rol").value),
        };

        let resp;

        if (editando && usuarioIdEditar) {
          resp = await solicitudes.put(`auth/usuarios/${usuarioIdEditar}`, datos);
          await Swal.fire({
            icon: resp.error ? "error" : "success",
            title: resp.error ? "Error al actualizar" : "Usuario actualizado",
            text: resp.error || resp.message || "",
          });
        } else {
          resp = await solicitudes.post("auth/register", datos);
          if (resp.error) {
            await Swal.fire({
              icon: "error",
              title: "Registro fallido",
              text: resp.error,
            });
            return;
          }
          await Swal.fire({ icon: "success", title: "Usuario creado", text: resp.message || "" });
        }

        form.reset();
        form.dataset.editando = "false";
        form.dataset.usuarioId = "";
        editando = false;
        usuarioIdEditar = null;
        if (btnRegister) btnRegister.textContent = "Guardar";

        location.hash = "#/tablaUsuarios";
        await waitForElement("#tablaUsuarios tbody", 3000);
        await cargarUsuarios();

      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: editando ? "Error al actualizar" : "Error al registrar",
          text: "Revisa la consola para más detalles.",
        });
      } finally {
        btnRegister.disabled = false;
      }
    });
  }

  if (tablaBody) {
    await cargarUsuarios();
  }
};
