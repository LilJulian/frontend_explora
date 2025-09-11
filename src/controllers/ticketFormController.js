// src/controllers/ticketsController.js
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

  // Generar formularios dinámicos según cantidad de personas
  container.innerHTML = "";
  for (let i = 1; i <= cantidad; i++) {
    const grupo = document.createElement("div");
    grupo.classList.add("usuarios__grupo");
    grupo.innerHTML = `
      <h3 class="usuarios__subtitulo">Persona ${i}</h3>

      <label class="usuarios__label">Nombre:</label>
      <input type="text" class="usuarios__input" name="nombre_${i}" required />

      <label class="usuarios__label">Tipo de documento:</label>
      <select class="usuarios__input" name="tipo_documento_${i}" required>
        <option value="">Seleccione</option>
        <option value="CC">Cédula de Ciudadanía</option>
        <option value="TI">Tarjeta de Identidad</option>
        <option value="PP">Pasaporte</option>
      </select>

      <label class="usuarios__label">Documento:</label>
      <input type="text" class="usuarios__input" name="documento_${i}" required />

      <label class="usuarios__label">Comentarios:</label>
      <textarea class="usuarios__input" name="comentarios_${i}"></textarea>

      <label class="usuarios__label">Asiento:</label>
      <input type="text" class="usuarios__input" name="asiento_${i}" maxlength="3" required />
    `;
    container.appendChild(grupo);
  }

  // Resetear formularios
  btnReset.addEventListener("click", (e) => {
    e.preventDefault();
    form.reset();
  });

  // Submit tickets
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const tickets = [];
  for (let i = 1; i <= cantidad; i++) {
    tickets.push({
      idReserva: Number(idReserva),   // 👈 camelCase
      nombre: form[`nombre_${i}`].value,
      tipoDocumento: form[`tipo_documento_${i}`].value, // 👈 camelCase
      documento: form[`documento_${i}`].value,
      comentarios: form[`comentarios_${i}`].value,
      asiento: form[`asiento_${i}`].value
    });
  }

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
