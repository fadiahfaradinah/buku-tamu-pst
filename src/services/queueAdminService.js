/**
 * queueAdminService.js
 * Operasi admin untuk tabel pst_queue.
 * Semua query via Supabase SDK — RLS berlaku otomatis.
 *
 * pst_queue columns:
 *   id_queue     – PK serial
 *   id_guest     – FK → pst_guest
 *   queue_number – text  ("PST-01")
 *   queue_status – text  ("Menunggu" | "Sedang dilayani" | "Selesai")
 *   created_at   – timestamptz
 *   called_at    – timestamptz (nullable)
 *   finished_at  – timestamptz (nullable)
 */

const QueueAdminService = (() => {

  function _sb() {
    if (!window._supabase) throw new Error('Supabase client belum siap.');
    return window._supabase;
  }

  /** Tanggal lokal YYYY-MM-DD */
  function _today() {
    const d   = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /** Select query dasar dengan join pst_guest */
  function _baseQuery() {
    return _sb()
      .from('pst_queue')
      .select(`
        id_queue,
        queue_number,
        queue_status,
        created_at,
        called_at,
        finished_at,
        pst_guest (
          id_guest,
          guest_name,
          organization,
          id_purpose,
          purpose_desc,
          visit_date
        )
      `);
  }

  /**
   * Ambil semua antrian hari ini, join dengan pst_guest.
   * Dipakai untuk stat cards (selalu menunjukkan data hari ini).
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function getTodayQueue() {
    const today    = _today();
    const tomorrow = (() => {
      const d = new Date(); d.setDate(d.getDate() + 1);
      const p = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    })();

    const { data, error } = await _baseQuery()
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at',  `${tomorrow}T00:00:00`)
      .order('id_queue', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  }

  /**
   * Ambil semua antrian (semua tanggal), diurutkan terbaru di atas.
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function getAllQueue() {
    const { data, error } = await _baseQuery()
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  }

  /**
   * Ambil antrian berdasarkan range tanggal (berdasarkan created_at).
   * @param {string} dateFrom  – YYYY-MM-DD
   * @param {string} dateTo    – YYYY-MM-DD
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function getQueueByRange(dateFrom, dateTo) {
    const { data, error } = await _baseQuery()
      .gte('created_at', `${dateFrom}T00:00:00`)
      .lte('created_at', `${dateTo}T23:59:59`)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  }

  /**
   * Update queue_status dan timestamp terkait.
   * @param {number} idQueue
   * @param {'Sedang dilayani'|'Selesai'} newStatus
   * @returns {Promise<{ success: boolean, error: string|null }>}
   */
  async function updateStatus(idQueue, newStatus) {
    const patch = { queue_status: newStatus };
    if (newStatus === 'Sedang dilayani') patch.called_at   = new Date().toISOString();
    if (newStatus === 'Selesai')         patch.finished_at = new Date().toISOString();

    const { error } = await _sb()
      .from('pst_queue')
      .update(patch)
      .eq('id_queue', idQueue);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }

  /**
   * Ringkasan statistik hari ini dari array queue yang sudah diambil.
   * @param {Array} rows  – hasil getTodayQueue()
   * @returns {{ total, menunggu, dilayani, selesai, nomorDilayani }}
   */
  function getSummary(rows) {
    const menunggu  = rows.filter(r => r.queue_status === 'Menunggu').length;
    const dilayani  = rows.filter(r => r.queue_status === 'Sedang dilayani').length;
    const selesai   = rows.filter(r => r.queue_status === 'Selesai').length;
    const aktif     = rows.find(r => r.queue_status === 'Sedang dilayani');

    return {
      total:         rows.length,
      menunggu,
      dilayani,
      selesai,
      nomorDilayani: aktif?.queue_number ?? '-',
    };
  }

  return { getTodayQueue, getAllQueue, getQueueByRange, updateStatus, getSummary };
})();
