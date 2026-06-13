/**
 * adminService.js
 * Business logic untuk panel admin.
 *
 * Semua query pakai Supabase SDK langsung — SDK otomatis attach
 * Authorization header dari session aktif, sehingga RLS berlaku
 * tanpa perlu meneruskan token secara manual.
 */

const AdminService = (() => {

  const PURPOSE_LABELS = {
    1: 'Tugas sekolah/tugas kuliah',
    2: 'Pemerintahan',
    3: 'Komersial',
    4: 'Penelitian',
    5: 'Lainnya',
  };

  function _sb() {
    if (!window._supabase) throw new Error('Supabase client belum siap.');
    return window._supabase;
  }

  /**
   * Fetch semua tamu, diurutkan visit_date descending.
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function getAllGuests() {
    const { data, error } = await _sb()
      .from('pst_guest')
      .select('*')
      .order('visit_date', { ascending: false })
      .order('id_guest',   { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  }

  /**
   * Fetch tamu berdasarkan range tanggal kunjungan.
   * @param {string} dateFrom  – YYYY-MM-DD
   * @param {string} dateTo    – YYYY-MM-DD
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function getGuestsByRange(dateFrom, dateTo) {
    const { data, error } = await _sb()
      .from('pst_guest')
      .select('*')
      .gte('visit_date', dateFrom)
      .lte('visit_date', dateTo)
      .order('visit_date', { ascending: false })
      .order('id_guest',   { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  }

  /**
   * Hapus satu record tamu berdasarkan id_guest.
   * @param {number|string} id
   * @returns {Promise<{ success: boolean, error: string|null }>}
   */
  async function deleteGuest(id) {
    const { error } = await _sb()
      .from('pst_guest')
      .delete()
      .eq('id_guest', id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
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
