(function () {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const token = localStorage.getItem('snapToken');

  if (isAuthenticated !== 'true' || !token) {
    alert('Access denied! Please sign in to access your dashboard.');
    window.location.href = 'login.html';
  }
})();

document.addEventListener('DOMContentLoaded', function () {

  // =============================================
  //  EXIBIR INFORMAÇÕES DO USUÁRIO LOGADO
  // =============================================

  const fullname = localStorage.getItem('userFullname') || 'User';
  const email    = localStorage.getItem('userEmail')    || '';

  // Gera a inicial do avatar a partir do primeiro nome
  const initial = fullname.trim().charAt(0).toUpperCase();

  // ── Sidebar: avatar, nome e e-mail ──
  const sidebarAvatar = document.querySelector('.sidebar-user .user-avatar');
  const sidebarName   = document.querySelector('.sidebar-user .user-info strong');
  const sidebarEmail  = document.querySelector('.sidebar-user .user-info small');

  if (sidebarAvatar) sidebarAvatar.textContent = initial;
  if (sidebarName)   sidebarName.textContent   = fullname;
  if (sidebarEmail)  sidebarEmail.textContent  = email;

  // ── Topbar: avatar inicial ──
  const topbarAvatar = document.querySelector('.topbar-avatar');
  if (topbarAvatar) topbarAvatar.textContent = initial;

  // ── Overview: greeting personalizado ──
  const greeting = document.getElementById('overviewGreeting');
  if (greeting) {
    const firstName = fullname.split(' ')[0];
    greeting.textContent = `Welcome back, ${firstName} 👋`;
  }

  // Compatibilidade com IDs legados (caso existam em outros lugares)
  const userNameEl  = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  if (userNameEl)  userNameEl.textContent  = fullname;
  if (userEmailEl) userEmailEl.textContent = email;


  // =============================================
  // 1. DARK MODE TOGGLE
  // =============================================

  const html        = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  // Tema salvo por usuário — assim cada um tem seu tema preferido
  const themeKey   = `snap-theme_${email}`;
  const savedTheme = localStorage.getItem(themeKey) || 'dark';
  html.setAttribute('data-theme', savedTheme);

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(themeKey, theme);
  }

  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);


  // =============================================
  // 2. SIDEBAR TOGGLE MOBILE
  // =============================================

  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar       = document.getElementById('sidebar');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }


  // =============================================
  // 3. SIGN OUT
  // =============================================

  const logoutLink = document.querySelector('.logout-item');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove apenas os dados de sessão — os dados do dashboard ficam salvos
      // para quando o usuário fizer login novamente
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('snapToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userFullname');

      window.location.href = 'login.html';
    });
  }


  // =============================================
  // 4. DASHBOARD NAVIGATION
  // =============================================

  const navItems            = document.querySelectorAll('.nav-item');
  const sections            = document.querySelectorAll('.dash-section');
  const currentSectionLabel = document.getElementById('currentSection');

  if (navItems.length > 0 && sections.length > 0) {
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();

        const targetSectionId = item.getAttribute('data-section');
        if (!targetSectionId) return;

        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        sections.forEach(section => {
          section.classList.remove('active');
          section.style.display = 'none';
        });

        const targetSection = document.getElementById(`section-${targetSectionId}`);
        if (targetSection) {
          targetSection.classList.add('active');
          targetSection.style.display = 'block';

          if (currentSectionLabel) {
            const labelText = item.querySelector('.nav-label')?.textContent || targetSectionId;
            currentSectionLabel.textContent = labelText;
          }
        }
      });
    });

    // Ativa Overview por padrão
    const firstItem = navItems[0];
    if (firstItem) {
      const defaultSection = firstItem.getAttribute('data-section');
      sections.forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
      const defaultEl = document.getElementById(`section-${defaultSection}`);
      if (defaultEl) { defaultEl.classList.add('active'); defaultEl.style.display = 'block'; }
      firstItem.classList.add('active');
    }
  }


  // =============================================
  // 5. SCROLL REVEAL
  // =============================================

  const revealEls = document.querySelectorAll('.reveal-up');
  const observer  = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    },
    { threshold: 0.1 }
  );
  revealEls.forEach((el) => observer.observe(el));

});


// =============================================
// FUNÇÕES GLOBAIS
// =============================================

function getStats() {
  if (window.store) return window.store.getStats();
}

function exportDashboardData() {
  if (!window.store) return;
  const data = {
    tasks:     window.store.getTasks(),
    reminders: window.store.getReminders(),
    events:    window.store.getEvents(),
    team:      window.store.getTeam(),
    kpis:      window.store.getKPIs(),
    metrics:   window.store.getMetrics()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

function resetDashboard() {
  if (window.store && confirm('Tem certeza que quer restaurar os dados padrão?')) {
    window.store.resetData();
    if (window.uiHandler) window.uiHandler.renderAllSections();
  }
}

function clearAllData() {
  if (confirm('Tem certeza que quer limpar TODOS os dados?')) {
    localStorage.clear();
    window.location.reload();
  }
}