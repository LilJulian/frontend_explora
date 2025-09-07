import * as validate from "../helpers/validates.js";
import * as solicitudes from "../helpers/solicitudes.js";
import { success, error, confirm } from "../helpers/alertas.js";

export const ciudadesController = async () => {
  // NOTA: no guardamos tabla/inputs en const global porque pueden re-renderizarse
  const form = document.getElementById("form");
  const btnReset = document.getElementById("btnReset");

  // Estado local (útil pero NO la fuente de verdad)
  let editando = false;
  let ciudadIdEditar = null;

  // Helper: espera a que exista un selector en el DOM (útil con routing/hash)
  const waitForElement = (selector, timeout = 3000) => {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver((mutations, obs) => {
        const found = document.querySelector(selector);
        if (found) {
          obs.disconnect();
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
    // recapturamos tabla por si no está montada al inicio
    const tablaBody = document.querySelector("#tablaCiudades tbody");
    if (!tablaBody) return; // si no está en DOM, salimos (quien llame puede reintentar)
    try {
      const ciudades = await solicitudes.get("ciudad");
      tablaBody.innerHTML = "";

      ciudades.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.id_ciudad}</td>
          <td>${c.paisNombre ?? ""}</td>
          <td>${c.nombre}</td>
          <td>
            <button class="btnEditar" data-id="${c.id_ciudad}">✏️ Editar</button>
            <button class="btnEliminar" data-id="${c.id_ciudad}">🗑 Eliminar</button>
          </td>
        `;
        tablaBody.appendChild(tr);
      });

      // attach events (se recapturan cada vez para evitar duplicados)
      tablaBody.querySelectorAll(".btnEditar").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          try {
            const ciudad = await solicitudes.get(`ciudad/${id}`);
            if (!ciudad) return;

            // navegar a form
            location.hash = "#/ciudades";

            try {
              // esperar que el form esté montado
              await waitForElement("#form", 3000);
            } catch (e) {
              console.warn("Formulario no montado a tiempo:", e);
            }

            // aseguramos que el select de países esté poblado
            await cargarPaises();

            // ahora sí recapturamos elementos del form
            const btnRegisterEl = document.getElementById("btnRegister");
            const nombreInput = document.getElementById("nombre");
            const paisSelect = document.getElementById("pais");
            const idHidden = document.getElementById("id");

            if (nombreInput && paisSelect && idHidden && btnRegisterEl) {
              nombreInput.value = ciudad.nombre;

              // si la opción no existe, la añadimos (por si no vino en la lista)
              const optExists = !!paisSelect.querySelector(`option[value="${ciudad.id_pais}"]`);
              if (!optExists) {
                const opt = document.createElement("option");
                opt.value = ciudad.id_pais;
                opt.textContent = ciudad.paisNombre ?? `Pais ${ciudad.id_pais}`;
                paisSelect.appendChild(opt);
              }

              paisSelect.value = String(ciudad.id_pais);
              idHidden.value = String(ciudad.id_ciudad);

              // estado local
              editando = true;
              ciudadIdEditar = ciudad.id_ciudad;

              btnRegisterEl.textContent = "Actualizar";
            } else {
              console.warn("No se encontraron elementos del form para rellenar.");
            }
          } catch (err) {
            console.error(err);
            error("No se pudo cargar la ciudad.");
          }
        });
      });

      tablaBody.querySelectorAll(".btnEliminar").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const confirmacion = await confirm("Esta acción no se puede deshacer. ¿Deseas continuar?");
          if (confirmacion.isConfirmed) {
            try {
              const resp = await solicitudes.delet(`ciudad/${id}`);
              await success(resp.message || "Ciudad eliminada");
              // recargar tabla (estamos en tabla, así que existe)
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

  // 👉 INICIALIZACIÓN DEL FORM (solo cuando el form esté en DOM)
  if (form && form.dataset.inited !== "true") {
    form.dataset.inited = "true";

    // validar texto
    const nombreInputInit = document.getElementById("nombre");
    if (nombreInputInit) nombreInputInit.addEventListener("keypress", validate.validarTexto);

    // reset
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

    // add pais desde UI
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

    // submit (crear / actualizar)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate.validarCampos(e)) return;

      // recapturamos elementos
      const nombreInput = document.getElementById("nombre");
      const paisSelect = document.getElementById("pais");
      const idHidden = document.getElementById("id");
      const btnRegisterEl = document.getElementById("btnRegister");

      const opcionSeleccionada = paisSelect ? paisSelect.options[paisSelect.selectedIndex] : null;
      const idPais = opcionSeleccionada ? opcionSeleccionada.value : "";

      if (!idPais) {
        error("Debes seleccionar un país");
        return;
      }

      const datos = {
        nombre: nombreInput ? nombreInput.value.trim() : "",
        id_pais: parseInt(idPais)
      };

      try {
        if (btnRegisterEl) btnRegisterEl.disabled = true;
        if (btnRegisterEl) btnRegisterEl.textContent = (idHidden && idHidden.value) ? "Actualizando..." : "Creando...";

        // lógica basada en hidden #id (fuente de verdad)
        const editingId = idHidden && idHidden.value ? parseInt(idHidden.value) : null;
        let resp;
        if (editingId) {
          resp = await solicitudes.put(`ciudad/${editingId}`, datos);
          console.log("PUT resp:", resp);
          await success(resp.message || "Ciudad actualizada");
        } else {
          resp = await solicitudes.post("ciudad", datos);
          console.log("POST resp:", resp);
          await success(resp.message || "Ciudad creada");
        }

        // limpiar y reset
        form.reset();
        if (idHidden) idHidden.value = "";
        editando = false;
        ciudadIdEditar = null;
        if (btnRegisterEl) btnRegisterEl.textContent = "Guardar";

        // navegar a la vista tabla y forzar recarga cuando esté montada
        location.hash = "#/tablaCiudades";
        try {
          await waitForElement("#tablaCiudades tbody", 3000);
          await cargarCiudades();
        } catch (e) {
          // si no aparece la tabla en el tiempo, al menos intentamos recargar más tarde
          console.warn("No se pudo recargar la tabla inmediatamente:", e);
        }

      } catch (err) {
        console.error(err);
        error(editando ? "Ocurrió un error al actualizar la ciudad." : "Ocurrió un error al crear la ciudad.");
      } finally {
        const btnRegisterElFinal = document.getElementById("btnRegister");
        if (btnRegisterElFinal) btnRegisterElFinal.disabled = false;
      }
    });

    // cargar paises al inicializar el form
    await cargarPaises();
  }

  // 👉 cargar tabla si está en DOM ahora
  if (document.querySelector("#tablaCiudades tbody")) {
    await cargarCiudades();
  }
};
