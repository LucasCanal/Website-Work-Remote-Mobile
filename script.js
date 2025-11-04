document.addEventListener('DOMContentLoaded', function () {
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.dropdown-btn');
        const menu = dropdown.querySelector('.dropdown-menu');
        const arrow = button.querySelector('.arrow');

        button.addEventListener('click', () => {
            // Alterna apenas o dropdown atual
            const isShown = menu.classList.toggle('show');
            arrow.classList.toggle('up', isShown);
            
            // REMOVE esta linha que fecha os outros:
            // closeOtherDropdowns(dropdown);
        });
    });

    // Remove também a função closeOtherDropdowns completamente
    // e o event listener window.click que a chama

    // ----- Restante do código do menu mobile -----
    const mobileMenuIcon = document.querySelector('.mobile-menu');
    const navList = document.querySelector('.nav-list');
    const overlay = document.querySelector('.overlay');
    const closeMenuIcon = document.querySelector('.close-menu');

    const openMenu = () => {
        mobileMenuIcon.classList.add('active');
        navList.classList.add('active');
        overlay.classList.add('active');
    };

    const closeMenu = () => {
        mobileMenuIcon.classList.remove('active');
        navList.classList.remove('active');
        overlay.classList.remove('active');
    };

    mobileMenuIcon.addEventListener('click', openMenu);
    closeMenuIcon.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
});