// src/controllers/ciudadesController.js
import * as solicitudes from "../helpers/solicitudes.js";
import { success, error, confirm } from "../helpers/alertas.js";

export const ciudadesController = async () => {
  const form = document.getElementById("form");
  const btnReset = document.getElementById("btnReset");

  let editando = false;
  let ciudadIdEditar = null;

  // ================== Helper: Esperar elemento ==================
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

  // ================== Validaciones ==================
  const marcarError = (input, condicion) => {
    if (!input) return false;
    if (condicion) {
      input.classList.remove("error");
      return true;
    } else {
      input.classList.add("error");
      return false;
    }
  };

  const validarTexto = (e) => {
    const regex = /^[a-zA-ZÀ-ÿ\s]*$/;
    if (!regex.test(e.key)) e.preventDefault();
  };

  const validarCampoTexto = (input) => {
    if (!input) return false;
    return marcarError(input, /^[a-zA-ZÀ-ÿ\s]{2,50}$/.test(input.value.trim()));
  };

  const validarSelect = (select) => {
    if (!select) return false;
    return marcarError(select, select.value !== "");
  };

  const validarCheckboxes = (chk1, chk2, chk3) => {
    const alMenosUno = chk1?.checked || chk2?.checked || chk3?.checked;
    if (!alMenosUno) {
      chk1?.classList.add("error");
      chk2?.classList.add("error");
      chk3?.classList.add("error");
      return false;
    } else {
      chk1?.classList.remove("error");
      chk2?.classList.remove("error");
      chk3?.classList.remove("error");
      return true;
    }
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
          <td class="usuarios__acciones">
            <button class="btnEditar usuarios__btn" data-id="${c.id_ciudad}">Editar</button>
            <button class="btnEliminar usuarios__btn" data-id="${c.id_ciudad}">Eliminar</button>
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

            const nombreInput = document.getElementById("nombre");
            const paisSelect = document.getElementById("pais");
            const idHidden = document.getElementById("id");
            const btnRegisterEl = document.getElementById("btnRegister");

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

              chkTerminal.checked = ciudad.tiene_terminal ?? false;
              chkAeropuerto.checked = ciudad.tiene_aeropuerto ?? false;
              chkPuerto.checked = ciudad.tiene_puerto ?? false;

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

    const nombreInput = document.getElementById("nombre");
    const paisSelect = document.getElementById("pais");

    // validaciones en tiempo real
    nombreInput?.addEventListener("keypress", validarTexto);
    nombreInput?.addEventListener("blur", () => validarCampoTexto(nombreInput));
    paisSelect?.addEventListener("change", () => validarSelect(paisSelect));

    // reset
    btnReset?.addEventListener("click", () => {
      form.reset();
      document.getElementById("id").value = "";
      editando = false;
      ciudadIdEditar = null;
      const btnRegisterEl = document.getElementById("btnRegister");
      if (btnRegisterEl) btnRegisterEl.textContent = "Guardar";
      [...form.querySelectorAll(".error")].forEach(c => c.classList.remove("error"));
    });

    // agregar país
    const btnAddPaisEl = document.getElementById("btnAddPais");
    btnAddPaisEl?.addEventListener("click", async () => {
      const nuevoPais = prompt("Ingrese el nombre del nuevo país:");
      if (!nuevoPais || !/^[a-zA-ZÀ-ÿ\s]{2,50}$/.test(nuevoPais)) {
        error("Nombre de país inválido");
        return;
      }
      try {
        const resp = await solicitudes.post("pais", { nombre: nuevoPais.trim() });
        await success(resp.message || "País agregado");
        await cargarPaises();
      } catch (err) {
        console.error(err);
        error("No se pudo agregar el país.");
      }
    });

    // submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombreValido = validarCampoTexto(nombreInput);
      const paisValido = validarSelect(paisSelect);

      const chkTerminal = document.getElementById("tiene_terminal");
      const chkAeropuerto = document.getElementById("tiene_aeropuerto");
      const chkPuerto = document.getElementById("tiene_puerto");
      const checkboxesValidos = validarCheckboxes(chkTerminal, chkAeropuerto, chkPuerto);

      if (!nombreValido || !paisValido || !checkboxesValidos) {
        error("Corrige los campos marcados en rojo.");
        return;
      }

      const idHidden = document.getElementById("id");
      const btnRegisterEl = document.getElementById("btnRegister");

      try {
        // 🚨 Validar duplicados solo en creación
        if (!idHidden?.value) {
          const ciudades = await solicitudes.get("ciudad");
          const ciudadDuplicada = ciudades.find(
            c => 
              c.nombre.trim().toLowerCase() === nombreInput.value.trim().toLowerCase() &&
              String(c.id_pais) === paisSelect.value
          );

          if (ciudadDuplicada) {
            error("Ya existe una ciudad con ese nombre en el mismo país.");
            nombreInput.classList.add("error");
            return;
          }
        }

        const datos = {
          nombre: nombreInput.value.trim(),
          id_pais: parseInt(paisSelect.value),
          tiene_terminal: chkTerminal?.checked || false,
          tiene_aeropuerto: chkAeropuerto?.checked || false,
          tiene_puerto: chkPuerto?.checked || false
        };

        if (btnRegisterEl) {
          btnRegisterEl.disabled = true;
          btnRegisterEl.textContent = idHidden?.value ? "Actualizando..." : "Creando...";
        }

        let resp;
        if (idHidden?.value) {
          resp = await solicitudes.put(`ciudad/${idHidden.value}`, datos);
          await success(resp.message || "Ciudad actualizada");
        } else {
          resp = await solicitudes.post("ciudad", datos);
          await success(resp.message || "Ciudad creada");
        }

        form.reset();
        idHidden.value = "";
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
