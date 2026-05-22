document.addEventListener('DOMContentLoaded', function () {

  // =============================================
  // SHOW / HIDE PASSWORD
  // =============================================

  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input    = btn.closest('.input-wrap').querySelector('input');
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.querySelector('.eye-icon').textContent = isHidden ? '🙈' : '👁️';
    });
  });


  // =============================================
  // HELPERS DE VALIDAÇÃO
  // =============================================

  function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) { input.classList.add('error'); input.classList.remove('success'); }
    if (error) error.textContent = message;
  }

  function showSuccess(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) { input.classList.remove('error'); input.classList.add('success'); }
    if (error) error.textContent = '';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function setLoading(form, loading) {
    const btn    = form.querySelector('.btn-submit');
    const text   = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    btn.disabled  = loading;
    text.hidden   = loading;
    loader.hidden = !loading;
  }


  // =============================================
  // PASSWORD STRENGTH (só no register)
  // =============================================

  const passwordInput = document.getElementById('password');
  const strengthFill  = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');

  if (passwordInput && strengthFill) {
    passwordInput.addEventListener('input', () => {
      const val    = passwordInput.value;
      const score  = getStrengthScore(val);
      const levels = [
        { label: '',       color: '',        width: '0%'   },
        { label: 'Weak',   color: '#e53e3e', width: '25%'  },
        { label: 'Fair',   color: '#e9922a', width: '50%'  },
        { label: 'Good',   color: '#3182ce', width: '75%'  },
        { label: 'Strong', color: '#38a169', width: '100%' },
      ];
      const { label, color, width } = levels[score];
      strengthFill.style.width           = width;
      strengthFill.style.backgroundColor = color;
      strengthLabel.textContent          = val.length ? label : '';
      strengthLabel.style.color          = color;
    });
  }

  function getStrengthScore(password) {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8)          score++;
    if (/[A-Z]/.test(password))        score++;
    if (/[0-9]/.test(password))        score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  }


  // =============================================
  // LOGIN FORM
  // =============================================

  const loginForm = document.getElementById('loginForm');

  if (loginForm) {

    // Validação ao sair do campo
    document.getElementById('email')?.addEventListener('blur', () => {
      const val = document.getElementById('email').value.trim();
      if (!val)                    showError('email', 'emailError', 'Email is required.');
      else if (!isValidEmail(val)) showError('email', 'emailError', 'Enter a valid email address.');
      else                         showSuccess('email', 'emailError');
    });

    document.getElementById('password')?.addEventListener('blur', () => {
      const val = document.getElementById('password').value;
      if (!val) showError('password', 'passwordError', 'Password is required.');
      else      showSuccess('password', 'passwordError');
    });

    // ── SUBMIT LOGIN ──
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      let valid      = true;

      if (!email || !isValidEmail(email)) {
        showError('email', 'emailError', 'Enter a valid email address.');
        valid = false;
      } else {
        showSuccess('email', 'emailError');
      }

      if (!password) {
        showError('password', 'passwordError', 'Password is required.');
        valid = false;
      } else {
        showSuccess('password', 'passwordError');
      }

      if (!valid) return;

      setLoading(loginForm, true);

      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          clearAuthSession();

          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('snapToken',       data.token);
          localStorage.setItem('userEmail',       data.user.email);
          localStorage.setItem('userFullname',    data.user.fullname);

          showToast('Signed in successfully! 🎉');

          setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);

        } else {
          showError('password', 'passwordError', data.error || 'Invalid credentials.');
          showToast('Login failed ❌');
        }

      } catch (err) {
        showToast('Connection error. Please try again. ❌');
        console.error('Login fetch error:', err);
      } finally {
        setLoading(loginForm, false);
      }
    });
  }


  // =============================================
  // REGISTER FORM
  // =============================================

  const registerForm = document.getElementById('registerForm');

  if (registerForm) {

    document.getElementById('fullname')?.addEventListener('blur', () => {
      const val = document.getElementById('fullname').value.trim();
      if (!val)                           showError('fullname', 'fullnameError', 'Full name is required.');
      else if (val.split(' ').length < 2) showError('fullname', 'fullnameError', 'Please enter your first and last name.');
      else                                showSuccess('fullname', 'fullnameError');
    });

    document.getElementById('email')?.addEventListener('blur', () => {
      const val = document.getElementById('email').value.trim();
      if (!val)                    showError('email', 'emailError', 'Email is required.');
      else if (!isValidEmail(val)) showError('email', 'emailError', 'Enter a valid email address.');
      else                         showSuccess('email', 'emailError');
    });

    document.getElementById('password')?.addEventListener('blur', () => {
      const val = document.getElementById('password').value;
      if (!val)              showError('password', 'passwordError', 'Password is required.');
      else if (val.length < 8) showError('password', 'passwordError', 'Password must be at least 8 characters.');
      else                   showSuccess('password', 'passwordError');
    });

    document.getElementById('confirmPassword')?.addEventListener('blur', () => {
      const pass    = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword').value;
      if (!confirm)          showError('confirmPassword', 'confirmPasswordError', 'Please confirm your password.');
      else if (pass !== confirm) showError('confirmPassword', 'confirmPasswordError', 'Passwords do not match.');
      else                   showSuccess('confirmPassword', 'confirmPasswordError');
    });

    // ── SUBMIT REGISTER ──
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullname        = document.getElementById('fullname').value.trim();
      const email           = document.getElementById('email').value.trim();
      const password        = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const terms           = document.getElementById('terms').checked;
      let valid             = true;

      if (!fullname || fullname.split(' ').length < 2) {
        showError('fullname', 'fullnameError', 'Please enter your first and last name.');
        valid = false;
      } else { showSuccess('fullname', 'fullnameError'); }

      if (!email || !isValidEmail(email)) {
        showError('email', 'emailError', 'Enter a valid email address.');
        valid = false;
      } else { showSuccess('email', 'emailError'); }

      if (!password || password.length < 8) {
        showError('password', 'passwordError', 'Password must be at least 8 characters.');
        valid = false;
      } else { showSuccess('password', 'passwordError'); }

      if (!confirmPassword || password !== confirmPassword) {
        showError('confirmPassword', 'confirmPasswordError', 'Passwords do not match.');
        valid = false;
      } else { showSuccess('confirmPassword', 'confirmPasswordError'); }

      if (!terms) {
        document.getElementById('termsError').textContent = 'You must accept the terms.';
        valid = false;
      } else {
        document.getElementById('termsError').textContent = '';
      }

      if (!valid) return;

      setLoading(registerForm, true);

      try {
        const response = await fetch('http://localhost:3000/api/register', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ fullname, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          showToast('Account created! Redirecting to login… 🎉');
          setTimeout(() => { window.location.href = 'login.html'; }, 1500);

        } else {
          if (response.status === 409) {
            showError('email', 'emailError', 'This email is already registered.');
          } else {
            showToast(data.error || 'Something went wrong ❌');
          }
        }

      } catch (err) {
        showToast('Connection error. Please try again. ❌');
        console.error('Register fetch error:', err);
      } finally {
        setLoading(registerForm, false);
      }
    });
  }

  window.logout = function () {
    clearAuthSession();
    window.location.href = 'login.html';
  };


  // =============================================
  // HELPER INTERNO — Limpa apenas os dados de sessão
  // =============================================

  function clearAuthSession() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('snapToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFullname');
  }


  // =============================================
  // PROTEÇÃO DE ROTA — Redireciona para login se não autenticado
  // =============================================

  // =============================================
  // TOAST
  // =============================================

  function showToast(message) {
    document.querySelector('.snap-toast')?.remove();

    const toast = document.createElement('div');
    toast.className   = 'snap-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id    = 'toast-styles';
      style.textContent = `
        .snap-toast {
          position: fixed;
          bottom: 2.5rem;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background-color: var(--text-primary);
          color: var(--bg);
          padding: 1.2rem 2.4rem;
          border-radius: 12px;
          font-family: 'Epilogue', sans-serif;
          font-size: 1.4rem;
          font-weight: 500;
          box-shadow: 0 8px 30px rgba(0,0,0,0.18);
          opacity: 0;
          transition: opacity 0.35s ease, transform 0.35s ease;
          z-index: 999;
          white-space: nowrap;
        }
        .snap-toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `;
      document.head.appendChild(style);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => { toast.classList.add('show'); });
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

});