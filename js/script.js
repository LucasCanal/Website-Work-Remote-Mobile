document.addEventListener('DOMContentLoaded', function () {

  // =============================================
  // THEME TOGGLE
  // =============================================

  const html = document.documentElement;

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('snap-theme', theme);
  }

  const savedTheme = localStorage.getItem('snap-theme') || 'light';
  setTheme(savedTheme);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  const themeToggleMobile = document.getElementById('themeToggleMobile');
  if (themeToggleMobile) {
    themeToggleMobile.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
      themeToggleMobile.querySelector('.toggle-emoji').textContent =
        current === 'dark' ? '🌙' : '☀️';
    });
  }

  // =============================================
  // DROPDOWN MENUS
  // =============================================

  document.querySelectorAll('.dropdown-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = btn.closest('.dropdown');
      const menu = dropdown.querySelector('.dropdown-menu');
      const arrow = btn.querySelector('.arrow');
      const isOpen = menu.classList.contains('show');

      // Fecha todos
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
      document.querySelectorAll('.arrow').forEach(a => a.classList.remove('up'));

      if (!isOpen) {
        menu.classList.add('show');
        arrow?.classList.add('up');
      }
    });
  });

  // Fecha dropdown ao clicar fora
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.arrow').forEach(a => a.classList.remove('up'));
  });

  // =============================================
  // MOBILE MENU
  // =============================================

  const mobileMenu = document.querySelector('.mobile-menu');
  const navList = document.querySelector('.nav-list');
  const overlay = document.querySelector('.overlay');
  const closeMenu = document.querySelector('.close-menu');

  function openMobileMenu() {
    navList?.classList.add('active');
    overlay?.classList.add('active');
    mobileMenu?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    navList?.classList.remove('active');
    overlay?.classList.remove('active');
    mobileMenu?.classList.remove('active');
    document.body.style.overflow = '';
  }

  mobileMenu?.addEventListener('click', openMobileMenu);
  closeMenu?.addEventListener('click', closeMobileMenu);
  overlay?.addEventListener('click', closeMobileMenu);

  // =============================================
  // SCROLL REVEAL
  // =============================================

  const revealEls = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    },
    { threshold: 0.1 }
  );
  revealEls.forEach(el => observer.observe(el));

});