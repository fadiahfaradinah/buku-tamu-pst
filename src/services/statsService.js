/**
 * statsService.js
 * Query data untuk halaman Dashboard statistik.
 *
 * Semua data dari tabel pst_guest (join pst_purpose untuk nama keperluan).
 */

const StatsService = (() => {

  function _sb() {
    if (!window._supabase) throw new Error('Supabase client belum siap.');
    return window._supabase;
  }

  /**
   * Ambil data pengunjung untuk satu tahun penuh (Jan–Des).
   * Return array 12 angka, index 0 = Januari.
   *
   * @param {number} year
   * @returns {Promise<{ monthly: number[], total: number, error: string|null }>}
   */
  async function getYearlyStats(year) {
    const { data, error } = await _sb()
      .from('pst_guest')
      .select('visit_date')
      .gte('visit_date', `${year}-01-01`)
      .lte('visit_date', `${year}-12-31`);

    if (error) return { monthly: Array(12).fill(0), total: 0, error: error.message };

    const monthly = Array(12).fill(0);
    (data ?? []).forEach(row => {
      const month = new Date(row.visit_date).getMonth(); // 0–11
      monthly[month]++;
    });

    return { monthly, total: (data ?? []).length, error: null };
  }

  /**
   * Ambil distribusi jenis keperluan untuk satu tahun.
   * Join ke pst_purpose untuk mendapatkan purpose_name.
   *
   * @param {number} year
   * @returns {Promise<{ labels: string[], counts: number[], error: string|null }>}
   */
  async function getYearlyPurpose(year) {
    const { data, error } = await _sb()
      .from('pst_guest')
      .select('id_purpose, pst_purpose(purpose_name)')
      .gte('visit_date', `${year}-01-01`)
      .lte('visit_date', `${year}-12-31`);

    if (error) return { labels: [], counts: [], error: error.message };

    return _aggregatePurpose(data ?? []);
  }

  /**
   * Ambil total pengunjung untuk satu bulan + distribusi keperluan.
   *
   * @param {number} year
   * @param {number} month  – 1–12
   * @returns {Promise<{
   *   total:  number,
   *   labels: string[],
   *   counts: number[],
   *   error:  string|null
   * }>}
   */
  async function getMonthlyStats(year, month) {
    const pad  = n => String(n).padStart(2, '0');
    const from = `${year}-${pad(month)}-01`;
    // Last day of month
    const lastDay = new Date(year, month, 0).getDate();
    const to   = `${year}-${pad(month)}-${pad(lastDay)}`;

    const { data, error } = await _sb()
      .from('pst_guest')
      .select('id_purpose, pst_purpose(purpose_name)')
      .gte('visit_date', from)
      .lte('visit_date', to);

    if (error) return { total: 0, labels: [], counts: [], error: error.message };

    const rows   = data ?? [];
    const agg    = _aggregatePurpose(rows);
    return { total: rows.length, labels: agg.labels, counts: agg.counts, error: null };
  }

  /**
   * Ambil daftar tahun yang ada di tabel pst_guest.
   * @returns {Promise<number[]>}
   */
  async function getAvailableYears() {
    const { data, error } = await _sb()
      .from('pst_guest')
      .select('visit_date')
      .order('visit_date', { ascending: true });

    if (error || !data?.length) {
      const y = new Date().getFullYear();
      return [y];
    }

    const years = [...new Set(data.map(r => new Date(r.visit_date).getFullYear()))];
    return years.sort((a, b) => b - a); // terbaru di atas
  }

  // ── Internal helper ────────────────────────────────────────
  function _aggregatePurpose(rows) {
    const map = {};
    rows.forEach(r => {
      const name = r.pst_purpose?.purpose_name || 'Lainnya';
      map[name] = (map[name] || 0) + 1;
    });
    return {
      labels: Object.keys(map),
      counts: Object.values(map),
    };
  }

  return { getYearlyStats, getYearlyPurpose, getMonthlyStats, getAvailableYears };
})();
