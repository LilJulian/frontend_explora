import headerHtml from './header.html?raw';

export const renderHeader = (elemento) => {
    elemento.innerHTML = headerHtml;
}