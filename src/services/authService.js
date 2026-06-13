/**
 * authService.js
 * Handles Google OAuth session via Google Identity Services (GIS).
 * Session is persisted in localStorage so page refresh keeps the user logged in.
 *
 * Whitelist is loaded dynamically from the `pst_admin` table in Supabase.
 */

const AuthService = (() => {
  const SESSION_KEY = 'admin_session';

  return {
    /**
     * Save a verified Google credential payload as the active session.
     * @param {Object} profile – decoded JWT payload from Google
     */
    saveSession(profile) {
      StorageService.set(SESSION_KEY, {
        email:   profile.email,
        name:    profile.name,
        picture: profile.picture,
        sub:     profile.sub,
        loginAt: new Date().toISOString(),
      });
    },

    /** Clear the active session (logout). */
    clearSession() {
      StorageService.remove(SESSION_KEY);
      if (window.google?.accounts?.id) {
        google.accounts.id.disableAutoSelect();
      }
    },

    /**
     * Return the active session object, or null if not logged in.
     * @returns {Object|null}
     */
    getSession() {
      return StorageService.get(SESSION_KEY, null);
    },

    /** Is there an active session? */
    isLoggedIn() {
      return this.getSession() !== null;
    },

    /**
     * Check whether the given email exists in the pst_admin table.
     * @param {string} email
     * @returns {Promise<boolean>}
     */
    async isAllowed(email) {
      const { data, error } = await SupabaseService.select('pst_admin', {
        email: `eq.${email.toLowerCase()}`,
        select: 'email',
      });
      if (error) {
        console.error('[AuthService] isAllowed error:', error);
        return false;
      }
      return Array.isArray(data) && data.length > 0;
    },

    /**
     * Decode a Google JWT credential (id_token) without verifying the signature.
     * Signature verification MUST be done server-side in production.
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
