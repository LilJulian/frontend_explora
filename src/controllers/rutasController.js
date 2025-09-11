// src/controllers/rutaController.js
import { get, post } from "../helpers/solicitudes.js";
import { success, error } from "../helpers/alertas.js";

export const rutaController = async (parametros = null) => {
  const formRuta = document.querySelector("#formRuta");
  const selectOrigen = document.querySelector("#ciudadOrigen");
  const selectDestino = document.querySelector("#ciudadDestino");

  let ciudades = [];
  let rutas = [];

  // 1) Traer ciudades y rutas del backend
  try {
    ciudades = await get("ciudad");
    rutas = await get("ruta"); // 👈 obtenemos todas las rutas para validar duplicados
  } catch (err) {
    console.error("Error cargando datos:", err);
    error("No se pudieron cargar ciudades o rutas.");
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
  // y que sean compatibles en su tipo de transporte
  const actualizarDeshabilitados = () => {
    const origenVal = selectOrigen.value;
    const destinoVal = selectDestino.value;

    const origenCiudad = ciudades.find((c) => String(getCityId(c)) === origenVal);
    const destinoCiudad = ciudades.find((c) => String(getCityId(c)) === destinoVal);

    Array.from(selectDestino.options).forEach((opt) => {
      if (opt.value === "") {
        opt.disabled = false;
        return;
      }

      if (!origenCiudad) {
        opt.disabled = false;
        return;
      }

      const ciudadDestino = ciudades.find((c) => String(getCityId(c)) === opt.value);

      // Regla: deben compartir al menos un transporte en común
      const compatibles =
        (origenCiudad.tiene_terminal && ciudadDestino.tiene_terminal) ||
        (origenCiudad.tiene_aeropuerto && ciudadDestino.tiene_aeropuerto) ||
        (origenCiudad.tiene_puerto && ciudadDestino.tiene_puerto);

      opt.disabled = opt.value === origenVal || !compatibles;
    });

    Array.from(selectOrigen.options).forEach((opt) => {
      if (opt.value === "") {
        opt.disabled = false;
        return;
      }

      if (!destinoCiudad) {
        opt.disabled = false;
        return;
      }

      const ciudadOrigen = ciudades.find((c) => String(getCityId(c)) === opt.value);

      const compatibles =
        (destinoCiudad.tiene_terminal && ciudadOrigen.tiene_terminal) ||
        (destinoCiudad.tiene_aeropuerto && ciudadOrigen.tiene_aeropuerto) ||
        (destinoCiudad.tiene_puerto && ciudadOrigen.tiene_puerto);

      opt.disabled = opt.value === destinoVal || !compatibles;
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

  // 5) Submit con validación de duplicados y terrestres
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

    // ✅ Validar que la ruta no exista en el mismo sentido
    const existeRuta = rutas.some(
      (r) =>
        String(r.id_ciudad_origen) === idOrigen &&
        String(r.id_ciudad_destino) === idDestino
    );

    if (existeRuta) {
      error("Ya existe una ruta con esas ciudades en ese orden.");
      return;
    }

    // ✅ Validar que no sea terrestre entre países distintos
    const origenCiudad = ciudades.find((c) => String(getCityId(c)) === idOrigen);
    const destinoCiudad = ciudades.find((c) => String(getCityId(c)) === idDestino);

    if (origenCiudad && destinoCiudad && origenCiudad.id_pais !== destinoCiudad.id_pais) {
      const soloTerrestre =
        origenCiudad.tiene_terminal &&
        destinoCiudad.tiene_terminal &&
        !origenCiudad.tiene_aeropuerto &&
        !destinoCiudad.tiene_aeropuerto &&
        !origenCiudad.tiene_puerto &&
        !destinoCiudad.tiene_puerto;

      if (soloTerrestre) {
        error("No se puede crear una ruta terrestre entre países distintos.");
        return;
      }
    }

    const nuevaRuta = {
      id_ciudad_origen: Number(idOrigen),
      id_ciudad_destino: Number(idDestino),
    };

    try {
      const res = await post("ruta", nuevaRuta);
      console.log("Ruta creada:", res);

      success("Ruta creada correctamente.");

      // recargar rutas en memoria para evitar duplicados en la misma sesión
      rutas = await get("ruta");

      formRuta.reset();
      llenarAmbosSelects();
      actualizarDeshabilitados();
    } catch (err) {
      console.error("Error creando ruta:", err);
      error("No se pudo crear la ruta.");
    }
  });
};
