/**
 * queuePage.js
 * Feature: Admin – Kelola Antrian
 *
 * Menampilkan:
 *   - 5 kartu statistik hari ini
 *   - Tabel daftar antrian dengan action Panggil / Selesaikan
 *
 * Aturan bisnis:
 *   - Hanya 1 tamu bisa berstatus "Sedang dilayani" pada satu waktu.
 *   - Ketika 1 tamu sedang dilayani → semua tombol "Panggil Antrian" row lain di-disable.
 *   - Ketika di-"Selesaikan" → row tersebut selesai, row lain kembali aktif.
 */

const QueuePage = (() => {

  // ── State ──────────────────────────────────────────────────
  let _rows = []; // hasil getTodayQueue()

  // ── Purpose label ─────────────────────────────────────────
  const PURPOSE_LABELS = {
    1: 'Tugas sekolah/tugas kuliah',
    2: 'Pemerintahan',
    3: 'Komersial',
    4: 'Penelitian',
    5: 'Lainnya',
  };
  function _purposeLabel(id) { return PURPOSE_LABELS[id] || '-'; }

  // ── Format date ────────────────────────────────────────────
  function _formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  // ── Escape HTML ────────────────────────────────────────────
  function _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Template konten halaman ────────────────────────────────
  function _template() {
    return `
      <!-- ░ STAT CARDS ░ -->
      <div class="aq-stats" id="aq-stats">
        <div class="aq-stat-card aq-stat--total">
          <div class="aq-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="aq-stat-body">
            <span class="aq-stat-label">Tamu Hari Ini</span>
            <span class="aq-stat-value" id="stat-total">–</span>
          </div>
        </div>

        <div class="aq-stat-card aq-stat--menunggu">
          <div class="aq-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="aq-stat-body">
            <span class="aq-stat-label">Menunggu</span>
            <span class="aq-stat-value" id="stat-menunggu">–</span>
          </div>
        </div>

        <div class="aq-stat-card aq-stat--dilayani">
          <div class="aq-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="aq-stat-body">
            <span class="aq-stat-label">Sedang Dilayani</span>
            <span class="aq-stat-value" id="stat-dilayani">–</span>
          </div>
        </div>

        <div class="aq-stat-card aq-stat--selesai">
          <div class="aq-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="aq-stat-body">
            <span class="aq-stat-label">Selesai</span>
            <span class="aq-stat-value" id="stat-selesai">–</span>
          </div>
        </div>

        <div class="aq-stat-card aq-stat--nomor">
          <div class="aq-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div class="aq-stat-body">
            <span class="aq-stat-label">Nomor Dilayani</span>
            <span class="aq-stat-value aq-stat-nomor-val" id="stat-nomor">–</span>
          </div>
        </div>
      </div>

      <!-- ░ TABLE ░ -->
      <div class="bt-table-wrap" style="margin-top:20px;">
        <table class="bt-table" id="aq-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>No. Antrian</th>
              <th>Nama</th>
              <th>Instansi</th>
              <th>Tujuan</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="aq-tbody">
            <tr>
              <td colspan="7" class="bt-loading">
                <div class="bt-spinner"></div> Memuat data…
              </td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  // ── Render stats ───────────────────────────────────────────
  function _renderStats(summary) {
    document.getElementById('stat-total')?.textContent    != null &&
      (document.getElementById('stat-total').textContent    = summary.total);
    document.getElementById('stat-menunggu').textContent  = summary.menunggu;
    document.getElementById('stat-dilayani').textContent  = summary.dilayani;
    document.getElementById('stat-selesai').textContent   = summary.selesai;
    document.getElementById('stat-nomor').textContent     = summary.nomorDilayani;
  }

  // ── Status badge ───────────────────────────────────────────
  function _badge(status) {
    const map = {
      'Menunggu':        'aq-badge--menunggu',
      'Sedang dilayani': 'aq-badge--dilayani',
      'Selesai':         'aq-badge--selesai',
    };
    return `<span class="aq-badge ${map[status] || ''}">${_esc(status)}</span>`;
  }

  // ── Render table ───────────────────────────────────────────
  function _renderTable() {
    const tbody = document.getElementById('aq-tbody');
    if (!tbody) return;

    if (!_rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="bt-empty">Belum ada antrian hari ini.</td></tr>`;
      return;
    }

    // Cek apakah ada yang sedang dilayani
    const adaYangDilayani = _rows.some(r => r.queue_status === 'Sedang dilayani');

    tbody.innerHTML = _rows.map(r => {
      const guest   = r.pst_guest ?? {};
      const status  = r.queue_status;
      const idQueue = r.id_queue;

      let actionHtml = '';

      if (status === 'Menunggu') {
        const disabled = adaYangDilayani ? 'disabled' : '';
        actionHtml = `
          <button class="aq-btn aq-btn--panggil" data-id="${idQueue}" data-action="panggil"
                  type="button" ${disabled}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
                       A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44
                       2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81
                       a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91
                       a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7
                       A2 2 0 0 1 21.73 16.92z"/>
            </svg>
            Panggil
          </button>`;
      } else if (status === 'Sedang dilayani') {
        actionHtml = `
          <button class="aq-btn aq-btn--selesai" data-id="${idQueue}" data-action="selesai"
                  type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Selesaikan
          </button>`;
      } else {
        // Selesai — tidak ada action
        actionHtml = `<span class="aq-done-label">–</span>`;
      }

      return `
        <tr class="aq-row aq-row--${_statusClass(status)}" data-queue-id="${idQueue}">
          <td>${_formatDate(r.created_at)}</td>
          <td><strong>${_esc(r.queue_number)}</strong></td>
          <td>${_esc(guest.guest_name || '-')}</td>
          <td>${_esc(guest.organization || '-')}</td>
          <td>${_esc(_purposeLabel(guest.id_purpose))}</td>
          <td>${_badge(status)}</td>
          <td>${actionHtml}</td>
        </tr>`;
    }).join('');

    // Update stat cards setiap kali tabel di-render ulang
    const summary = QueueAdminService.getSummary(_rows);
    _renderStats(summary);
  }

  function _statusClass(s) {
    if (s === 'Sedang dilayani') return 'active';
    if (s === 'Selesai')         return 'done';
    return 'waiting';
  }

  // ── Load data ──────────────────────────────────────────────
  async function _load() {
    const { data, error } = await QueueAdminService.getTodayQueue();
    if (error) {
      const tbody = document.getElementById('aq-tbody');
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="bt-error">Gagal memuat: ${_esc(error)}</td></tr>`;
      return;
    }
    _rows = data;
    _renderTable();
  }

  // ── Action handlers ────────────────────────────────────────
  async function _handleAction(idQueue, action) {
    const newStatus = action === 'panggil' ? 'Sedang dilayani' : 'Selesai';

    // Optimistic UI: update state lokal dulu
    const row = _rows.find(r => r.id_queue === idQueue);
    if (!row) return;
    row.queue_status = newStatus;
    if (newStatus === 'Sedang dilayani') row.called_at   = new Date().toISOString();
    if (newStatus === 'Selesai')         row.finished_at = new Date().toISOString();
    _renderTable();

    // Persist ke Supabase
    const { success, error } = await QueueAdminService.updateStatus(idQueue, newStatus);
    if (!success) {
      alert(`Gagal memperbarui status: ${error}`);
      // Rollback: reload dari server
      await _load();
    }
  }

  // ── Event bindings ─────────────────────────────────────────
  function _bindTableEvents() {
    document.getElementById('aq-tbody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || btn.disabled) return;
      const idQueue = Number(btn.dataset.id);
      const action  = btn.dataset.action;
      _handleAction(idQueue, action);
    });
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    async render(contentEl) {
      contentEl.innerHTML = _template();
      _bindTableEvents();
      await _load();
    },
  };
})();
