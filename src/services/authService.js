/**
 * authService.js
 * Handles Google OAuth session via Google Identity Services (GIS).
 * Session is persisted in localStorage so page refresh keeps the user logged in.
 */

const AuthService = (() => {
  const SESSION_KEY = 'admin_session';

  // ── Whitelist: only these Gmail addresses may access the admin panel.
  // Leave the array EMPTY to allow ANY Google account (not recommended for production).
  const ALLOWED_EMAILS = [
    // 'admin@gmail.com',
  ];

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
      // Also revoke the GIS token if the library is loaded
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
     * Check whether the given email is permitted to access admin.
     * If ALLOWED_EMAILS is empty, everyone is permitted.
     * @param {string} email
     * @returns {boolean}
     */
    isAllowed(email) {
      if (!ALLOWED_EMAILS.length) return true;
      return ALLOWED_EMAILS.includes(email.toLowerCase());
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
