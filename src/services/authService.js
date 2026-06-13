/**
 * authService.js
 * Orchestrates the full admin login flow:
 *
 *   1. Google OAuth  →  id_token dari GIS callback
 *   2. Supabase Auth →  kirim id_token ke /auth/v1/token → dapat access_token
 *   3. pst_admin     →  query tabel pst_admin dengan access_token tsb
 *                       untuk memastikan email terdaftar sebagai admin
 *
 * Session (termasuk Supabase access_token) disimpan di localStorage.
 */

const AuthService = (() => {
  const SESSION_KEY = 'admin_session';

  // ── Internal helpers ───────────────────────────────────────

  function _saveSession(supabaseSession, googleProfile) {
    StorageService.set(SESSION_KEY, {
      // Identitas dari Google
      email:   googleProfile.email,
      name:    googleProfile.name,
      picture: googleProfile.picture,
      sub:     googleProfile.sub,
      // Supabase session tokens
      access_token:  supabaseSession.access_token,
      refresh_token: supabaseSession.refresh_token,
      expires_in:    supabaseSession.expires_in,
      loginAt: new Date().toISOString(),
    });
  }

  // ── Public API ─────────────────────────────────────────────
  return {

    /**
     * Full login flow:
     *   Google id_token → Supabase Auth → cek pst_admin
     *
     * @param {string} googleIdToken  – credential dari GIS callback response
     * @param {Object} googleProfile  – decoded JWT payload (email, name, picture, sub)
     * @returns {Promise<{
     *   success: boolean,
     *   error:   string | null
     * }>}
     */
    async login(googleIdToken, googleProfile) {
      // ── Step 1: Supabase Auth — verifikasi id_token Google ──
      const { session, error: authError } = await SupabaseService.signInWithGoogle(googleIdToken);

      if (authError || !session?.access_token) {
        console.error('[AuthService] Supabase signIn error:', authError);
        return {
          success: false,
          error: `Gagal autentikasi via Supabase: ${authError || 'Tidak ada session.'}`,
        };
      }

      // ── Step 2: Cek apakah email ada di tabel pst_admin ────
      const { data, error: dbError } = await SupabaseService.selectAuth(
        session.access_token,
        'pst_admin',
        { email: `eq.${googleProfile.email.toLowerCase()}`, select: 'email' }
      );

      if (dbError) {
        console.error('[AuthService] pst_admin query error:', dbError);
        return {
          success: false,
          error: `Gagal memverifikasi akun admin: ${dbError}`,
        };
      }

      if (!Array.isArray(data) || data.length === 0) {
        return {
          success: false,
          error: `Akun ${googleProfile.email} tidak memiliki akses admin.`,
        };
      }

      // ── Step 3: Simpan session ──────────────────────────────
      _saveSession(session, googleProfile);
      return { success: true, error: null };
    },

    /**
     * Logout: hapus session lokal & revoke Supabase token.
     */
    async logout() {
      const session = this.getSession();
      if (session?.access_token) {
        // Fire-and-forget: jangan block UI
        SupabaseService.signOut(session.access_token).catch(() => {});
      }
      StorageService.remove(SESSION_KEY);
      if (window.google?.accounts?.id) {
        google.accounts.id.disableAutoSelect();
      }
    },

    /**
     * Alias sinkron untuk kompabilitas — gunakan logout() untuk flow baru.
     */
    clearSession() {
      const session = this.getSession();
      if (session?.access_token) {
        SupabaseService.signOut(session.access_token).catch(() => {});
      }
      StorageService.remove(SESSION_KEY);
      if (window.google?.accounts?.id) {
        google.accounts.id.disableAutoSelect();
      }
    },

    /**
     * Ambil session yang aktif, atau null kalau belum login.
     * @returns {Object|null}
     */
    getSession() {
      return StorageService.get(SESSION_KEY, null);
    },

    /**
     * Apakah ada session aktif?
     * @returns {boolean}
     */
    isLoggedIn() {
      return this.getSession() !== null;
    },

    /**
     * Ambil Supabase access_token dari session aktif.
     * Digunakan oleh service lain (AdminService) untuk request yang butuh auth.
     * @returns {string|null}
     */
    getAccessToken() {
      return this.getSession()?.access_token ?? null;
    },

    /**
     * Decode Google JWT credential (id_token) tanpa verifikasi signature.
     * Verifikasi signature wajib dilakukan di server side untuk production.
     * @param {string} token
     * @returns {Object}
     */
    decodeJWT(token) {
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
      } catch {
        return {};
      }
    },
  };
})();
