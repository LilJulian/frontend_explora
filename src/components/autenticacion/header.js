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
            headerMain.style.justifyContent = 'space-between'; // Superadmins/admins: logo a la izquierda, menú a la derecha
        }
    }

    if (!menu) return;

    // Limpiar las opciones actuales
    menu.innerHTML = '';

    if (!autenticado) {
        // Mostrar login y signup
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
        // Mostrar cerrar sesión
        menu.innerHTML = `
            <ul class="menu_autenticacion__opciones">
                <li class="menu_autenticacion__opcion" id="logout">
                    <a href="#" class="menu_autenticacion__link">Cerrar sesión</a>
                </li>
            </ul>
        `;
        const btnLogout = menu.querySelector('#logout');
        btnLogout.addEventListener('click', () => {
            logout();
            alert("Sesión cerrada correctamente");
            location.hash = "#/login";
            renderHeader(elemento);
        });
    }
};
