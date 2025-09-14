import * as solicitudes from "../helpers/solicitudes.js"; 
import { success, error } from "../helpers/alertas.js";

export async function viajesClienteController() {
  const container = document.querySelector("#viajes-container");
  const inputBuscar = document.querySelector("#buscar-viaje");

  try {
    // 1️⃣ Consumir API de viajes
    let viajes = await solicitudes.get("viajes");

    if (!viajes || viajes.length === 0) {
      container.innerHTML = `<p>No hay viajes disponibles en este momento.</p>`;
      return;
    }

    // 2️⃣ Filtrar viajes válidos
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    viajes = viajes.filter(v => {
      const fechaSalida = new Date(v.fechaSalida);
      fechaSalida.setHours(0, 0, 0, 0);
      return v.asientosDisponibles >= 1 && fechaSalida >= hoy;
    });

    if (viajes.length === 0) {
      container.innerHTML = `<p>No hay viajes disponibles con asientos o fechas válidas.</p>`;
      return;
    }

    // 3️⃣ Función para renderizar viajes
    const renderViajes = (lista) => {
      if (lista.length === 0) {
        container.innerHTML = `<p>No hay viajes que coincidan con tu búsqueda.</p>`;
        return;
      }
      container.innerHTML = lista.map(viaje => `
        <div class="viaje-card">
          <h3>${viaje.ciudadOrigen} ➝ ${viaje.ciudadDestino}</h3>
          <p><strong>Transporte:</strong> ${viaje.nombre_transporte}</p>
          <p><strong>Fecha de salida:</strong> ${formatearFecha(viaje.fechaSalida)}</p>
          <p><strong>Fecha de vuelta:</strong> ${formatearFecha(viaje.fechaVuelta)}</p>
          <p><strong>Asientos disponibles:</strong> ${viaje.asientosDisponibles}</p>
          <p class="precio">Precio: $${viaje.precioUnitario.toLocaleString()}</p>
          <button class="usuarios__btn" onclick="seleccionarViaje(${viaje.id})">Seleccionar</button>
        </div>
      `).join("");
    };

    // Render inicial
    renderViajes(viajes);

    // 4️⃣ Filtrado en tiempo real
    if (inputBuscar) {
      inputBuscar.addEventListener("input", (e) => {
        const termino = e.target.value.toLowerCase().trim();
        const filtrados = viajes.filter(v =>
          v.ciudadOrigen.toLowerCase().includes(termino) ||
          v.ciudadDestino.toLowerCase().includes(termino) ||
          v.nombre_transporte.toLowerCase().includes(termino)
        );
        renderViajes(filtrados);
      });
    }

  } catch (err) {
    console.error("Error al cargar viajes", err);
    error("No se pudieron cargar los viajes");
  }
}

// 🔹 Formatear fecha simple
function formatearFecha(fechaStr) {
  if (!fechaStr) return "N/A";
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// 🔹 Función global para seleccionar un viaje
window.seleccionarViaje = function(id) {
  sessionStorage.setItem("id_viaje", id);
  location.hash = "#/reserva";
};
