/**
 * storageService.js
 * Abstraction layer over localStorage.
 * All features read/write data through this service.
 */

const StorageService = (() => {
  const PREFIX = 'pst_bps_';

  const _key = (name) => `${PREFIX}${name}`;

  return {
    /**
     * Save a value (serialised as JSON).
     * @param {string} name
     * @param {*} value
     */
    set(name, value) {
      try {
        localStorage.setItem(_key(name), JSON.stringify(value));
      } catch (e) {
        console.error('[StorageService] set error:', e);
      }
    },

    /**
     * Retrieve and deserialise a value.
     * @param {string} name
     * @param {*} fallback – returned when key is absent
     * @returns {*}
     */
    get(name, fallback = null) {
      try {
        const raw = localStorage.getItem(_key(name));
        return raw !== null ? JSON.parse(raw) : fallback;
      } catch (e) {
        console.error('[StorageService] get error:', e);
        return fallback;
      }
    },

    /**
     * Remove a single key.
     * @param {string} name
     */
    remove(name) {
      localStorage.removeItem(_key(name));
    },

    /**
     * Clear every key that belongs to this app.
     */
    clearAll() {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    },
  };
})();
