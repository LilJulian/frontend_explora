// src/controllers/transportesController.js
import * as validate from "../helpers/validates.js";
import * as solicitudes from "../helpers/solicitudes.js";
import { success, error, confirm } from "../helpers/alertas.js";

export const transportesController = async () => {
  const form = document.getElementById("form");
  const btnReset = document.getElementById("btnReset");

  let editando = false;
  let transporteIdEditar = null;

  // ================== Esperar elemento en DOM ==================
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
        else reject(new Error(`Timeout waiting for ${selector}`));
      }, timeout);
    });
  };

  // ================== Cargar Estados ==================
  const cargarEstados = async () => {
    try {
      const estados = await solicitudes.get("estado");
      const selectEstado = document.getElementById("estado");
      if (!selectEstado) return;
      selectEstado.innerHTML = `<option value="">Seleccione un estado</option>`;
      estados.forEach((e) => {
        const option = document.createElement("option");
        option.value = e.id_estado;
        option.textContent = e.estado ? "Activo" : "Inactivo";
        selectEstado.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      error("No se pudieron cargar los estados");
    }
  };

  // ================== Cargar Tipos Transporte ==================
  const cargarTipos = async () => {
    try {
      const tipos = await solicitudes.get("tipotransporte");
      const selectTipo = document.getElementById("tipoTransporte");
      if (!selectTipo) return;
      selectTipo.innerHTML = `<option value="">Seleccione un tipo de transporte</option>`;
      tipos.forEach((t) => {
        const option = document.createElement("option");
        option.value = t.id;
        option.textContent = t.nombre;
        selectTipo.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      error("No se pudieron cargar los tipos de transporte");
    }
  };

  // ================== Cargar Transportes ==================
  const cargarTransportes = async () => {
    const tablaBody = document.querySelector("#tablaTransportes tbody");
    if (!tablaBody) return;
    try {
      const transportes = await solicitudes.get("transporte");
      tablaBody.innerHTML = "";

      transportes.forEach((t) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${t.id}</td>
          <td>${t.nombre}</td>
          <td>${t.matricula || "-"}</td>
          <td>${t.asientos_totales}</td>
          <td>${t.descripcion || "-"}</td>
          <td>${t.estadoNombre}</td>
          <td>${t.tipoTransporteNombre}</td>
          <td>
            <button class="btnEditar" data-id="${t.id}">✏️ Editar</button>
            <button class="btnEliminar" data-id="${t.id}">🗑 Eliminar</button>
          </td>
        `;
        tablaBody.appendChild(tr);
      });

      // acciones
      tablaBody.querySelectorAll(".btnEditar").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          try {
            const t = await solicitudes.get(`transporte/${id}`);
            if (!t) return;

            location.hash = "#/transportes";
            await waitForElement("#form", 3000);
            await cargarEstados();
            await cargarTipos();

            const idHidden = document.getElementById("id");
            const nombreInput = document.getElementById("nombre");
            const matriculaInput = document.getElementById("matricula");
            const asientosInput = document.getElementById("asientos");
            const descripcionInput = document.getElementById("descripcion");
            const selectEstado = document.getElementById("estado");
            const selectTipo = document.getElementById("tipoTransporte");
            const btnRegisterEl = document.getElementById("btnRegister");

            if (idHidden && nombreInput && selectEstado && selectTipo) {
              idHidden.value = t.id;
              nombreInput.value = t.nombre;
              matriculaInput.value = t.matricula ?? "";
              asientosInput.value = t.asientos_totales;
              descripcionInput.value = t.descripcion ?? "";
              selectEstado.value = t.id_estado;
              selectTipo.value = t.id_tipo_transporte;

              editando = true;
              transporteIdEditar = t.id;
              if (btnRegisterEl) btnRegisterEl.textContent = "Actualizar";
            }
          } catch (err) {
            console.error(err);
            error("No se pudo cargar el transporte.");
          }
        });
      });

      tablaBody.querySelectorAll(".btnEliminar").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const confirmacion = await confirm("Esta acción no se puede deshacer. ¿Deseas continuar?");
          if (confirmacion.isConfirmed) {
            try {
              const resp = await solicitudes.delet(`transporte/${id}`);
              await success(resp.message || "Transporte eliminado");
              await cargarTransportes();
            } catch (err) {
              console.error(err);
              error("No se pudo eliminar el transporte.");
            }
          }
        });
      });
    } catch (err) {
      console.error(err);
      error("No se pudieron cargar los transportes");
    }
  };

  // ================== Inicializar Formulario ==================
  if (form && form.dataset.inited !== "true") {
    form.dataset.inited = "true";

    btnReset?.addEventListener("click", () => {
      form.reset();
      const idHidden = document.getElementById("id");
      if (idHidden) idHidden.value = "";
      editando = false;
      transporteIdEditar = null;
      const btnRegisterEl = document.getElementById("btnRegister");
      if (btnRegisterEl) btnRegisterEl.textContent = "Guardar";
      [...form.querySelectorAll(".error")].forEach(c => c.classList.remove("error"));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate.validarCampos(e)) return;

      const datos = {
        nombre: document.getElementById("nombre").value,
        matricula: document.getElementById("matricula").value,
        asientos_totales: parseInt(document.getElementById("asientos").value),
        descripcion: document.getElementById("descripcion").value,
        id_estado: parseInt(document.getElementById("estado").value),
        id_tipo_transporte: parseInt(document.getElementById("tipoTransporte").value),
      };

      const idHidden = document.getElementById("id");
      const btnRegisterEl = document.getElementById("btnRegister");

      try {
        if (btnRegisterEl) {
          btnRegisterEl.disabled = true;
          btnRegisterEl.textContent = idHidden?.value ? "Actualizando..." : "Creando...";
        }

        let resp;
        if (idHidden?.value) {
          resp = await solicitudes.put(`transporte/${idHidden.value}`, datos);
          await success(resp.message || "Transporte actualizado");
        } else {
          resp = await solicitudes.post("transporte", datos);
          await success(resp.message || "Transporte creado");
        }

        form.reset();
        if (idHidden) idHidden.value = "";
        editando = false;
        transporteIdEditar = null;
        if (btnRegisterEl) btnRegisterEl.textContent = "Guardar";

        location.hash = "#/tablaTransportes";
        await waitForElement("#tablaTransportes tbody", 3000);
        await cargarTransportes();

      } catch (err) {
        console.error(err);
        error(editando ? "Error al actualizar el transporte." : "Error al crear el transporte.");
      } finally {
        const btnRegisterElFinal = document.getElementById("btnRegister");
        if (btnRegisterElFinal) btnRegisterElFinal.disabled = false;
      }
    });

    await cargarEstados();
    await cargarTipos();
  }

  if (document.querySelector("#tablaTransportes tbody")) {
    await cargarTransportes();
  }
};
