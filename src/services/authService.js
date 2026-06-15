/**
 * authService.js
 *
 * Satu fungsi utama: AuthService.boot()
 *
 * Dipanggil SEKALI saat admin-index.html load, sebelum router diinisialisasi.
 * Flow:
 *
 *   admin-index.html load
 *     ↓
 *   AuthService.boot()
 *     ↓
 *   Ada code/token di URL?  ← kembali dari Google OAuth
 *     ├─ ya  → SDK exchange code → getSession() → cek pst_admin
 *     │          ├─ admin  → simpan flag, route ke /admin/dashboard
 *     │          └─ bukan  → signOut, route ke /admin/login + error
 *     └─ tidak
 *         ↓
 *       getSession() → ada session & belum expired?
 *         ├─ ya  → cek pst_admin → admin? route ke /admin/dashboard
 *         └─ tidak → route ke /admin/login
 *
 * Setelah boot(), sisa kode (Router, page) bisa pakai:
 *   - AuthService.getSession()    → async, ambil session dari SDK
 *   - AuthService.getUserProfile()→ async, data nama/foto untuk UI
 *   - AuthService.signInWithGoogle() → mulai OAuth flow
 *   - AuthService.signOut()       → logout + redirect ke login
 */

const AuthService = (() => {

  function _sb() {
    if (!window._supabase) throw new Error('Supabase client belum siap.');
    return window._supabase;
  }

  // ── Cek pst_admin ────────────────────────────────────────
  /**
   * Query tabel pst_admin untuk memastikan email terdaftar.
   * Dipanggil setelah session valid sudah ada.
   * @param {string} email
   * @returns {Promise<{ isAdmin: boolean, error: string|null }>}
   */
  async function _checkAdmin(email) {
    const { data, error } = await _sb()
      .from('pst_admin')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) return { isAdmin: false, error: error.message };
    return { isAdmin: !!data, error: null };
  }

  // ── Public API ────────────────────────────────────────────
  return {

    /**
     * Entry point utama — dipanggil SEBELUM Router.init().
     * Menentukan ke mana halaman harus di-route.
     *
     * @returns {Promise<{ route: '/admin/dashboard'|'/admin/login', error: string|null }>}
     */
    async boot() {
      const url      = window.location.href;
      const isOAuthCallback = url.includes('code=') || url.includes('access_token=');

      // ── KASUS 1: Kembali dari Google OAuth ──────────────
      if (isOAuthCallback) {
        // SDK otomatis exchange code dari URL dan set session
        const { data: { session }, error: sessionErr } =
          await _sb().auth.getSession();

        // Bersihkan URL agar tidak diproses ulang saat refresh
        history.replaceState(null, '', window.location.pathname);

        if (sessionErr || !session) {
          return { route: '/admin/login', error: 'Login gagal. Silakan coba lagi.' };
        }

        const { isAdmin, error: adminErr } = await _checkAdmin(session.user.email);

        if (adminErr) {
          await _sb().auth.signOut();
          return { route: '/admin/login', error: `Gagal memverifikasi akun: ${adminErr}` };
        }

        if (!isAdmin) {
          await _sb().auth.signOut();
          return {
            route: '/admin/login',
            error: `Akun ${session.user.email} tidak memiliki akses admin.`,
          };
        }

        return { route: '/admin/dashboard', error: null };
      }

      // ── KASUS 2: Load biasa — cek session existing ───────
      const { data: { session }, error: sessionErr } =
        await _sb().auth.getSession();

      if (sessionErr || !session) {
        // Tidak ada session atau error → tampilkan login
        return { route: '/admin/login', error: null };
      }

      // Ada session — pastikan masih admin (email bisa saja dihapus dari pst_admin)
      const { isAdmin, error: adminErr } = await _checkAdmin(session.user.email);

      if (adminErr || !isAdmin) {
        await _sb().auth.signOut();
        return {
          route: '/admin/login',
          error: adminErr
            ? `Gagal memverifikasi akun: ${adminErr}`
            : `Akun ${session.user.email} tidak lagi memiliki akses admin.`,
        };
      }

      return { route: '/admin/dashboard', error: null };
    },

    // ── OAuth ───────────────────────────────────────────────

    /**
     * Redirect ke Google untuk login.
     */
    async signInWithGoogle() {
      const { error } = await _sb().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin-index.html',
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      });
      if (error) throw error;
      // Browser redirect — tidak ada kode setelah ini
    },

    // ── Session ─────────────────────────────────────────────

    /**
     * Ambil session aktif dari SDK.
     * @returns {Promise<object|null>}
     */
    async getSession() {
      const { data: { session } } = await _sb().auth.getSession();
      return session ?? null;
    },

    /**
     * Ambil profil user untuk ditampilkan di UI.
     * @returns {Promise<{ name, email, picture }|null>}
     */
    async getUserProfile() {
      const session = await this.getSession();
      if (!session) return null;
      const meta = session.user.user_metadata ?? {};
      return {
        name:    meta.full_name || meta.name || session.user.email,
        email:   session.user.email,
        picture: meta.avatar_url || meta.picture || '',
      };
    },

    // ── Logout ───────────────────────────────────────────────

    /**
     * Logout: SDK hapus session + redirect ke halaman login.
     */
    async signOut() {
      await _sb().auth.signOut();
      window.location.href = 'admin-index.html';
    },
  };
})();
