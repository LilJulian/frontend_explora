// validates.js

// Teclas permitidas siempre
const teclasEspeciales = ["Backspace", "Tab", "Enter", "ArrowLeft", "ArrowRight", "Delete"];

// =============== VALIDACIONES BÁSICAS ===============

// Validar solo texto
export const validarTexto = (event) => {
  const key = event.key;
  const regex = /^[a-zA-Z\s]*$/; // Solo letras y espacios
  if (!regex.test(key) && !teclasEspeciales.includes(key)) event.preventDefault();
};

// Validar solo números
export const validarNumero = (event) => {
  const key = event.key;
  const regex = /^[0-9]$/; // Solo dígitos
  if (!regex.test(key) && !teclasEspeciales.includes(key)) event.preventDefault();
};

// =============== FUNCIONES DE ERROR ===============
export const agregarError = (campo, mensaje = "El campo es obligatorio.") => {
  campo.classList.add("error");

  // Revisar si ya existe un mensaje de error
  let span = campo.parentNode.querySelector(".mensaje-error");
  if (!span) {
    span = document.createElement("span");
    span.classList.add("mensaje-error");
    campo.parentNode.appendChild(span);
  }
  span.textContent = mensaje;
};

export const quitarError = (campo) => {
  campo.classList.remove("error");
  let span = campo.parentNode.querySelector(".mensaje-error");
  if (span) span.remove();
};

// =============== VALIDACIONES POR CAMPO ===============

// Validar campo vacío
export const validarCampo = (campo) => {
  if (campo.value.trim() === "") {
    agregarError(campo, "El campo es obligatorio.");
    return false;
  }
  quitarError(campo);
  return true;
};

// Validar longitud mínima
export const validarMinimo = (campo, minimo) => {
  if (campo.value.trim().length < minimo) {
    agregarError(campo, `Debe tener mínimo ${minimo} caracteres`);
    return false;
  }
  quitarError(campo);
  return true;
};

// Validar correo
export const validarEmail = (campo) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(campo.value)) {
    agregarError(campo, "Correo inválido");
    return false;
  }
  quitarError(campo);
  return true;
};

// Validar contraseña segura
export const validarContrasena = (campo) => {
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
  if (!regex.test(campo.value)) {
    agregarError(campo, "Debe tener mayúscula, número y carácter especial (mín 6)");
    return false;
  }
  quitarError(campo);
  return true;
};

// =============== VALIDAR FORMULARIO ===============
export const datos = {};

export const validarCampos = (event) => {
  let valido = true;

  const campos = [...event.target].filter(
    (elemento) =>
      elemento.hasAttribute("required") &&
      (elemento.tagName === "INPUT" || elemento.tagName === "SELECT")
  );

  campos.forEach((campo) => {
    if (!validarCampo(campo)) valido = false;

    // Validaciones personalizadas
    switch (campo.id) {
      case "nombre":
        if (!validarMinimo(campo, 3)) valido = false;
        break;

      case "matricula":
        if (!validarMinimo(campo, 3)) valido = false;
        break;

      case "asientos":
        if (isNaN(campo.value) || parseInt(campo.value) <= 0) {
          agregarError(campo, "Debe ser un número válido mayor a 0");
          valido = false;
        }
        break;

      case "descripcion":
        if (campo.value.trim() !== "" && campo.value.length < 5) {
          agregarError(campo, "Debe tener al menos 5 caracteres");
          valido = false;
        }
        break;

      case "tipoTransporte":
      case "estado":
        if (campo.value === "") {
          agregarError(campo, "Debe seleccionar una opción");
          valido = false;
        }
        break;

      case "correo":
        if (!validarEmail(campo)) valido = false;
        break;

      case "telefono":
        if (campo.value.length !== 10) {
          agregarError(campo, "Debe tener 10 dígitos");
          valido = false;
        }
        break;

      case "contrasena":
        if (!validarContrasena(campo)) valido = false;
        break;
    }

    datos[campo.id] = campo.value;
  });

  return valido;
};

//  EVENTOS 
// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.getElementById("form");

//   // Eventos de restricciones en tiempo real
//   document.getElementById("nombre").addEventListener("keypress", validarTexto);
//   document.getElementById("telefono").addEventListener("keypress", validarNumero);
//   document.getElementById("telefono").addEventListener("keypress", (e) => {
//     if (e.target.value.length >= 10 && !teclasEspeciales.includes(e.key)) e.preventDefault();
//   });

//   // Validación al enviar
//   form.addEventListener("submit", (e) => {
//     e.preventDefault();
//     if (validarCampos(e)) {
//       console.log("Formulario válido", datos);
//       form.submit();
//     } else {
//       console.log("Formulario inválido");
//     }
//   });
// });
