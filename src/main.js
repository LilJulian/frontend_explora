import { renderHeader } from "./components/autenticacion/header.js";
import { router } from "./router/router.js";
import './styles/index.js';

const header = document.querySelector("#header");
const app = document.querySelector("#app");

// Renderiza el header

// Ejecuta el router en la carga inicial
window.addEventListener("DOMContentLoaded", () => {
  renderHeader(header);
  router(app);
});

// Ejecuta el router cada vez que cambia el hash
window.addEventListener("hashchange", () => {
  renderHeader(header);
  router(app);
});
