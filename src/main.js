import { renderHeader, updateHeader } from "./components/autenticacion/header.js";
import { router } from "./router/router.js";
import './styles/index.js';

const header = document.querySelector("#header");
const app = document.querySelector("#app");

window.addEventListener("DOMContentLoaded", async () => {
  await renderHeader(header); // Solo una vez
  router(app);
});

window.addEventListener("hashchange", async () => {
  await updateHeader(header); // Actualiza dinámicamente sin parpadear
  router(app);
});
