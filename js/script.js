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
      const isOpen = dropdown.classList.contains('open');

      // Fecha todos
      document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));

      if (!isOpen) dropdown.classList.add('open');
    });
  });

  // Fecha dropdown ao clicar fora
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
  });

  // =============================================
  // MOBILE MENU
  // =============================================

  const mobileMenu = document.querySelector('.mobile-menu');
  const navList = document.querySelector('.nav-list');
  const overlay = document.querySelector('.overlay');
  const closeMenu = document.querySelector('.close-menu');

  function openMobileMenu() {
    navList?.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    navList?.classList.remove('open');
    overlay?.classList.remove('open');
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