/**
 * supabaseService.js
 * Low-level wrapper around Supabase REST API (PostgREST).
 * No external SDK needed — uses native fetch().
 */

const SupabaseService = (() => {
  const URL    = 'https://fufjaptmggulmzjrefvg.supabase.co/rest/v1';
  const APIKEY = 'sb_publishable_KpToL4zDIleZviiLL6hnvA_RXs3la0l';

  /** Default headers required by every Supabase REST request */
  const _headers = (extra = {}) => ({
    'Content-Type':  'application/json',
    'apikey':        APIKEY,
    'Authorization': `Bearer ${APIKEY}`,
    ...extra,
  });

  /**
   * INSERT one row into a table.
   * @param {string} table   – table name
   * @param {Object} payload – row data (column: value)
   * @returns {Promise<{ data: Object|null, error: string|null }>}
   */
  async function insert(table, payload) {
    try {
      const res = await fetch(`${URL}/${table}`, {
        method:  'POST',
        headers: _headers({ 'Prefer': 'return=representation' }),
        body:    JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json?.message || json?.error || `HTTP ${res.status}`;
        return { data: null, error: msg };
      }

      // PostgREST returns an array; we inserted one row so take first
      const row = Array.isArray(json) ? json[0] : json;
      return { data: row, error: null };

    } catch (err) {
      return { data: null, error: err.message || 'Network error.' };
    }
  }

  /**
   * SELECT rows from a table with optional filters.
   * @param {string} table
   * @param {Object} params – query params, e.g. { id_guest: 'eq.123' }
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function select(table, params = {}) {
    try {
      const qs = new URLSearchParams({ select: '*', ...params }).toString();
      const res = await fetch(`${URL}/${table}?${qs}`, {
        method:  'GET',
        headers: _headers(),
      });

      const json = await res.json();

      if (!res.ok) {
        return { data: [], error: json?.message || `HTTP ${res.status}` };
      }

      return { data: json, error: null };

    } catch (err) {
      return { data: [], error: err.message || 'Network error.' };
    }
  }

  return { insert, select };
})();
