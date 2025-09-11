import * as solicitudes from "../helpers/solicitudes.js";
import { error } from "../helpers/alertas.js";

export async function boletosController() {
  const contenedor = document.querySelector("#boletos-cards");
  const section = document.querySelector("#boletos-section");
  section.style.display = "block";

  // Ocultar otras secciones si existen
  const reservasSection = document.querySelector("#reservas-section");
  if (reservasSection) reservasSection.style.display = "none";

  const partes = window.location.hash.split("/");
  const idReserva = partes.length >= 3 ? partes[2] : null;

  if (!idReserva) {
    contenedor.innerHTML = `<p class="error">❌ No se proporcionó el ID de la reserva.</p>`;
    return;
  }

  if (!/^\d+$/.test(idReserva)) {
    contenedor.innerHTML = `<p class="error">❌ El ID debe ser un número válido.</p>`;
    return;
  }

  contenedor.innerHTML = `<p>🔎 Cargando boletos de la reserva #${idReserva}...</p>`;

  try {
    const tickets = await solicitudes.get(`tickets/reserva/${idReserva}`);

    if (!tickets || tickets.length === 0) {
      contenedor.innerHTML = `<p>No hay boletos para esta reserva.</p>`;
      return;
    }

    contenedor.innerHTML = "";

    tickets.forEach(t => {
      const card = document.createElement("div");
      card.classList.add("boleto-card");
      card.innerHTML = `
        <h3>Boleto #${t.id}</h3>
        <p><strong>Nombre:</strong> ${t.nombre}</p>
        <p><strong>Documento:</strong> ${t.tipoDocumento} ${t.documento}</p>
        <p><strong>Asiento:</strong> ${t.asiento}</p>
        <p><strong>Comentarios:</strong> ${t.comentarios || "N/A"}</p>
        <button class="btn-descargar" data-id="${t.id}">Descargar Boleto</button>
      `;
      contenedor.appendChild(card);

      const btnDescargar = card.querySelector(".btn-descargar");
      btnDescargar.addEventListener("click", async () => {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Boleto de Vuelo", 20, 20);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`ID: ${t.id}`, 20, 40);
        doc.text(`Nombre: ${t.nombre}`, 20, 50);
        doc.text(`Documento: ${t.tipoDocumento} ${t.documento}`, 20, 60);
        doc.text(`Asiento: ${t.asiento}`, 20, 70);
        doc.text(`Comentarios: ${t.comentarios || "N/A"}`, 20, 80);

        doc.save(`boleto_${t.id}.pdf`);
      });
    });

  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p class="error">⚠️ Error al cargar los boletos.</p>`;
    error("No se pudieron cargar los boletos.");
  }
}
