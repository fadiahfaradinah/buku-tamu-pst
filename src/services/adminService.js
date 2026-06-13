/**
 * adminService.js
 * Business logic for admin panel operations.
 * Semua request REST menggunakan Supabase access_token dari AuthService
 * sehingga Row-Level Security (RLS) pada Supabase tetap berlaku.
 */

const AdminService = (() => {

  // Map id_purpose → label
  const PURPOSE_LABELS = {
    1: 'Tugas sekolah/tugas kuliah',
    2: 'Pemerintahan',
    3: 'Komersial',
    4: 'Penelitian',
    5: 'Lainnya',
  };

  /** Ambil access_token atau throw jika tidak ada session. */
  function _token() {
    const token = AuthService.getAccessToken();
    if (!token) throw new Error('Tidak ada session aktif. Silakan login ulang.');
    return token;
  }

  /**
   * Fetch semua tamu, diurutkan visit_date descending.
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function getAllGuests() {
    try {
      return await SupabaseService.selectAuth(
        _token(),
        'pst_guest',
        { order: 'visit_date.desc,id_guest.desc' }
      );
    } catch (err) {
      return { data: [], error: err.message };
    }
  }

  /**
   * Fetch tamu berdasarkan range tanggal kunjungan.
   * @param {string} dateFrom  – YYYY-MM-DD
   * @param {string} dateTo    – YYYY-MM-DD
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function getGuestsByRange(dateFrom, dateTo) {
    try {
      // URLSearchParams tidak support multiple key yang sama,
      // jadi kita bangun query string manual untuk dua filter visit_date.
      const SUPABASE_URL = 'https://fufjaptmggulmzjrefvg.supabase.co/rest/v1';
      const ANON_KEY     = 'sb_publishable_KpToL4zDIleZviiLL6hnvA_RXs3la0l';
      const token        = _token();

      const qs = `select=*&visit_date=gte.${dateFrom}&visit_date=lte.${dateTo}&order=visit_date.desc,id_guest.desc`;

      const res = await fetch(`${SUPABASE_URL}/pst_guest?${qs}`, {
        headers: {
          'Content-Type':  'application/json',
          'apikey':        ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) return { data: [], error: json?.message || `HTTP ${res.status}` };
      return { data: json, error: null };

    } catch (err) {
      return { data: [], error: err.message };
    }
  }

  /**
   * Hapus satu record tamu berdasarkan id_guest.
   * @param {number|string} id
   * @returns {Promise<{ success: boolean, error: string|null }>}
   */
  async function deleteGuest(id) {
    try {
      return await SupabaseService.deleteAuth(
        _token(),
        'pst_guest',
        `id_guest=eq.${id}`
      );
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Label untuk id_purpose.
   * @param {number} id
   * @returns {string}
   */
  function purposeLabel(id) {
    return PURPOSE_LABELS[id] || '-';
  }

  /**
   * Format YYYY-MM-DD → DD/MM/YYYY.
   * @param {string} dateStr
   * @returns {string}
   */
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  return { getAllGuests, getGuestsByRange, deleteGuest, purposeLabel, formatDate };
})();
