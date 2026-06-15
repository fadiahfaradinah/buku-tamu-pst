/**
 * loginPage.js
 * Feature: Admin Login
 *
 * Hanya menampilkan UI login.
 * Semua logika auth (callback, session check, pst_admin) sudah
 * ditangani oleh AuthService.boot() di admin-index.html — sebelum
 * router diinisialisasi.
 *
 * loginPage hanya perlu:
 *   1. Tampilkan form login
 *   2. Tampilkan error jika boot() mengirim pesan error
 *   3. Klik "Masuk dengan Google" → AuthService.signInWithGoogle()
 */

const LoginPage = (() => {

  // ── Template ───────────────────────────────────────────────
  function _template() {
    return `
      <div class="login-page page" role="main">

        <div class="login-bg" aria-hidden="true">
          <div class="login-bg-circle login-bg-circle--1"></div>
          <div class="login-bg-circle login-bg-circle--2"></div>
          <div class="login-bg-grid"></div>
        </div>

        <div class="login-card-wrap">
          <div class="login-card">

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

            <h1 class="login-title">Portal Admin</h1>
            <p class="login-desc">
              Masuk menggunakan akun Gmail Anda untuk mengakses panel administrasi buku tamu.
            </p>

            <div class="login-btn-wrap">
              <button class="login-google-btn" id="btn-google-signin" type="button"
                      aria-label="Masuk dengan Google">
                <svg class="login-google-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Masuk dengan Google</span>
              </button>
            </div>

            <!-- Loading -->
            <div class="login-loading hidden" id="login-loading" aria-live="polite">
              <div class="login-spinner"></div>
              <span id="login-loading-text">Mengarahkan ke Google…</span>
            </div>

            <!-- Error (diisi oleh router bootstrap jika ada) -->
            <div class="login-error hidden" id="login-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8"  x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span id="login-error-text"></span>
            </div>

            <p class="login-note">
              Hanya akun yang terdaftar sebagai admin yang dapat mengakses halaman ini.
            </p>

          </div>

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

  // ── UI helpers ─────────────────────────────────────────────

  function _showError(msg) {
    const el  = document.getElementById('login-error');
    const txt = document.getElementById('login-error-text');
    if (el && txt && msg) {
      txt.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  function _setLoading(isLoading) {
    document.getElementById('btn-google-signin')
      ?.toggleAttribute('disabled', isLoading);
    document.getElementById('login-loading')
      ?.classList.toggle('hidden', !isLoading);
    if (!isLoading) return;
    document.getElementById('login-error')?.classList.add('hidden');
  }

  // ── Events ─────────────────────────────────────────────────

  function _bindEvents() {
    document.getElementById('btn-google-signin')?.addEventListener('click', async () => {
      _setLoading(true);
      try {
        await AuthService.signInWithGoogle();
        // Browser redirect — tidak sampai sini
      } catch (err) {
        _setLoading(false);
        _showError(`Gagal memulai login: ${err.message}`);
      }
    });

    document.getElementById('btn-login-back')?.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // ── Styles ─────────────────────────────────────────────────

  function _ensureStyles() {
    if (!document.getElementById('css-login')) {
      const link = document.createElement('link');
      link.id = 'css-login'; link.rel = 'stylesheet';
      link.href = 'src/styles/login.css';
      document.head.appendChild(link);
    }
  }

  // ── Public API ─────────────────────────────────────────────

  return {
    /**
     * @param {string|null} errorMsg – pesan error dari boot(), atau null
     */
    render(errorMsg = null) {
      _ensureStyles();
      document.getElementById('app').innerHTML = _template();
      _bindEvents();
      if (errorMsg) _showError(errorMsg);
    },
  };
})();
