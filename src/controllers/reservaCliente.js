import * as solicitudes from "../helpers/solicitudes.js";
import { isAuth, getUserInfo } from "../helpers/auth.js";
import { error, success, confirm } from "../helpers/alertas.js";

export async function mostrarReservasCliente() {
  const section = document.getElementById("reservas-section");
  const container = document.getElementById("reservas-cards");

  section.style.display = "block";
  container.innerHTML = "<p>Cargando reservas...</p>";

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

  try {
    let reservas = await solicitudes.get(`reservas/cliente/${idUsuario}`);

    if (!reservas || reservas.length === 0) {
      container.innerHTML = "<p>No tienes reservas actualmente.</p>";
      return;
    }

    container.innerHTML = "";

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let r of reservas) {
      r.idEstado = Number(r.idEstado);

      if (!r.estadoNombre) {
        switch (r.idEstado) {
          case 1: r.estadoNombre = "Pendiente"; break;
          case 2: r.estadoNombre = "Confirmada"; break;
          case 3: r.estadoNombre = "Cancelada"; break;
          default: r.estadoNombre = "Desconocido"; break;
        }
      }

      const fechaViaje = new Date(r.fechaReserva);
      fechaViaje.setHours(0, 0, 0, 0);
      const diffDias = (fechaViaje - hoy) / (1000 * 60 * 60 * 24);

      if (diffDias === 1 && r.idEstado !== 2 && r.idEstado !== 3) {
        try {
          await solicitudes.put(`reservas/${r.id}/estado`, { idEstado: 3 });
          r.idEstado = 3;
          r.estadoNombre = "Cancelada";
        } catch (err) {
          console.warn(`No se pudo cancelar automáticamente la reserva #${r.id}`);
        }
      }
    }

    reservas.forEach(r => {
      const card = document.createElement("div");
      card.classList.add("reserva-card");

      card.innerHTML = `
        <h3>Reserva #${r.id}</h3>
        <p><strong>Fecha:</strong> ${r.fechaReserva}</p>
        <p><strong>Origen:</strong> ${r.ciudadOrigen}</p>
        <p><strong>Destino:</strong> ${r.ciudadDestino}</p>
        <p><strong>Transporte:</strong> ${r.tipoReservaNombre}</p>
        <p><strong>Asientos:</strong> ${r.cantidadPersonas}</p>
        <p><strong>Estado:</strong> ${r.estadoNombre}</p>
      `;

      // Crear div de botones
      const botonesDiv = document.createElement("div");
      botonesDiv.classList.add("reserva-buttons");

      if (r.idEstado === 1) {
        // Pendiente → Pagar + Cancelar + Ver Boletos
        const btnPagar = document.createElement("button");
        btnPagar.textContent = "Pagar";
        btnPagar.classList.add("btn-pagar");
        btnPagar.dataset.id = r.id;

        const btnCancelar = document.createElement("button");
        btnCancelar.textContent = "Cancelar";
        btnCancelar.classList.add("btn-cancelar");
        btnCancelar.dataset.id = r.id;

        const boletosLink = document.createElement("a");
        boletosLink.href = `#/boletos/${r.id}`;
        boletosLink.classList.add("btn-boletos");
        boletosLink.textContent = "Ver Boletos";

        botonesDiv.appendChild(btnPagar);
        botonesDiv.appendChild(btnCancelar);
        card.appendChild(botonesDiv);
        card.appendChild(boletosLink);

        // Eventos
        btnPagar.addEventListener("click", async () => {
          try {
            await solicitudes.put(`reservas/${r.id}/estado`, { idEstado: 2 });
            success(`Reserva #${r.id} confirmada!`);
            mostrarReservasCliente();
          } catch (err) {
            error("No se pudo confirmar la reserva");
          }
        });

        btnCancelar.addEventListener("click", async () => {
          const conf = await confirm(`¿Seguro que deseas cancelar la reserva #${r.id}?`);
          if (conf.isConfirmed) {
            try {
              await solicitudes.put(`reservas/${r.id}/estado`, { idEstado: 3 });
              success("Reserva cancelada correctamente");
              mostrarReservasCliente();
            } catch (err) {
              error("No se pudo cancelar la reserva");
            }
          }
        });

      } else if (r.idEstado === 2) {
        // Confirmada → solo Ver Boletos
        const boletosLink = document.createElement("a");
        boletosLink.href = `#/boletos/${r.id}`;
        boletosLink.classList.add("btn-boletos");
        boletosLink.textContent = "Ver Boletos";
        card.appendChild(boletosLink);
      }

      // Cancelada → no mostrar botones

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    error("Error al cargar tus reservas");
    container.innerHTML = "<p>Error al cargar tus reservas. Intenta de nuevo.</p>";
  }
}
