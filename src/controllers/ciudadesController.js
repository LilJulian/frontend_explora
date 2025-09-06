import * as validate from "../helpers/validates.js";
import * as solicitudes from "../helpers/solicitudes.js";
import { success, error } from "../helpers/alertas.js";

export const ciudadesController = async () => {
  const tablaBody = document.querySelector("#tablaCiudades tbody");
  const form = document.getElementById("form");
  const btnRegister = document.getElementById("btnRegister");
  const btnReset = document.getElementById("btnReset");

  const nombre = document.getElementById("nombre");
  const pais = document.getElementById("pais");
  const btnAddPais = document.getElementById("btnAddPais");

  // ================== Cargar Ciudades ==================
  const cargarCiudades = async () => {
    try {
      const ciudades = await solicitudes.get("ciudad");
      tablaBody.innerHTML = "";

      ciudades.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.id_ciudad}</td>
          <td>${c.paisNombre}</td>
          <td>${c.nombre}</td>
        `;
        tablaBody.appendChild(tr);
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
      pais.innerHTML = `<option value="">Seleccione un país</option>`;

      paises.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id_pais;
        option.textContent = p.nombre;
        pais.appendChild(option);
      });

    } catch (err) {
      console.error(err);
      error("No se pudieron cargar los países.");
    }
  };

  // 👉 SOLO si el form existe
  if (form && form.dataset.inited !== "true") {
    form.dataset.inited = "true";

    // Validaciones
    if (nombre) nombre.addEventListener("keypress", validate.validarTexto);

    // Limpiar formulario
    btnReset?.addEventListener("click", () => {
      form.reset();
      [...form.querySelectorAll(".error")].forEach(c => c.classList.remove("error"));
    });

    // Añadir país directo desde la vista
    btnAddPais?.addEventListener("click", async () => {
      const nuevoPais = prompt("Ingrese el nombre del nuevo país:");
      if (!nuevoPais) return;

      try {
        const resp = await solicitudes.post("pais", { nombre: nuevoPais.trim() });
        await success(resp.message || "País agregado");
        await cargarPaises();
      } catch (err) {
        console.error(err);
        error("No se pudo agregar el país.");
      }
    });

    // Submit (registrar ciudad)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!validate.validarCampos(e)) return;

      const datos = {
        nombre: nombre.value.trim(),
        id_pais: parseInt(pais.value)
      };

      try {
        btnRegister.disabled = true;
        btnRegister.textContent = "Creando...";

        const resp = await solicitudes.post("ciudad", datos);
        await success(resp.message || "Ciudad creada");

        form.reset();
        await cargarCiudades();

      } catch (err) {
        console.error(err);
        error("Ocurrió un error al crear la ciudad.");
      } finally {
        btnRegister.disabled = false;
        btnRegister.textContent = "Guardar";
      }
    });

    // 🔹 Cargar países al iniciar el formulario
    await cargarPaises();
  }

  // 👉 SOLO si la tabla existe
  if (tablaBody) {
    await cargarCiudades();
  }
};
