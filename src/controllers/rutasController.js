// src/controllers/rutaController.js
import { get, post } from "../helpers/solicitudes.js";
import { success, error } from "../helpers/alertas.js";

export const rutaController = async (parametros = null) => {
  const formRuta = document.querySelector("#formRuta");
  const selectOrigen = document.querySelector("#ciudadOrigen");
  const selectDestino = document.querySelector("#ciudadDestino");

  let ciudades = [];

  // 1) Traer ciudades del backend
  try {
    ciudades = await get("ciudad");
  } catch (err) {
    console.error("Error cargando ciudades:", err);
    error("No se pudieron cargar las ciudades. Revisa la consola.");
    return;
  }

  // Helper para leer el id desde la respuesta
  const getCityId = (c) => c.id ?? c.id_ciudad ?? c.idCiudad ?? "";

  // 2) Llenar ambos selects
  const llenarAmbosSelects = () => {
    const plantilla = `<option value="">Seleccione una ciudad</option>`;
    selectOrigen.innerHTML = plantilla;
    selectDestino.innerHTML = plantilla;

    ciudades.forEach((c) => {
      const id = String(getCityId(c));
      const texto = c.nombre ?? c.nombreCiudad ?? "Sin nombre";

      const opt1 = document.createElement("option");
      opt1.value = id;
      opt1.textContent = texto;

      const opt2 = opt1.cloneNode(true);

      selectOrigen.appendChild(opt1);
      selectDestino.appendChild(opt2);
    });
  };

  // 3) Validar que no se pueda escoger la misma ciudad
  const actualizarDeshabilitados = () => {
    const origenVal = selectOrigen.value;
    const destinoVal = selectDestino.value;

    Array.from(selectOrigen.options).forEach((opt) => {
      opt.disabled = opt.value !== "" && opt.value === destinoVal;
    });

    Array.from(selectDestino.options).forEach((opt) => {
      opt.disabled = opt.value !== "" && opt.value === origenVal;
    });
  };

  // 4) Inicializar
  llenarAmbosSelects();

  if (parametros && (parametros.id_ciudad_origen || parametros.id_ciudad_destino)) {
    if (parametros.id_ciudad_origen) selectOrigen.value = String(parametros.id_ciudad_origen);
    if (parametros.id_ciudad_destino) selectDestino.value = String(parametros.id_ciudad_destino);
  }

  actualizarDeshabilitados();

  selectOrigen.addEventListener("change", actualizarDeshabilitados);
  selectDestino.addEventListener("change", actualizarDeshabilitados);

  // 5) Submit con SweetAlert2
  formRuta.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idOrigen = selectOrigen.value;
    const idDestino = selectDestino.value;

    if (!idOrigen || !idDestino) {
      error("Debes seleccionar ambas ciudades.");
      return;
    }

    if (idOrigen === idDestino) {
      error("La ciudad de origen y destino no pueden ser la misma.");
      return;
    }

    const nuevaRuta = {
      id_ciudad_origen: Number(idOrigen),
      id_ciudad_destino: Number(idDestino),
    };

    try {
      const res = await post("ruta", nuevaRuta);
      console.log("Ruta creada:", res);

      success("Ruta creada correctamente.");

      formRuta.reset();
      llenarAmbosSelects();
      actualizarDeshabilitados();
    } catch (err) {
      console.error("Error creando ruta:", err);
      error("No se pudo crear la ruta.");
    }
  });
};
