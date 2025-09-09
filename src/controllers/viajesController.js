// src/controllers/viajesController.js
import * as validate from "../helpers/validates.js";
import * as solicitudes from "../helpers/solicitudes.js";
import { success, error, confirm } from "../helpers/alertas.js";

export const viajesController = async () => {
  const form = document.getElementById("form");
  const btnReset = document.getElementById("btnReset");

  let editando = false;
  let viajeIdEditar = null;

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

  // ================== Cargar Rutas ==================
  const cargarRutas = async () => {
    try {
      const rutas = await solicitudes.get("ruta");
      const selectRuta = document.getElementById("id_ciudades");
      if (!selectRuta) return;
      selectRuta.innerHTML = `<option value="">Seleccione una ruta</option>`;
      rutas.forEach((r) => {
        const option = document.createElement("option");
        option.value = r.id;
        option.textContent = `${r.ciudad_origen} → ${r.ciudad_destino}`;
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
      const transportes = await solicitudes.get("transporte");
      const selectTransporte = document.getElementById("id_transporte");
      if (!selectTransporte) return;
      selectTransporte.innerHTML = `<option value="">Seleccione un transporte</option>`;
      transportes.forEach((t) => {
        const option = document.createElement("option");
        option.value = t.id;
        option.textContent = t.nombre;
        selectTransporte.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      error("No se pudieron cargar los transportes.");
    }
  };

  // ================== Cargar Viajes ==================
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
          <td>
            <button class="btnEditar" data-id="${v.id}">✏️ Editar</button>
            <button class="btnEliminar" data-id="${v.id}">🗑 Eliminar</button>
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

            document.getElementById("id").value = v.id;
            document.getElementById("id_ciudades").value = v.idRuta;
            document.getElementById("id_transporte").value = v.idTransporte;
            document.getElementById("fecha_salida").value = v.fechaSalida.replace(" ", "T");
            document.getElementById("fecha_llegada").value = v.fechaLlegada.replace(" ", "T");
            document.getElementById("fecha_vuelta").value = v.fechaVuelta ? v.fechaVuelta.replace(" ", "T") : "";
            document.getElementById("precio_unitario").value = v.precioUnitario;

            const info = document.getElementById("asientos_info");
            if (info) info.textContent = `Asientos disponibles: ${v.asientosDisponibles}`;

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
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate.validarCampos(e)) return;

      const datos = {
        idRuta: parseInt(document.getElementById("id_ciudades").value),
        idTransporte: parseInt(document.getElementById("id_transporte").value),
        fechaSalida: document.getElementById("fecha_salida").value,
        fechaLlegada: document.getElementById("fecha_llegada").value,
        fechaVuelta: document.getElementById("fecha_vuelta").value || null,
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

    await cargarRutas();
    await cargarTransportes();
  }

  if (document.querySelector("#tablaViajes tbody")) {
    await cargarViajes();
  }
};
