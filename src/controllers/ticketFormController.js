import * as solicitudes from "../helpers/solicitudes.js";
import { success, error } from "../helpers/alertas.js";

export async function ticketsFormController() {
  const form = document.querySelector("#ticketsForm");
  const container = document.querySelector("#ticketsContainer");
  const btnReset = document.querySelector("#btnReset");

  const idReserva = sessionStorage.getItem("id_reserva");
  const cantidad = parseInt(sessionStorage.getItem("cantidad_personas"), 10) || 1;

  if (!idReserva) {
    error("No se encontró la reserva asociada.");
    return;
  }

  // Obtener datos de la reserva
  let reserva;
  try {
    reserva = await solicitudes.get(`reservas/${idReserva}`);
  } catch (err) {
    console.error("No se pudo obtener la reserva:", err);
    error("No se pudo obtener la reserva.");
    return;
  }

  // Obtener viaje para saber cantidad total de asientos
  let viaje;
  try {
    viaje = await solicitudes.get(`viajes/${reserva.idViaje}`);
  } catch (err) {
    console.error("No se pudo obtener el viaje:", err);
    error("No se pudo obtener el viaje.");
    return;
  }

  const totalAsientos = viaje.asientosDisponibles; // número total de asientos

  // Obtener tickets existentes para saber los asientos ocupados
  let ticketsExistentes = [];
  try {
    ticketsExistentes = await solicitudes.get(`tickets/viaje/${reserva.idViaje}`);
  } catch (err) {
    console.warn("No se pudieron obtener los tickets existentes:", err);
  }

  let asientosOcupados = ticketsExistentes.map(t => Number(t.asiento));

  // Generar formularios dinámicos
  container.innerHTML = "";
  for (let i = 1; i <= cantidad; i++) {
    const grupo = document.createElement("div");
    grupo.classList.add("usuarios__grupo", "usuarios__grupo--ticket");
    grupo.innerHTML = `
      <h3 class="usuarios__subtitulo usuarios__subtitulo--ticket">Persona ${i}</h3>

      <label class="usuarios__label usuarios__label--ticket">Nombre:</label>
      <input type="text" class="usuarios__input usuarios__input--ticket" name="nombre_${i}" required />

      <label class="usuarios__label usuarios__label--ticket">Tipo de documento:</label>
      <select class="usuarios__input usuarios__input--ticket" name="tipo_documento_${i}" required>
        <option value="">Seleccione</option>
        <option value="CC">Cédula de Ciudadanía</option>
        <option value="TI">Tarjeta de Identidad</option>
        <option value="PP">Pasaporte</option>
      </select>

      <label class="usuarios__label usuarios__label--ticket">Documento:</label>
      <input type="text" class="usuarios__input usuarios__input--ticket" name="documento_${i}" required />

      <label class="usuarios__label usuarios__label--ticket">Comentarios:</label>
      <textarea class="usuarios__input usuarios__input--ticket" name="comentarios_${i}"></textarea>

      <label class="usuarios__label usuarios__label--ticket">Asiento:</label>
      <select class="usuarios__input usuarios__input--ticket" name="asiento_${i}" required></select>
    `;
    container.appendChild(grupo);

    const selectAsiento = grupo.querySelector(`select[name="asiento_${i}"]`);

    // Función para actualizar opciones de asientos
    function actualizarOpciones() {
      const valorActual = selectAsiento.value;
      selectAsiento.innerHTML = "";
      for (let a = 1; a <= totalAsientos; a++) {
        const option = document.createElement("option");
        option.value = a;
        option.textContent = a;
        if (asientosOcupados.includes(a)) option.disabled = true;
        selectAsiento.appendChild(option);
      }
      if (valorActual && !asientosOcupados.includes(Number(valorActual))) {
        selectAsiento.value = valorActual;
      }
    }

    actualizarOpciones();

    // Cuando se selecciona un asiento, actualizar ocupados y demás selects
    selectAsiento.addEventListener("change", (e) => {
      const prev = selectAsiento.dataset.prev ? Number(selectAsiento.dataset.prev) : null;
      if (prev) asientosOcupados = asientosOcupados.filter(x => x !== prev);

      const nuevo = Number(e.target.value);
      asientosOcupados.push(nuevo);
      selectAsiento.dataset.prev = nuevo;

      container.querySelectorAll('select[name^="asiento_"]').forEach(s => {
        if (s !== selectAsiento) {
          const val = s.value;
          s.innerHTML = "";
          for (let a = 1; a <= totalAsientos; a++) {
            const option = document.createElement("option");
            option.value = a;
            option.textContent = a;
            if (asientosOcupados.includes(a)) option.disabled = true;
            s.appendChild(option);
          }
          s.value = val;
        }
      });
    });

    // Validaciones en tiempo real
    const inputNombre = grupo.querySelector(`input[name="nombre_${i}"]`);
    inputNombre.addEventListener("input", () => {
      inputNombre.value = inputNombre.value.replace(/[^a-zA-Z\s]/g, "");
    });

    const inputDocumento = grupo.querySelector(`input[name="documento_${i}"]`);
    inputDocumento.addEventListener("input", () => {
      inputDocumento.value = inputDocumento.value.replace(/[^0-9]/g, "");
    });
  }

  // Resetear formulario
  btnReset.addEventListener("click", (e) => {
    e.preventDefault();
    form.reset();
    container.querySelectorAll('select[name^="asiento_"]').forEach(s => s.dispatchEvent(new Event('change')));
  });

  // Enviar formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const tickets = [];
    let valido = true;

    for (let i = 1; i <= cantidad; i++) {
      const nombre = form[`nombre_${i}`].value.trim();
      const tipoDocumento = form[`tipo_documento_${i}`].value;
      const documento = form[`documento_${i}`].value.trim();
      const asiento = form[`asiento_${i}`].value;

      if (!nombre || !tipoDocumento || !documento || !asiento) {
        valido = false;
        error(`Todos los campos obligatorios de la persona ${i} deben ser completados.`);
        break;
      }

      tickets.push({
        idReserva: Number(idReserva),
        nombre,
        tipoDocumento,
        documento,
        comentarios: form[`comentarios_${i}`].value.trim(),
        asiento
      });
    }

    if (!valido) return;

    try {
      for (const t of tickets) {
        await solicitudes.post("tickets", t);
      }
      success("Tickets creados correctamente.");
      location.hash = "#/cliente";
    } catch (err) {
      console.error("Error creando tickets:", err);
      error("No se pudieron crear los tickets.");
    }
  });
}
