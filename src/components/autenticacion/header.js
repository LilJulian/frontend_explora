import headerHtml from './header.html?raw';
import { isAuth, logout, getUserInfo } from "../../helpers/auth.js";

export const renderHeader = async (elemento) => {
    elemento.innerHTML = headerHtml; // Carga el HTML base

    const autenticado = await isAuth();
    const usuario = autenticado ? await getUserInfo() : null;

    const menu = elemento.querySelector('#menu-autenticacion'); 
    const busqueda = elemento.querySelector('.busqueda');
    const headerMain = elemento.querySelector('.header-main');

    // Mostrar u ocultar input de búsqueda según rol
    if (busqueda) {
        if (usuario && usuario.id_rol === 2) {
            busqueda.classList.remove('oculto');
            headerMain.style.justifyContent = 'flex-start'; // Clientes: logo + búsqueda
        } else {
            busqueda.classList.add('oculto');
            headerMain.style.justifyContent = 'space-evenly'; // Superadmins/admins: logo izquierda, menú derecha
        }
    }

    if (!menu) return;
    menu.innerHTML = '';

if (!autenticado) {
    // 👉 Usuario no autenticado: login y signup
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
    let opciones = "";

    // 👉 Si es superadmin (rol 3) y está en la vista de viajes, mostrar menú extra
    if (localStorage.getItem("id_rol") === "1" && location.hash === "#/viajes") {
        opciones = `
            <ul class="menu_superadmin__opciones">
                <li class="menu_superadmin__opcion">
                    <a href="#/ciudades" class="menu_superadmin__link">Ciudades</a>
                </li>
                <li class="menu_superadmin__opcion">
                    <a href="#/transportes" class="menu_superadmin__link">Transportes</a>
                </li>
                <li class="menu_superadmin__opcion">
                    <a href="#/viajes" class="menu_superadmin__link">Viajes</a>
                </li>
            </ul>
        `;
    }

if (
  localStorage.getItem("id_rol") === "1" &&
  (location.hash === "#/ciudades" || location.hash === "#/tablaCiudades" || location.hash === "#/rutaCiudad")
) {
    opciones = `
        <ul class="menu_superadmin__opciones">
            <li class="menu_superadmin__opcion">
                <a href="#/ciudades" class="menu_superadmin__link">Crea ciudades</a>
            </li>
            <li class="menu_superadmin__opcion">
                <a href="#/tablaCiudades" class="menu_superadmin__link">Ver ciudades</a>
            </li>
            <li class="menu_superadmin__opcion">
                <a href="#/rutaCiudad" class="menu_superadmin__link">Rutas</a>
            </li>
        </ul>
    `;
}


    // 👉 Logout siempre aparte
    const logoutBtn = `
        <ul class="menu_autenticacion__opciones">
            <li class="menu_autenticacion__opcion" id="logout">
                <a href="#" class="menu_autenticacion__link">Cerrar sesión</a>
            </li>
        </ul>
    `;

    menu.innerHTML = opciones + logoutBtn;

    // 👉 Evento logout
    const btnLogout = menu.querySelector('#logout');
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        alert("Sesión cerrada correctamente");
        location.hash = "#/login";
        renderHeader(elemento);
    });
}
}
