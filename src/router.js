/**
 * router.js
 * Simple hash-based client-side router.
 *
 * Routes:
 *   #/          → Welcome Page
 *   #/register  → Registrasi
 *   #/skd       → Isi SKD
 */

const Router = (() => {
  const routes = {};

  return {
    /**
     * Register a route handler.
     * @param {string}   path     – e.g. '/', '/register'
     * @param {Function} handler  – called with no args to render the page
     */
    on(path, handler) {
      routes[path] = handler;
    },

    /** Navigate programmatically. */
    navigate(path) {
      window.location.hash = path;
    },

    /** Resolve current hash and call the matching handler. */
    resolve() {
      const hash = window.location.hash.replace('#', '') || '/';
      const handler = routes[hash] || routes['/'];
      if (typeof handler === 'function') handler();
    },

    /** Bootstrap the router (listen for hash changes). */
    init() {
      window.addEventListener('hashchange', () => this.resolve());
      this.resolve(); // handle initial load
    },
  };
})();
