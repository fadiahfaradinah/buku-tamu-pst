/**
 * welcomePage.js
 * Feature: Welcome
 * Renders the hero section and action buttons.
 */

const WelcomePage = (() => {
  // ── SVG icons (inline, no external deps) ──────────────────
  const ICON_REGISTER = `
    <svg class="welcome-btn-icon" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>`;

  const ICON_SKD = `
    <svg class="welcome-btn-icon" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>`;

  const ICON_BPS = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
            font-family="Inter,sans-serif" font-size="13" font-weight="800" fill="#FFD966">BPS</text>
    </svg>`;

  // ── Wave SVG divider ───────────────────────────────────────
  const WAVE_SVG = `
    <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z"
            fill="#f4f6fb"/>
    </svg>`;

  // ── Template ───────────────────────────────────────────────
  function _template() {
    return `
      <div class="welcome-page page">

        <!-- ░░ Hero Background ░░ -->
        <section class="hero" aria-label="Hero section Pelayanan Statistik Terpadu">
          <div class="hero-grid" aria-hidden="true"></div>

          <div class="hero-inner">
            <!-- Badge -->
            <div class="hero-badge">
              ${ICON_BPS}
              <span class="hero-badge-text">BPS Kota Parepare</span>
            </div>

            <!-- Heading -->
            <h1 class="hero-title">
              Pelayanan Statistik Terpadu
              <span>BPS Kota Parepare</span>
            </h1>

            <!-- Subtitle -->
            <p class="hero-subtitle">
              Selamat datang di Pelayanan Statistik Terpadu BPS Kota Parepare.
              Sebelum menerima pelayanan, silakan registrasi terlebih dahulu.
            </p>

            <!-- Hashtag -->
            <div class="hero-tag">
              <span>#MelayaniDenganHati</span>
              <span>❤️</span>
            </div>
          </div>

          <!-- Wave divider -->
          <div class="hero-wave" aria-hidden="true">${WAVE_SVG}</div>
        </section>

        <!-- ░░ Action Buttons ░░ -->
        <section class="welcome-actions" aria-label="Pilihan layanan">
          <!-- <p class="welcome-actions-label">Pilih layanan</p> -->

          <button
            class="welcome-btn welcome-btn-register"
            id="btn-register"
            aria-label="Registrasi buku tamu"
            type="button">
            ${ICON_REGISTER}
            Registrasi
          </button>

          <button
            class="welcome-btn welcome-btn-skd"
            id="btn-skd"
            aria-label="Isi Survei Kepuasan Pelanggan"
            type="button">
            ${ICON_SKD}
            Isi SKD
          </button>
        </section>

        <!-- ░░ Footer ░░ -->
        <footer class="welcome-footer">
          &copy; ${new Date().getFullYear()} BPS Kota Parepare &mdash; Buku Tamu PST
        </footer>

      </div>`;
  }

  // ── Event binding ──────────────────────────────────────────
  function _bindEvents() {
    document.getElementById('btn-register')?.addEventListener('click', () => {
      Router.navigate('/register');
    });
    document.getElementById('btn-skd')?.addEventListener('click', () => {
       window.open('https://skd.bps.go.id/skd/s/7372', '_blank');
    });
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    render() {
      const app = document.getElementById('app');
      app.innerHTML = _template();
      _bindEvents();
    },
  };
})();
