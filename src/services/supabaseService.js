/**
 * supabaseService.js
 *
 * Dual-mode wrapper:
 *   - Jika window._supabase tersedia (admin-index.html → SDK loaded) → pakai SDK
 *   - Jika tidak (index.html → halaman publik)                       → pakai raw fetch
 *
 * Ini memastikan registrasi tamu (index.html) tetap berjalan tanpa SDK,
 * sementara panel admin (admin-index.html) tetap dapat RLS via SDK session.
 */

const SupabaseService = (() => {
  const SUPABASE_URL = 'https://fufjaptmggulmzjrefvg.supabase.co';
  const ANON_KEY     = 'sb_publishable_KpToL4zDIleZviiLL6hnvA_RXs3la0l';
  const REST_URL     = `${SUPABASE_URL}/rest/v1`;

  /** Anon headers untuk raw fetch */
  const _anonHeaders = (extra = {}) => ({
    'Content-Type':  'application/json',
    'apikey':        ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    ...extra,
  });

  /** Apakah SDK tersedia? */
  const _hasSDK = () => !!window._supabase;

  // ── INSERT ─────────────────────────────────────────────────

  /**
   * INSERT satu baris ke tabel.
   * @param {string} table
   * @param {Object} payload
   * @returns {Promise<{ data: Object|null, error: string|null }>}
   */
  async function insert(table, payload) {
    // ── Via SDK (admin, session aktif) ──────────────────────
    if (_hasSDK()) {
      const { data, error } = await window._supabase
        .from(table)
        .insert(payload)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    }

    // ── Via raw fetch (halaman publik, tanpa SDK) ───────────
    try {
      const res = await fetch(`${REST_URL}/${table}`, {
        method:  'POST',
        headers: _anonHeaders({ 'Prefer': 'return=representation' }),
        body:    JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        return { data: null, error: json?.message || json?.error || `HTTP ${res.status}` };
      }

      const row = Array.isArray(json) ? json[0] : json;
      return { data: row, error: null };

    } catch (err) {
      return { data: null, error: err.message || 'Network error.' };
    }
  }

  // ── SELECT ─────────────────────────────────────────────────

  /**
   * SELECT baris dari tabel dengan filter opsional.
   * @param {string} table
   * @param {Object} filters – { kolom: 'eq.value' | 'gte.value' | 'lte.value' }
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function select(table, filters = {}) {
    // ── Via SDK ─────────────────────────────────────────────
    if (_hasSDK()) {
      let query = window._supabase.from(table).select('*');

      for (const [col, val] of Object.entries(filters)) {
        if (col === 'select' || col === 'order') continue;
        const [op, ...rest] = String(val).split('.');
        const v = rest.join('.');
        if (op === 'eq')  query = query.eq(col, v);
        if (op === 'gte') query = query.gte(col, v);
        if (op === 'lte') query = query.lte(col, v);
      }

      const { data, error } = await query;
      if (error) return { data: [], error: error.message };
      return { data: data ?? [], error: null };
    }

    // ── Via raw fetch ────────────────────────────────────────
    try {
      const qs = new URLSearchParams({ select: '*', ...filters }).toString();
      const res = await fetch(`${REST_URL}/${table}?${qs}`, {
        method:  'GET',
        headers: _anonHeaders(),
      });

      const json = await res.json();
      if (!res.ok) return { data: [], error: json?.message || `HTTP ${res.status}` };
      return { data: json, error: null };

    } catch (err) {
      return { data: [], error: err.message || 'Network error.' };
    }
  }

  return { insert, select };
})();
