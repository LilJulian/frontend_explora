// src/controllers/reservasController.js
import * as solicitudes from "../helpers/solicitudes.js";
import { success, error } from "../helpers/alertas.js";
import { isAuth, getUserInfo } from "../helpers/auth.js";

export async function reservasController() {
  const form = document.querySelector("#form");
  const btnReset = document.querySelector("#btnReset");
  const rutaText = document.querySelector("#ruta_texto");
  const fechaSalidaP = document.querySelector("#fecha_salida");
  const fechaVueltaP = document.querySelector("#fecha_vuelta");
  const idViajeInput = document.querySelector("#id_viaje");
  const idUsuarioInput = document.querySelector("#id_usuario");
  const tipoSelect = document.querySelector("#id_tipo_reserva");
  const cantidadInput = document.querySelector("#cantidad_personas");
  const precioInput = document.querySelector("#precio_total");
  const asientosInfo = document.querySelector("#asientos_info");

  // 🔹 Recuperar ID de viaje desde sessionStorage
  const idViaje = sessionStorage.getItem("id_viaje");
  if (!idViaje) {
    error("No se encontró el ID del viaje.");
    return;
  }

  // Traer datos del viaje
  let viaje;
  try {
    viaje = await solicitudes.get(`viajes/${idViaje}`);
  } catch (err) {
    console.error("Error al obtener viaje:", err);
    error("No se pudo cargar la información del viaje.");
    return;
  }

  if (!viaje || !viaje.id) {
    error("Viaje no encontrado.");
    return;
  }

  // Poblamos la vista
  idViajeInput.value = viaje.id;
  rutaText.textContent = `${viaje.ciudadOrigen} ➝ ${viaje.ciudadDestino}`;
  fechaSalidaP.textContent = viaje.fechaSalida ? new Date(viaje.fechaSalida).toLocaleString("es-CO") : "N/A";
  fechaVueltaP.textContent = viaje.fechaVuelta ? new Date(viaje.fechaVuelta).toLocaleString("es-CO") : "N/A";

  // Precio base por persona y asientos disponibles
  const precioPorPersona = Number(viaje.precioUnitario) || 0;
  const asientosDisponibles = Number(viaje.asientosDisponibles) || 0;
  asientosInfo.textContent = `Asientos disponibles: ${asientosDisponibles}`;

  // 🔹 Cargar tipos de reserva directamente (sin API)
  tipoSelect.innerHTML = `
    <option value="1">Ida</option>
    <option value="2">Ida y Vuelta</option>
  `;

  // 🔹 Calcular precio inicial
  function actualizarPrecio() {
    let qty = parseInt(cantidadInput.value, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > asientosDisponibles) {
      precioInput.value = "Cantidad > asientos";
      return;
    }
    const total = Number((precioPorPersona * qty).toFixed(2));
    precioInput.value = total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  cantidadInput.max = asientosDisponibles;
  actualizarPrecio();

  cantidadInput.addEventListener("input", actualizarPrecio);
  btnReset.addEventListener("click", (e) => {
    e.preventDefault();
    cantidadInput.value = 1;
    tipoSelect.selectedIndex = 0;
    actualizarPrecio();
  });

  // 🔹 Submit del formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cantidad = parseInt(cantidadInput.value, 10) || 1;
    if (cantidad > asientosDisponibles) {
      error("La cantidad supera los asientos disponibles.");
      return;
    }

    // obtener usuario si está autenticado
    let idUsuario = null;
    try {
      const aut = await isAuth();
      if (aut) {
        const user = await getUserInfo();
        if (user && user.id) idUsuario = user.id;
      }
    } catch (err) {
      console.warn("No se pudo obtener info usuario:", err);
    }
    if (!idUsuario) {
      idUsuario = parseInt(localStorage.getItem("userId")) || 1;
    }
    idUsuarioInput.value = idUsuario;

    const payload = {
      idUsuario: Number(idUsuario),
      idViaje: Number(viaje.id),
      idTipoReserva: Number(tipoSelect.value),
      cantidadPersonas: Number(cantidad),
      precioTotal: Number((precioPorPersona * cantidad).toFixed(2)),
      idEstado: 1 // pendiente
    };
try {
  const created = await solicitudes.post("reservas", payload);
  const reservaId = (created && (created.id || created.insertId)) || null;
  if (!reservaId) {
    error("No se pudo crear la reserva.");
    return;
  }

  try {
    await solicitudes.put(`viajes/${viaje.id}/reducirAsientos?cantidad=${cantidad}`, {});
  } catch (err) {
    console.warn("No se redujeron asientos automáticamente:", err);
  }

  success("Reserva creada correctamente");

  // 👇 Guardar info para tickets
  sessionStorage.setItem("id_reserva", reservaId);
  sessionStorage.setItem("cantidad_personas", cantidad);

  // 👇 Redirigir a la vista de tickets
  location.hash = "#/ticketForm";
} catch (err) {
  console.error("Error creando reserva:", err);
  error("No se pudo crear la reserva.");
}

  });
}
