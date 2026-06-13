/**
 * loginPage.js
 * Feature: Admin Login
 * Renders the Google OAuth login page for admin access.
 *
 * Requires Google Identity Services script (loaded dynamically).
 * Replace GOOGLE_CLIENT_ID with your actual OAuth 2.0 Client ID from
 * https://console.cloud.google.com
 */

const LoginPage = (() => {
  // ─────────────────────────────────────────────────────────────
  //  ⚠  Replace this with your Google Cloud OAuth 2.0 Client ID
  // ─────────────────────────────────────────────────────────────
  const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';

  const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
  const GIS_SCRIPT_ID  = 'google-gsi-script';

  // ── Template ───────────────────────────────────────────────
  function _template() {
    return `
      <div class="login-page page" role="main">

        <!-- Background decoration -->
        <div class="login-bg" aria-hidden="true">
          <div class="login-bg-circle login-bg-circle--1"></div>
          <div class="login-bg-circle login-bg-circle--2"></div>
          <div class="login-bg-grid"></div>
        </div>

        <div class="login-card-wrap">
          <div class="login-card">

            <!-- Logo / Brand -->
            <div class="login-brand">
              <div class="login-brand-logo" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="14" fill="#1a3a6b"/>
                  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
                        font-family="Inter,sans-serif" font-size="18" font-weight="800"
                        fill="#FFD966">BPS</text>
                </svg>
              </div>
              <div class="login-brand-text">
                <span class="login-brand-name">BPS Kota Parepare</span>
                <span class="login-brand-sub">Pelayanan Statistik Terpadu</span>
              </div>
            </div>

            <div class="login-divider" aria-hidden="true"></div>

            <!-- Heading -->
            <h1 class="login-title">Portal Admin</h1>
            <p class="login-desc">
              Masuk menggunakan akun Gmail Anda untuk mengakses panel administrasi buku tamu.
            </p>

            <!-- Google Sign-In button container -->
            <div class="login-btn-wrap">
              <div id="g_id_onload"
                   data-client_id="${GOOGLE_CLIENT_ID}"
                   data-callback="__googleLoginCallback"
                   data-auto_select="false"
                   data-itp_support="true">
              </div>
              <!-- Rendered by GIS library -->
              <div id="google-btn-container" class="login-google-btn-container"></div>

              <!-- Fallback button shown while GIS loads -->
              <button class="login-google-btn" id="login-google-fallback" type="button"
                      aria-label="Masuk dengan Google" disabled>
                <svg class="login-google-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span id="login-btn-label">Memuat…</span>
              </button>
            </div>

            <!-- Error message -->
            <div class="login-error hidden" id="login-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span id="login-error-text">Terjadi kesalahan.</span>
            </div>

            <p class="login-note">
              Hanya akun yang terdaftar sebagai admin yang dapat mengakses halaman ini.
            </p>

          </div>

          <!-- Back link -->
          <button class="login-back-link" id="btn-login-back" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Kembali ke Beranda
          </button>
        </div>

      </div>`;
  }

  // ── Load GIS script dynamically ────────────────────────────
  function _loadGIS() {
    return new Promise((resolve, reject) => {
      if (document.getElementById(GIS_SCRIPT_ID)) {
        resolve(); return;
      }
      const script = document.createElement('script');
      script.id  = GIS_SCRIPT_ID;
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload  = resolve;
      script.onerror = () => reject(new Error('Gagal memuat Google Sign-In library.'));
      document.head.appendChild(script);
    });
  }

  // ── Initialise GIS after script loads ─────────────────────
  function _initGIS() {
    if (!window.google?.accounts?.id) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback:  window.__googleLoginCallback,
      auto_select: false,
    });

    // Render the official Google button
    const container = document.getElementById('google-btn-container');
    if (container) {
      google.accounts.id.renderButton(container, {
        type:  'standard',
        theme: 'outline',
        size:  'large',
        text:  'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 320,
      });
    }

    // Hide fallback, show rendered button
    const fallback = document.getElementById('login-google-fallback');
    if (fallback) fallback.classList.add('hidden');
  }

  // ── Show error banner ──────────────────────────────────────
  function _showError(msg) {
    const el = document.getElementById('login-error');
    const txt = document.getElementById('login-error-text');
    if (el && txt) {
      txt.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  // ── Global callback (called by GIS after sign-in) ─────────
  function _registerCallback() {
    window.__googleLoginCallback = (response) => {
      if (!response?.credential) {
        _showError('Login gagal. Tidak ada credential yang diterima.');
        return;
      }

      const profile = AuthService.decodeJWT(response.credential);

      if (!profile.email) {
        _showError('Tidak dapat membaca informasi akun Google Anda.');
        return;
      }

      if (!AuthService.isAllowed(profile.email)) {
        _showError(`Akun ${profile.email} tidak memiliki akses admin.`);
        return;
      }

      AuthService.saveSession(profile);
      Router.navigate('/admin/dashboard');
    };
  }

  // ── Event bindings ─────────────────────────────────────────
  function _bindEvents() {
    document.getElementById('btn-login-back')?.addEventListener('click', () => {
      Router.navigate('/');
    });
  }

  // ── Load CSS lazily ────────────────────────────────────────
  function _ensureStyles() {
    if (!document.getElementById('css-login')) {
      const link = document.createElement('link');
      link.id   = 'css-login';
      link.rel  = 'stylesheet';
      link.href = 'src/styles/login.css';
      document.head.appendChild(link);
    }
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    render() {
      // Redirect if already logged in
      if (AuthService.isLoggedIn()) {
        Router.navigate('/admin/dashboard');
        return;
      }

      _ensureStyles();
      _registerCallback();

      const app = document.getElementById('app');
      app.innerHTML = _template();
      _bindEvents();

      // Load GIS then initialise the button
      _loadGIS()
        .then(() => {
          _initGIS();
        })
        .catch((err) => {
          _showError('Gagal memuat layanan Google Sign-In. Periksa koneksi internet Anda.');
          console.error('[LoginPage]', err);
          // Show fallback button in error state
          const label = document.getElementById('login-btn-label');
          if (label) label.textContent = 'Masuk dengan Google';
          document.getElementById('login-google-fallback')?.removeAttribute('disabled');
        });
    },
  };
})();
