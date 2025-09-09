import * as validate from "../helpers/validates.js";
import * as solicitudes from "../helpers/solicitudes.js";
import { success, error, confirm } from "../helpers/alertas.js";

export const ciudadesController = async () => {
  const form = document.getElementById("form");
  const btnReset = document.getElementById("btnReset");

  let editando = false;
  let ciudadIdEditar = null;

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

  // ================== Cargar Ciudades ==================
  const cargarCiudades = async () => {
    const tablaBody = document.querySelector("#tablaCiudades tbody");
    if (!tablaBody) return;
    try {
      const ciudades = await solicitudes.get("ciudad");
      tablaBody.innerHTML = "";

      ciudades.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.id_ciudad}</td>
          <td>${c.paisNombre ?? ""}</td>
          <td>${c.nombre}</td>
          <td>${c.tiene_terminal ? "✅" : "❌"}</td>
          <td>${c.tiene_aeropuerto ? "✅" : "❌"}</td>
          <td>${c.tiene_puerto ? "✅" : "❌"}</td>
          <td>
            <button class="btnEditar" data-id="${c.id_ciudad}">✏️ Editar</button>
            <button class="btnEliminar" data-id="${c.id_ciudad}">🗑 Eliminar</button>
          </td>
        `;
        tablaBody.appendChild(tr);
      });

      // editar
      tablaBody.querySelectorAll(".btnEditar").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          try {
            const ciudad = await solicitudes.get(`ciudad/${id}`);
            if (!ciudad) return;

            location.hash = "#/ciudades";
            await waitForElement("#form", 3000);
            await cargarPaises();

            const btnRegisterEl = document.getElementById("btnRegister");
            const nombreInput = document.getElementById("nombre");
            const paisSelect = document.getElementById("pais");
            const idHidden = document.getElementById("id");

            // checkboxes
            const chkTerminal = document.getElementById("tiene_terminal");
            const chkAeropuerto = document.getElementById("tiene_aeropuerto");
            const chkPuerto = document.getElementById("tiene_puerto");

            if (nombreInput && paisSelect && idHidden && btnRegisterEl) {
              nombreInput.value = ciudad.nombre;

              const optExists = !!paisSelect.querySelector(`option[value="${ciudad.id_pais}"]`);
              if (!optExists) {
                const opt = document.createElement("option");
                opt.value = ciudad.id_pais;
                opt.textContent = ciudad.paisNombre ?? `Pais ${ciudad.id_pais}`;
                paisSelect.appendChild(opt);
              }

              paisSelect.value = String(ciudad.id_pais);
              idHidden.value = String(ciudad.id_ciudad);

              // marcar checkboxes
              if (chkTerminal) chkTerminal.checked = ciudad.tiene_terminal ?? false;
              if (chkAeropuerto) chkAeropuerto.checked = ciudad.tiene_aeropuerto ?? false;
              if (chkPuerto) chkPuerto.checked = ciudad.tiene_puerto ?? false;

              editando = true;
              ciudadIdEditar = ciudad.id_ciudad;
              btnRegisterEl.textContent = "Actualizar";
            }
          } catch (err) {
            console.error(err);
            error("No se pudo cargar la ciudad.");
          }
        });
      });

      // eliminar
      tablaBody.querySelectorAll(".btnEliminar").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const confirmacion = await confirm("Esta acción no se puede deshacer. ¿Deseas continuar?");
          if (confirmacion.isConfirmed) {
            try {
              const resp = await solicitudes.delet(`ciudad/${id}`);
              await success(resp.message || "Ciudad eliminada");
              await cargarCiudades();
            } catch (err) {
              console.error(err);
              error("No se pudo eliminar la ciudad.");
            }
          }
        });
      });

    } catch (err) {
      console.error(err);
      error("No se pudieron cargar las ciudades.");
    }
  };

  // ================== Cargar Países ==================
  const cargarPaises = async () => {
    try {
      const paises = await solicitudes.get("pais");
      const paisSelect = document.getElementById("pais");
      if (!paisSelect) return;
      paisSelect.innerHTML = `<option value="">Seleccione un país</option>`;
      paises.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id ?? p.id_pais ?? p.idPais;
        option.textContent = p.nombre;
        paisSelect.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      error("No se pudieron cargar los países.");
    }
  };

  // ================== Inicializar formulario ==================
  if (form && form.dataset.inited !== "true") {
    form.dataset.inited = "true";

    const nombreInputInit = document.getElementById("nombre");
    if (nombreInputInit) nombreInputInit.addEventListener("keypress", validate.validarTexto);

    btnReset?.addEventListener("click", () => {
      form.reset();
      const idHidden = document.getElementById("id");
      if (idHidden) idHidden.value = "";
      editando = false;
      ciudadIdEditar = null;
      const btnRegisterEl = document.getElementById("btnRegister");
      if (btnRegisterEl) btnRegisterEl.textContent = "Guardar";
      [...form.querySelectorAll(".error")].forEach(c => c.classList.remove("error"));
    });

    const btnAddPaisEl = document.getElementById("btnAddPais");
    btnAddPaisEl?.addEventListener("click", async () => {
      const nuevoPais = prompt("Ingrese el nombre del nuevo país:");
      if (!nuevoPais) return;
      try {
        const resp = await solicitudes.post("pais", { nombre: nuevoPais.trim() });
        await success(resp.message || "País agregado");
        await cargarPaises();
      } catch (err) {
        console.error(err);
        error("No se pudo agregar el país.");
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate.validarCampos(e)) return;

      const nombreInput = document.getElementById("nombre");
      const paisSelect = document.getElementById("pais");
      const idHidden = document.getElementById("id");
      const btnRegisterEl = document.getElementById("btnRegister");

      // checkboxes
      const chkTerminal = document.getElementById("tiene_terminal");
      const chkAeropuerto = document.getElementById("tiene_aeropuerto");
      const chkPuerto = document.getElementById("tiene_puerto");

      const idPais = paisSelect?.value || "";
      if (!idPais) {
        error("Debes seleccionar un país");
        return;
      }

      const datos = {
        nombre: nombreInput ? nombreInput.value.trim() : "",
        id_pais: parseInt(idPais),
        tiene_terminal: chkTerminal?.checked || false,
        tiene_aeropuerto: chkAeropuerto?.checked || false,
        tiene_puerto: chkPuerto?.checked || false
      };

      try {
        if (btnRegisterEl) {
          btnRegisterEl.disabled = true;
          btnRegisterEl.textContent = idHidden?.value ? "Actualizando..." : "Creando...";
        }

        const editingId = idHidden?.value ? parseInt(idHidden.value) : null;
        let resp;
        if (editingId) {
          resp = await solicitudes.put(`ciudad/${editingId}`, datos);
          await success(resp.message || "Ciudad actualizada");
        } else {
          resp = await solicitudes.post("ciudad", datos);
          await success(resp.message || "Ciudad creada");
        }

        form.reset();
        if (idHidden) idHidden.value = "";
        editando = false;
        ciudadIdEditar = null;
        if (btnRegisterEl) btnRegisterEl.textContent = "Guardar";

        location.hash = "#/tablaCiudades";
        await waitForElement("#tablaCiudades tbody", 3000);
        await cargarCiudades();

      } catch (err) {
        console.error(err);
        error(editando ? "Error al actualizar la ciudad." : "Error al crear la ciudad.");
      } finally {
        const btnRegisterElFinal = document.getElementById("btnRegister");
        if (btnRegisterElFinal) btnRegisterElFinal.disabled = false;
      }
    });

    await cargarPaises();
  }

  if (document.querySelector("#tablaCiudades tbody")) {
    await cargarCiudades();
  }
};
