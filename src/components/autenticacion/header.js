import headerHtml from './header.html?raw';
import { isAuth, logout, getUserInfo } from "../../helpers/auth.js";
import Swal from "sweetalert2";

export const renderHeader = async (elemento) => {
  // Renderiza solo una vez la estructura base
  elemento.innerHTML = headerHtml;
  await updateHeader(elemento);
};

export const updateHeader = async (elemento) => {
  const autenticado = await isAuth();
  const usuario = autenticado ? await getUserInfo() : null;

  const formBuscar = elemento.querySelector("#buscar-ticket-form");
  const menu = elemento.querySelector('#menu-autenticacion');
  const busqueda = elemento.querySelector('.busqueda');
  const headerMain = elemento.querySelector('.header-main');

  if (!menu) return;
  menu.innerHTML = '';

  if (!autenticado) {
    if (busqueda) {
      busqueda.classList.remove('oculto');
      if (headerMain) headerMain.style.justifyContent = 'flex-start';
    }

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
    if (busqueda) {
      busqueda.classList.add('oculto');
    }

    let opciones = "";
    const rol = localStorage.getItem("id_rol");

    if ((rol === "1" || rol === "2") && location.hash === "#/viajes") {
      opciones = `
        <ul class="menu_autenticacion__opciones">
          <li><a href="#/ciudades" class="menu_autenticacion__link">Ciudades</a></li>
          <li><a href="#/transportes" class="menu_autenticacion__link">Transportes</a></li>
          <li><a href="#/viajes" class="menu_autenticacion__link">Viajes</a></li>
        </ul>`;
    }

if (
  (rol === "1" || rol === "2") &&
  (location.hash === "#/ciudades" || location.hash === "#/tablaCiudades" || location.hash === "#/rutaCiudad")
) {
  opciones = `
    <ul class="menu_superadmin__opciones menu_autenticacion__opciones">
      <li><a class="menu_autenticacion__link" href="#/ciudades">Crea ciudades</a></li>
      <li><a class="menu_autenticacion__link" href="#/tablaCiudades">Ver ciudades</a></li>
      <li><a class="menu_autenticacion__link" href="#/rutaCiudad">Rutas</a></li>
    </ul>`;
}


    if (rol === "3" && (location.hash === "#/cliente" || location.hash === "#/reservasCliente")) {
      opciones = `
        <ul class="menu_superadmin__opciones menu_autenticacion__opciones">
          <li><a class="menu_autenticacion__link" href="#/cliente">Ver viajes</a></li>
          <li><a class="menu_autenticacion__link" href="#/reservasCliente">Ver reservas</a></li>
        </ul>`;
    }

    const logoutBtn = `
      <ul class="menu_autenticacion__opciones">
        <li class="menu_autenticacion__opcion" id="logout">
          <a class="menu_autenticacion__link" href="#">Cerrar sesión</a>
        </li>
      </ul>`;

    menu.innerHTML = opciones + logoutBtn;

    const btnLogout = menu.querySelector('#logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async (e) => {
        e.preventDefault();

        const result = await Swal.fire({
          title: '¿Seguro que deseas cerrar sesión?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, salir',
          cancelButtonText: 'Cancelar',
          reverseButtons: true
        });

        if (result.isConfirmed) {
          logout();
          await Swal.fire({
            icon: 'success',
            title: 'Sesión cerrada correctamente',
            showConfirmButton: false,
            timer: 1500
          });
          location.hash = "#/login";
          updateHeader(elemento); // 🔁 Solo actualiza el contenido
        }
      });
    }
  }
};
