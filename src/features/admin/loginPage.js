/**
 * loginPage.js
 * Feature: Admin Login
 *
 * Menampilkan tombol "Masuk dengan Google".
 * Klik → supabase.auth.signInWithOAuth() → redirect ke Google
 *      → kembali ke halaman ini → handleAuthCallback() → cek pst_admin
 *
 * Tidak ada GIS script, tidak ada id_token, tidak ada manual token exchange.
 */

const LoginPage = (() => {

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

            <!-- Sign-In button -->
            <div class="login-btn-wrap">
              <button class="login-google-btn" id="btn-google-signin" type="button"
                      aria-label="Masuk dengan Google">
                <svg class="login-google-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span id="btn-google-label">Masuk dengan Google</span>
              </button>
            </div>

            <!-- Loading state (ditampilkan saat callback diproses) -->
            <div class="login-loading hidden" id="login-loading" aria-live="polite">
              <div class="login-spinner"></div>
              <span id="login-loading-text">Memverifikasi akun…</span>
            </div>

            <!-- Error message -->
            <div class="login-error hidden" id="login-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
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

  // ── UI helpers ─────────────────────────────────────────────

  function _showError(msg) {
    document.getElementById('login-loading')?.classList.add('hidden');
    document.getElementById('btn-google-signin')?.removeAttribute('disabled');

    const el  = document.getElementById('login-error');
    const txt = document.getElementById('login-error-text');
    if (el && txt) {
      txt.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  function _hideError() {
    document.getElementById('login-error')?.classList.add('hidden');
  }

  function _setLoading(isLoading, text = 'Memverifikasi akun…') {
    const btn     = document.getElementById('btn-google-signin');
    const loading = document.getElementById('login-loading');
    const loadTxt = document.getElementById('login-loading-text');

    if (isLoading) {
      btn?.setAttribute('disabled', 'true');
      if (loadTxt) loadTxt.textContent = text;
      loading?.classList.remove('hidden');
      _hideError();
    } else {
      btn?.removeAttribute('disabled');
      loading?.classList.add('hidden');
    }
  }

  // ── OAuth callback handler ─────────────────────────────────

  /**
   * Dipanggil saat halaman load — jika URL mengandung token OAuth dari Google
   * (ada `code` atau `access_token` di URL), proses callback dan cek pst_admin.
   */
  async function _handleCallback() {
    const url    = window.location.href;
    const hasCode  = url.includes('code=');
    const hasToken = url.includes('access_token=');

    if (!hasCode && !hasToken) return false; // bukan callback URL

    _setLoading(true, 'Menyelesaikan proses login…');

    const { session, isAdmin, error } = await AuthService.handleAuthCallback();

    if (error) {
      _showError(error);
      // Bersihkan URL agar tidak diproses ulang saat refresh
      history.replaceState(null, '', window.location.pathname);
      return true;
    }

    if (!session || !isAdmin) {
      _showError('Login gagal. Silakan coba lagi.');
      history.replaceState(null, '', window.location.pathname);
      return true;
    }

    // Sukses — bersihkan URL lalu masuk dashboard
    history.replaceState(null, '', window.location.pathname);
    Router.navigate('/admin/dashboard');
    return true;
  }

  // ── Event bindings ─────────────────────────────────────────

  function _bindEvents() {
    // Tombol Google Sign-In
    document.getElementById('btn-google-signin')?.addEventListener('click', async () => {
      _setLoading(true, 'Mengarahkan ke Google…');
      try {
        await AuthService.signInWithGoogle();
        // Setelah ini browser redirect — baris berikut tidak dieksekusi
      } catch (err) {
        _showError(`Gagal memulai login: ${err.message}`);
      }
    });

    // Tombol kembali ke beranda
    document.getElementById('btn-login-back')?.addEventListener('click', () => {
      window.location.href = 'index.html';
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
    async render() {
      _ensureStyles();

      // Jika sudah login, langsung ke dashboard
      if (AuthService.isLoggedIn()) {
        Router.navigate('/admin/dashboard');
        return;
      }

      // Render halaman login dulu
      document.getElementById('app').innerHTML = _template();
      _bindEvents();

      // Cek apakah ini callback dari OAuth redirect
      const wasCallback = await _handleCallback();
      if (wasCallback) return; // sudah ditangani di atas
    },
  };
})();
