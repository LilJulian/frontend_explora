export async function superAdminController() {
    const panelViajes = document.querySelector('#panelViajes');
    const panelUsuarios = document.querySelector('#panelUsuarios');

    if (panelViajes) {
        panelViajes.addEventListener('click', () => {
            location.hash = "#/viajes"; // Redirige al módulo de viajes
        });
    }

    if (panelUsuarios) {
        panelUsuarios.addEventListener('click', () => {
            location.hash = "#/usuarios"; // Redirige al módulo de usuarios
        });
    }
}
