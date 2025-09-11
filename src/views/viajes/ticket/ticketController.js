// src/views/viajes/ticket/ticketController.js
import * as solicitudes from "../../../helpers/solicitudes.js";

export async function ticketController() {
  const contenedor = document.querySelector("#ticket-detalle");

  // URL esperada: #/ticket/123
  const partes = window.location.hash.split("/");
  const idTicket = partes.length >= 3 ? partes[2] : null;

  if (!idTicket) {
    contenedor.innerHTML = `<p class="error">❌ Ingresa un ID de ticket para buscarlo.</p>`;
    return;
  }

  if (!/^\d+$/.test(idTicket)) {
    contenedor.innerHTML = `<p class="error">❌ El ID debe ser un número válido.</p>`;
    return;
  }

  contenedor.innerHTML = `<p>🔎 Buscando ticket <b>${idTicket}</b>...</p>`;

  try {
    const ticket = await solicitudes.get(`tickets/${idTicket}`);

    if (!ticket || ticket.error) {
      contenedor.innerHTML = `<p class="error">❌ No se encontró el ticket con ID <b>${idTicket}</b></p>`;
      return;
    }

    // Render del ticket estilo boarding pass
    contenedor.innerHTML = `
      <section id="ticket-container" class="ticket">
        <h2 class="ticket__titulo">Boleto de Vuelo #${ticket.id}</h2>
        <div class="ticket__info">
          <p><span>Nombre:</span> ${ticket.nombre}</p>
          <p><span>Documento:</span> ${ticket.tipoDocumento} ${ticket.documento}</p>
          <p><span>Asiento:</span> ${ticket.asiento}</p>
          <p><span>Comentarios:</span> ${ticket.comentarios || "N/A"}</p>
        </div>
        <button id="btnDescargar" class="ticket__btn">Descargar Boleto</button>
      </section>
    `;

    // Descargar PDF con jsPDF
    const btnDescargar = document.querySelector("#btnDescargar");
    if (btnDescargar) {
      btnDescargar.addEventListener("click", async () => {
        const { jsPDF } = await import("jspdf");

        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Boleto de Vuelo", 20, 20);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`ID: ${ticket.id}`, 20, 40);
        doc.text(`Nombre: ${ticket.nombre}`, 20, 50);
        doc.text(`Documento: ${ticket.tipoDocumento} ${ticket.documento}`, 20, 60);
        doc.text(`Asiento: ${ticket.asiento}`, 20, 70);
        doc.text(`Comentarios: ${ticket.comentarios || "N/A"}`, 20, 80);

        doc.save(`boleto_${ticket.id}.pdf`);
      });
    }
  } catch (error) {
    console.error(error);
    contenedor.innerHTML = `<p class="error">⚠️ Error al consultar el ticket</p>`;
  }
}
