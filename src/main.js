import { renderHeader } from "./components/autenticacion/header.js";
import { router } from "./router/router.js";
import './styles/index.js';

const header = document.querySelector("#header");
const app = document.querySelector("#app");

// Renderiza el header
renderHeader(header);

// Ejecuta el router en la carga inicial
window.addEventListener("DOMContentLoaded", () => {
  router(app);
});

// Ejecuta el router cada vez que cambia el hash
window.addEventListener("hashchange", () => {
  router(app);
});
