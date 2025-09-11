// src/controllers/viajesController.js
import * as validate from "../helpers/validates.js";
import * as solicitudes from "../helpers/solicitudes.js";
import { success, error, confirm } from "../helpers/alertas.js";

export const viajesController = async () => {
  const form = document.getElementById("form");
  const btnReset = document.getElementById("btnReset");

  let editando = false;
  let viajeIdEditar = null;

  // ===== caches =====
  let rutasDetalleCache = [];
  let ciudadesCache = [];
  let transportesCache = [];

  // ================== Helper: Esperar elemento en DOM ==================
  const waitForElement = (selector, timeout = 3000) =>
    new Promise((resolve, reject) => {
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

  // ================== Helpers UI (mensajes inline) ==================
  const showInlineError = (el, msg) => {
    if (!el) return;
    el.classList.add("input-error");
    let span = el.parentNode.querySelector(".mensaje-error-inline");
    if (!span) {
      span = document.createElement("span");
      span.className = "mensaje-error-inline";
      span.style.color = "#c00";
      span.style.fontSize = "0.9rem";
      span.style.display = "block";
      span.style.marginTop = "0.25rem";
      el.parentNode.appendChild(span);
    }
    span.textContent = msg;
  };

  const clearInlineError = (el) => {
    if (!el) return;
    el.classList.remove("input-error");
    const span = el.parentNode.querySelector(".mensaje-error-inline");
    if (span) span.remove();
  };

  // ================== Formato fecha para input[type=datetime-local] ==================
  const pad = (n) => String(n).padStart(2, "0");
  const formatDateForInput = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;

  // ================== Validaciones/Min fechas en tiempo real ==================
  const fechaSalidaInput = document.getElementById("fecha_salida");
  const fechaLlegadaInput = document.getElementById("fecha_llegada");
  const fechaVueltaInput = document.getElementById("fecha_vuelta");

  // establece min inicial para salida = ahora (local)
  const setMinSalidaNow = () => {
    if (!fechaSalidaInput) return;
    const now = new Date();
    // para evitar segundos raros, dejamos minutos actuales
    fechaSalidaInput.min = formatDateForInput(now);
  };

  // actualizar min de llegada > salida
  const setMinLlegadaFromSalida = () => {
    if (!fechaLlegadaInput) return;
    if (!fechaSalidaInput || !fechaSalidaInput.value) {
      // si no hay salida, llegada mínimo será ahora + 1min
      const min = new Date();
      min.setMinutes(min.getMinutes() + 1);
      fechaLlegadaInput.min = formatDateForInput(min);
      return;
    }
    const salida = new Date(fechaSalidaInput.value);
    const minLlegada = new Date(salida.getTime() + 60 * 1000); // +1 minuto
    fechaLlegadaInput.min = formatDateForInput(minLlegada);
  };

  // actualizar min de vuelta > llegada
  const setMinVueltaFromLlegada = () => {
    if (!fechaVueltaInput) return;
    if (!fechaLlegadaInput || !fechaLlegadaInput.value) {
      // por defecto, min vuelta = ahora + 2min (para dar margen)
      const min = new Date();
      min.setMinutes(min.getMinutes() + 2);
      fechaVueltaInput.min = formatDateForInput(min);
      return;
    }
    const llegada = new Date(fechaLlegadaInput.value);
    const minVuelta = new Date(llegada.getTime() + 60 * 1000); // +1 minuto
    fechaVueltaInput.min = formatDateForInput(minVuelta);
  };

  // validación de consistencia (no muestra modal, muestra mensajes inline)
  const validarFechasInline = () => {
    clearInlineError(fechaSalidaInput);
    clearInlineError(fechaLlegadaInput);
    clearInlineError(fechaVueltaInput);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const salidaVal = fechaSalidaInput?.value;
    const llegadaVal = fechaLlegadaInput?.value;
    const vueltaVal = fechaVueltaInput?.value;

    const salida = salidaVal ? new Date(salidaVal).getTime() : null;
    const llegada = llegadaVal ? new Date(llegadaVal).getTime() : null;
    const vuelta = vueltaVal ? new Date(vueltaVal).getTime() : null;

    // salida no menor a hoy
    if (salida && salida < hoy.getTime()) {
      showInlineError(fechaSalidaInput, "La fecha/hora de salida no puede ser anterior a hoy.");
      return false;
    }

    // llegada posterior a salida
    if (salida && llegada && llegada <= salida) {
      showInlineError(fechaLlegadaInput, "La llegada debe ser posterior a la salida.");
      return false;
    }

    // vuelta posterior a llegada
    if (llegada && vuelta && vuelta <= llegada) {
      showInlineError(fechaVueltaInput, "La vuelta debe ser posterior a la llegada.");
      return false;
    }

    // todo ok
    return true;
  };

  // listeners en tiempo real para fechas
  fechaSalidaInput?.addEventListener("change", () => {
    setMinLlegadaFromSalida();
    validarFechasInline();
  });
  fechaLlegadaInput?.addEventListener("change", () => {
    setMinVueltaFromLlegada();
    validarFechasInline();
  });
  fechaVueltaInput?.addEventListener("change", validarFechasInline);

  // establece min inicial
  setMinSalidaNow();
  setMinLlegadaFromSalida();
  setMinVueltaFromLlegada();

  // ================== Cargar Rutas (detalle) ==================
  const cargarRutas = async () => {
    try {
      // pedimos detalle para tener países y ids
      rutasDetalleCache = await solicitudes.get("ruta/detalle");
      // fallback si endpoint distinto
      if (!Array.isArray(rutasDetalleCache)) rutasDetalleCache = [];

      const selectRuta = document.getElementById("id_ciudades");
      if (!selectRuta) return;
      selectRuta.innerHTML = `<option value="">Seleccione una ruta</option>`;

      rutasDetalleCache.forEach((r) => {
        const option = document.createElement("option");
        option.value = r.id ?? r.id_ruta ?? r.idRuta;
        option.textContent = `${r.ciudad_origen ?? r.ciudadOrigen ?? ""} → ${r.ciudad_destino ?? r.ciudadDestino ?? ""}`;
        // metadata
        option.dataset.paisOrigen = r.pais_origen ?? r.paisOrigen ?? r.pais_origen;
        option.dataset.paisDestino = r.pais_destino ?? r.paisDestino ?? r.pais_destino;
        option.dataset.idCiudadOrigen = r.id_ciudad_origen ?? r.idCiudadOrigen ?? r.id_ciudad_origen;
        option.dataset.idCiudadDestino = r.id_ciudad_destino ?? r.idCiudadDestino ?? r.id_ciudad_destino;
        selectRuta.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      error("No se pudieron cargar las rutas.");
    }
  };

  // ================== Cargar Transportes ==================
  const cargarTransportes = async () => {
    try {
      transportesCache = await solicitudes.get("transporte");
      if (!Array.isArray(transportesCache)) transportesCache = [];

      const selectTransporte = document.getElementById("id_transporte");
      if (!selectTransporte) return;
      selectTransporte.innerHTML = `<option value="">Seleccione un transporte</option>`;

      transportesCache.forEach((t) => {
        const option = document.createElement("option");
        option.value = t.id;
        option.textContent = t.nombre;
        // meta para identificar modo de transporte
        option.dataset.tipo = (t.tipo ?? t.tipoTransporte ?? "").toString();
        option.dataset.nombre = (t.nombre ?? "").toString();
        selectTransporte.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      error("No se pudieron cargar los transportes.");
    }
  };

  // ================== Cargar Ciudades (para comprobar flags) ==================
  const cargarCiudadesCache = async () => {
    try {
      ciudadesCache = await solicitudes.get("ciudad");
      if (!Array.isArray(ciudadesCache)) ciudadesCache = [];
    } catch (err) {
      console.error("Error cargando ciudades:", err);
      ciudadesCache = [];
    }
  };

  // ================== Lógica para deshabilitar opciones de transporte según ruta ==================
  const detectModeFromOption = (opt) => {
    const tipo = (opt.dataset.tipo ?? "").toString().toLowerCase();
    const nombre = (opt.dataset.nombre ?? "").toString().toLowerCase();

    if (tipo.includes("terrestre") || nombre.includes("bus") || nombre.includes("terminal")) return "terrestre";
    if (tipo.includes("aereo") || nombre.includes("avion") || nombre.includes("aeropuerto")) return "aereo";
    if (tipo.includes("maritimo") || tipo.includes("marítimo") || nombre.includes("barco") || nombre.includes("puerto")) return "maritimo";
    return "otro";
  };

  const updateTransportOptionsForRoute = (routeOptionElement) => {
    const selectTransporte = document.getElementById("id_transporte");
    if (!selectTransporte) return;

    // si no se pasó ninguno, habilita todo
    if (!routeOptionElement || !routeOptionElement.value) {
      Array.from(selectTransporte.options).forEach((opt) => {
        opt.disabled = false;
      });
      clearInlineError(selectTransporte);
      return;
    }

    const paisOrigen = routeOptionElement.dataset.paisOrigen ?? "";
    const paisDestino = routeOptionElement.dataset.paisDestino ?? "";
    const idCiudadOrigen = routeOptionElement.dataset.idCiudadOrigen ?? "";
    const idCiudadDestino = routeOptionElement.dataset.idCiudadDestino ?? "";

    // buscar objetos de ciudad para flags
    const ciudadOrigenObj = ciudadesCache.find(c => String(c.id ?? c.id_ciudad ?? c.idCiudad) === String(idCiudadOrigen));
    const ciudadDestinoObj = ciudadesCache.find(c => String(c.id ?? c.id_ciudad ?? c.idCiudad) === String(idCiudadDestino));

    Array.from(selectTransporte.options).forEach((opt) => {
      if (!opt.value) { opt.disabled = false; return; } // opción placeholder

      const modo = detectModeFromOption(opt);

      let permitido = true;

      // 1) Si ruta cruza países distintos: bloquear terrestres
      if (paisOrigen && paisDestino && String(paisOrigen) !== String(paisDestino) && modo === "terrestre") {
        permitido = false;
      }

      // 2) Si modo requiere infraestructura (aereo => aeropuerto en ambas ciudades)
      if (modo === "aereo") {
        const okOrigen = ciudadOrigenObj?.tiene_aeropuerto ?? false;
        const okDestino = ciudadDestinoObj?.tiene_aeropuerto ?? false;
        if (!okOrigen || !okDestino) permitido = false;
      }

      // 3) si modo maritimo => puerto en ambas ciudades
      if (modo === "maritimo") {
        const okOrigen = ciudadOrigenObj?.tiene_puerto ?? false;
        const okDestino = ciudadDestinoObj?.tiene_puerto ?? false;
        if (!okOrigen || !okDestino) permitido = false;
      }

      // 4) modo terrestre => terminal en ambas ciudades
      if (modo === "terrestre") {
        const okOrigen = ciudadOrigenObj?.tiene_terminal ?? false;
        const okDestino = ciudadDestinoObj?.tiene_terminal ?? false;
        if (!okOrigen || !okDestino) permitido = false;
      }

      opt.disabled = !permitido;
    });

    // si la opción actualmente seleccionada está disabled, limpiamos y avisamos
    const sel = selectTransporte.value;
    const selOpt = selectTransporte.querySelector(`option[value="${sel}"]`);
    if (sel && selOpt && selOpt.disabled) {
      selectTransporte.value = "";
      showInlineError(selectTransporte, "El transporte seleccionado no es válido para esta ruta. Elige otro.");
    } else {
      clearInlineError(selectTransporte);
    }
  };

  // listener de cambio de ruta: actualizar transportes en tiempo real
  const selectRutaEl = document.getElementById("id_ciudades");
  selectRutaEl?.addEventListener("change", (e) => {
    const opt = selectRutaEl.options[selectRutaEl.selectedIndex];
    updateTransportOptionsForRoute(opt);
  });

  // ================== Cargar Viajes (tabla) ==================
  const cargarViajes = async () => {
    const tablaBody = document.querySelector("#tablaViajes tbody");
    if (!tablaBody) return;
    try {
      const viajes = await solicitudes.get("viajes");
      tablaBody.innerHTML = "";

      viajes.forEach((v) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${v.id}</td>
          <td>${v.ciudadOrigen}</td>
          <td>${v.ciudadDestino}</td>
          <td>${v.nombre_transporte}</td>
          <td>${v.transporteEstado === 1 ? "Activo" : "Inactivo"}</td>
          <td>${v.fechaSalida}</td>
          <td>${v.fechaLlegada}</td>
          <td>${v.fechaVuelta ?? ""}</td>
          <td>${v.precioUnitario}</td>
          <td>${v.asientosDisponibles}</td>
          <td class="usuarios__acciones">
            <button class="btnEditar usuarios__btn" data-id="${v.id}">Editar</button>
            <button class="btnEliminar usuarios__btn" data-id="${v.id}">Eliminar</button>
          </td>
        `;
        tablaBody.appendChild(tr);
      });

      // editar
      tablaBody.querySelectorAll(".btnEditar").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          try {
            const v = await solicitudes.get(`viajes/${id}`);
            location.hash = "#/viajes"; // Ir al formulario
            await waitForElement("#form", 3000);
            await cargarRutas();
            await cargarTransportes();
            await cargarCiudadesCache();

            // rellenar campos
            document.getElementById("id").value = v.id;
            document.getElementById("id_ciudades").value = v.idRuta;
            document.getElementById("id_transporte").value = v.idTransporte;
            document.getElementById("fecha_salida").value = v.fechaSalida.replace(" ", "T");
            document.getElementById("fecha_llegada").value = v.fechaLlegada.replace(" ", "T");
            document.getElementById("fecha_vuelta").value = v.fechaVuelta ? v.fechaVuelta.replace(" ", "T") : "";
            document.getElementById("precio_unitario").value = v.precioUnitario;

            const info = document.getElementById("asientos_info");
            if (info) info.textContent = `Asientos disponibles: ${v.asientosDisponibles}`;

            // aplicar filtros de transporte según ruta seleccionada
            const rutaOpt = document.getElementById("id_ciudades").options[document.getElementById("id_ciudades").selectedIndex];
            updateTransportOptionsForRoute(rutaOpt);

            editando = true;
            viajeIdEditar = v.id;
            document.getElementById("btnRegister").textContent = "Actualizar";
          } catch (err) {
            console.error(err);
            error("No se pudo cargar el viaje.");
          }
        });
      });

      // eliminar
      tablaBody.querySelectorAll(".btnEliminar").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const confirmacion = await confirm("¿Deseas eliminar este viaje?");
          if (confirmacion.isConfirmed) {
            try {
              const resp = await solicitudes.delet(`viajes/${id}`);
              await success(resp.message || "Viaje eliminado");
              await cargarViajes();
            } catch (err) {
              console.error(err);
              error("No se pudo eliminar el viaje.");
            }
          }
        });
      });
    } catch (err) {
      console.error(err);
      error("No se pudieron cargar los viajes.");
    }
  };

  // ================== Inicializar formulario ==================
  if (form && form.dataset.inited !== "true") {
    form.dataset.inited = "true";

    btnReset?.addEventListener("click", () => {
      form.reset();
      document.getElementById("id").value = "";
      document.getElementById("btnRegister").textContent = "Guardar";
      editando = false;
      viajeIdEditar = null;
      const info = document.getElementById("asientos_info");
      if (info) info.textContent = "";
      // reset min/errores
      setMinSalidaNow();
      setMinLlegadaFromSalida();
      setMinVueltaFromLlegada();
      clearInlineError(document.getElementById("id_transporte"));
      clearInlineError(fechaSalidaInput);
      clearInlineError(fechaLlegadaInput);
      clearInlineError(fechaVueltaInput);
    });

    // cargar datos necesarios
    await cargarCiudadesCache();
    await cargarRutas();
    await cargarTransportes();

    // Si cambian selects fuera del flujo, actualizar transportes
    const selectRuta = document.getElementById("id_ciudades");
    selectRuta?.addEventListener("change", () => {
      const opt = selectRuta.options[selectRuta.selectedIndex];
      updateTransportOptionsForRoute(opt);
    });

    // ================== Enviar formulario ==================
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate.validarCampos(e)) return;

      // validar fechas en inline (ya bloquea selección con min, pero revisamos coherencia)
      if (!validarFechasInline()) {
        error("Corrige las fechas antes de continuar.");
        return;
      }

      const idRuta = parseInt(document.getElementById("id_ciudades").value);
      const idTransporte = parseInt(document.getElementById("id_transporte").value);

      // obtenemos ruta con paises para validar transporte terrestre
      const rutasDetalle = await solicitudes.get("ruta/detalle");
      const transportes = await solicitudes.get("transporte");

      const rutaSel = (rutasDetalle || []).find((r) => String(r.id ?? r.id_ruta ?? r.idRuta) === String(idRuta));
      const transporteSel = (transportes || []).find((t) => String(t.id) === String(idTransporte));

      if (!rutaSel || !transporteSel) {
        error("Debes seleccionar una ruta y un transporte válido.");
        return;
      }

      const nombreTrans = (transporteSel.nombre ?? "").toString().toLowerCase();
      const tipoTrans = (transporteSel.tipo ?? transporteSel.tipoTransporte ?? "").toString().toLowerCase();
      const esTerrestre =
        tipoTrans.includes("terrestre") || nombreTrans.includes("bus") || nombreTrans.includes("terminal");

      const paisOrigen = rutaSel.pais_origen ?? rutaSel.paisOrigen ?? rutaSel.pais_origen;
      const paisDestino = rutaSel.pais_destino ?? rutaSel.paisDestino ?? rutaSel.pais_destino;

      if (esTerrestre && paisOrigen && paisDestino && String(paisOrigen) !== String(paisDestino)) {
        error("No se puede crear un viaje terrestre entre países diferentes.");
        return;
      }

      // todo ok -> armar datos
      const datos = {
        idRuta,
        idTransporte,
        fechaSalida: fechaSalidaInput?.value,
        fechaLlegada: fechaLlegadaInput?.value,
        fechaVuelta: fechaVueltaInput?.value || null,
        precioUnitario: parseFloat(document.getElementById("precio_unitario").value),
      };

      try {
        let resp;
        const idHidden = document.getElementById("id").value;
        if (idHidden) {
          resp = await solicitudes.put(`viajes/${idHidden}`, datos);
          await success(resp.message || "Viaje actualizado");
        } else {
          resp = await solicitudes.post("viajes", datos);
          await success(resp.message || "Viaje creado");
        }

        form.reset();
        document.getElementById("id").value = "";
        editando = false;
        viajeIdEditar = null;
        document.getElementById("btnRegister").textContent = "Guardar";

        location.hash = "#/tablaViajes";
        await waitForElement("#tablaViajes tbody", 3000);
        await cargarViajes();
      } catch (err) {
        console.error(err);
        error("Error al guardar el viaje.");
      }
    });
  }

  if (document.querySelector("#tablaViajes tbody")) {
    await cargarViajes();
  }
};
