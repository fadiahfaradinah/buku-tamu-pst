/**
 * authService.js
 *
 * Auth flow menggunakan Supabase Auth SDK:
 *
 *   1. signInWithGoogle()  →  supabase.auth.signInWithOAuth({ provider: 'google' })
 *                             → redirect ke Google → kembali ke admin-index.html
 *   2. handleAuthCallback() →  SDK otomatis parse URL & set session
 *   3. checkAdminAccess()  →  query tabel pst_admin dengan session aktif (RLS berlaku)
 *
 * Tidak ada token juggling, tidak ada id_token exchange manual,
 * tidak ada session di StorageService — semua dikelola oleh SDK.
 */

const AuthService = (() => {

  /** Ambil Supabase client. */
  function _sb() {
    if (!window._supabase) throw new Error('Supabase client belum siap.');
    return window._supabase;
  }

  return {

    // ── Login ────────────────────────────────────────────────

    /**
     * Mulai OAuth flow Google.
     * SDK akan redirect browser ke Google, lalu kembali ke `redirectTo`.
     */
    async signInWithGoogle() {
      const { error } = await _sb().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin-index.html',
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) {
        console.error('[AuthService] signInWithOAuth error:', error.message);
        throw error;
      }
      // Browser akan redirect — kode setelah ini tidak dieksekusi.
    },

    // ── Callback setelah redirect dari Google ────────────────

    /**
     * Dipanggil saat halaman load ulang setelah redirect OAuth.
     * SDK secara otomatis meng-exchange code/token dari URL.
     * Kita hanya perlu memanggil getSession() setelah itu.
     *
     * @returns {Promise<{
     *   session: object|null,
     *   isAdmin: boolean,
     *   error:   string|null
     * }>}
     */
    async handleAuthCallback() {
      // Beri SDK kesempatan memproses hash/query dari URL
      const { data: { session }, error: sessionErr } = await _sb().auth.getSession();

      if (sessionErr) {
        return { session: null, isAdmin: false, error: sessionErr.message };
      }

      if (!session) {
        return { session: null, isAdmin: false, error: null };
      }

      // Cek apakah email user ada di tabel pst_admin
      // SDK otomatis kirim Authorization header dengan access_token user → RLS berlaku
      const { data, error: dbErr } = await _sb()
        .from('pst_admin')
        .select('email')
        .eq('email', session.user.email.toLowerCase())
        .maybeSingle();

      if (dbErr) {
        console.error('[AuthService] pst_admin check error:', dbErr.message);
        // Paksa logout agar tidak ada session menggantung
        await _sb().auth.signOut();
        return { session: null, isAdmin: false, error: `Gagal memverifikasi akun: ${dbErr.message}` };
      }

      if (!data) {
        // Email tidak ditemukan di pst_admin → bukan admin
        await _sb().auth.signOut();
        return {
          session: null,
          isAdmin: false,
          error:   `Akun ${session.user.email} tidak memiliki akses admin.`,
        };
      }

      return { session, isAdmin: true, error: null };
    },

    // ── Session ──────────────────────────────────────────────

    /**
     * Ambil session aktif dari SDK (bukan localStorage manual).
     * @returns {Promise<object|null>}
     */
    async getSession() {
      const { data: { session } } = await _sb().auth.getSession();
      return session;
    },

    /**
     * Cek apakah ada session aktif (sync, dari cache SDK internal).
     * Gunakan ini untuk guard route — sudah cukup untuk kebanyakan kasus.
     * @returns {boolean}
     */
    isLoggedIn() {
      // SDK menyimpan session di localStorage dengan key 'sb-*-auth-token'
      // Kita cek cache internal tanpa async
      const keys = Object.keys(localStorage);
      return keys.some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    },

    /**
     * Ambil data user dari session SDK (untuk tampilan nama/foto di UI).
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
     * Logout: SDK hapus session dari localStorage dan revoke token di server.
     */
    async signOut() {
      await _sb().auth.signOut();
    },

    /** Alias untuk kompabilitas dengan kode lama. */
    async clearSession() {
      await this.signOut();
    },

  };
})();
