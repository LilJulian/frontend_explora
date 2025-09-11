import headerHtml from './header.html?raw';
import { isAuth, logout, getUserInfo } from "../../helpers/auth.js";

export const renderHeader = async (elemento) => {
  elemento.innerHTML = headerHtml;

  const autenticado = await isAuth();
  const usuario = autenticado ? await getUserInfo() : null;

  const formBuscar = elemento.querySelector("#buscar-ticket-form");
  const menu = elemento.querySelector('#menu-autenticacion');
  const busqueda = elemento.querySelector('.busqueda');
  const headerMain = elemento.querySelector('.header-main');

  if (!menu) return;
  menu.innerHTML = '';

  if (!autenticado) {
    // ✅ Mostrar búsqueda solo si NO hay login
    if (busqueda) {
      busqueda.classList.remove('oculto');
      if (headerMain) headerMain.style.justifyContent = 'flex-start';
    }

    // Eventos búsqueda
    if (formBuscar) {
      formBuscar.addEventListener("submit", (e) => {
        e.preventDefault();
        const valor = (formBuscar.querySelector("[name='ticket']").value || "").trim();

        if (!valor) {
          alert("Ingresa un ID de ticket");
          return;
        }
        if (!/^\d+$/.test(valor)) {
          alert("El ID debe ser numérico");
          return;
        }

        location.hash = `#/ticket/${encodeURIComponent(valor)}`;
      });
    }

    // Menú autenticación
    menu.innerHTML = `
      <ul class="menu_autenticacion__opciones">
        <li class="menu_autenticacion__opcion" id="login">
          <a href="#/login" class="menu_autenticacion__link">Log In</a>
        </li>
      </ul>
      <ul class="menu_autenticacion__opciones">
        <li class="menu_autenticacion__opcion" id="signup">
          <a href="#/registro" class="menu_autenticacion__link">Sign up</a>
        </li>
      </ul>
    `;
  } else {
    // ✅ Ocultar búsqueda cuando ya está logueado
    if (busqueda) {
      busqueda.classList.add('oculto');
    }

    let opciones = "";

    if (localStorage.getItem("id_rol") === "1" && location.hash === "#/viajes") {
      opciones = `
        <ul class="menu_autenticacion__opciones">
          <li class="menu_autenticacion__opcion"><a href="#/ciudades" class="menu_autenticacion__link">Ciudades</a></li>
          <li class="menu_autenticacion__opcion"><a href="#/transportes" class="menu_autenticacion__link">Transportes</a></li>
          <li class="menu_autenticacion__opcion"><a href="#/viajes" class="menu_autenticacion__link">Viajes</a></li>
        </ul>
      `;
    }

    if (
      localStorage.getItem("id_rol") === "1" &&
      (location.hash === "#/ciudades" || location.hash === "#/tablaCiudades" || location.hash === "#/rutaCiudad")
    ) {
      opciones = `
        <ul class="menu_superadmin__opciones menu_autenticacion__opciones">
          <li class="menu_autenticacion__opcion"><a class="menu_autenticacion__link" href="#/ciudades">Crea ciudades</a></li>
          <li class="menu_autenticacion__opcion"><a class="menu_autenticacion__link" href="#/tablaCiudades">Ver ciudades</a></li>
          <li class="menu_autenticacion__opcion"><a class="menu_autenticacion__link" href="#/rutaCiudad">Rutas</a></li>
        </ul>
      `;
    }

    const logoutBtn = `
      <ul class="menu_autenticacion__opciones">
        <li class="menu_autenticacion__opcion" id="logout">
          <a class="menu_autenticacion__link" href="#">Cerrar sesión</a>
        </li>
      </ul>
    `;

    menu.innerHTML = opciones + logoutBtn;

    const btnLogout = menu.querySelector('#logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        alert("Sesión cerrada correctamente");
        location.hash = "#/login";
        renderHeader(elemento);
      });
    }
  }
};
