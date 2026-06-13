/**
 * supabaseService.js
 *
 * Wrapper tipis di atas Supabase JS SDK (v2, loaded via CDN).
 * Ekspor satu instance `supabase` yang dipakai oleh semua service lain.
 *
 * SDK menangani:
 *   - OAuth redirect & PKCE flow
 *   - Session storage di localStorage (otomatis)
 *   - Token refresh otomatis
 *   - Authorization header di setiap request (RLS via auth.uid() / auth.email())
 *
 * Untuk operasi data publik (registrasi tamu) tetap pakai supabase client
 * yang sama — anon key sudah cukup selama RLS policy dikonfigurasi dengan benar.
 */

// `supabase` di-inisialisasi setelah SDK dimuat (lihat admin-index.html).
// File ini hanya menyediakan helper INSERT/SELECT untuk kode lama yang masih
// membutuhkan pola { data, error } tanpa SDK boilerplate berulang.

const SupabaseService = (() => {

  /**
   * Ambil instance Supabase SDK yang sudah diinisialisasi.
   * Throw jika belum siap — artinya urutan script salah.
   */
  function _client() {
    if (!window._supabase) {
      throw new Error('[SupabaseService] Supabase client belum diinisialisasi.');
    }
    return window._supabase;
  }

  // ── REST helpers (tetap dipakai oleh guestService / queueService) ──

  /**
   * INSERT satu baris ke tabel.
   * @param {string} table
   * @param {Object} payload
   * @returns {Promise<{ data: Object|null, error: string|null }>}
   */
  async function insert(table, payload) {
    const { data, error } = await _client()
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  /**
   * SELECT baris dari tabel dengan filter opsional.
   * @param {string} table
   * @param {Object} filters  – key: kolom, value: string filter PostgREST ('eq.xxx')
   *                           atau gunakan format { column, operator, value } chain
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function select(table, filters = {}) {
    let query = _client().from(table).select('*');

    // Terapkan filter sederhana: { email: 'eq.foo@bar.com' }
    for (const [col, val] of Object.entries(filters)) {
      if (col === 'select' || col === 'order') continue; // skip non-filter keys
      const [op, ...rest] = String(val).split('.');
      const filterVal = rest.join('.');
      if (op === 'eq')  query = query.eq(col, filterVal);
      if (op === 'gte') query = query.gte(col, filterVal);
      if (op === 'lte') query = query.lte(col, filterVal);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  }

  return { insert, select };
})();
