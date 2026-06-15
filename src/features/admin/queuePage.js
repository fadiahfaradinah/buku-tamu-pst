/**
 * queuePage.js
 * Feature: Admin – Kelola Antrian
 *
 * Stat cards  → selalu menunjukkan data HARI INI (tidak terpengaruh filter).
 * Tabel       → default semua antrian; bisa difilter berdasarkan range tanggal.
 *
 * Aturan bisnis aksi:
 *   - Hanya 1 tamu bisa "Sedang dilayani" dalam satu waktu.
 *   - Tombol Panggil antrian lain di-disable saat ada yang sedang dilayani.
 *   - Setelah Selesaikan → row tersebut done, row lain aktif kembali.
 *   - Aksi hanya diperbolehkan pada antrian hari ini (bukan antrian lampau).
 */

const QueuePage = (() => {

  // ── State ──────────────────────────────────────────────────
  let _tableRows  = [];   // data yang ditampilkan di tabel (all / filtered)
  let _todayRows  = [];   // data hari ini untuk stat cards
  let _isFiltered = false;
  let _dateFrom   = '';
  let _dateTo     = '';

  // ── Helpers ────────────────────────────────────────────────
  const PURPOSE_LABELS = {
    1: 'Tugas sekolah/tugas kuliah',
    2: 'Pemerintahan',
    3: 'Komersial',
    4: 'Penelitian',
    5: 'Lainnya',
  };

  function _purposeLabel(id) { return PURPOSE_LABELS[id] || '-'; }

  function _formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  function _todayISO() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function _isToday(isoStr) {
    return isoStr?.slice(0, 10) === _todayISO();
  }

  function _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Template ───────────────────────────────────────────────
  function _template() {
    const today = _todayISO();
    return `
      <!-- ░░ STAT CARDS — selalu data hari ini ░░ -->
      <div class="aq-stats" id="aq-stats">

        <div class="aq-stat-card aq-stat--total">
          <div class="aq-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
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

      <!-- ░░ FILTER ░░ -->
      <div class="bt-toolbar" style="margin-top:20px;">
        <div class="bt-filter-wrap">
          <label class="bt-filter-label" for="aq-date-from">Dari</label>
          <input class="bt-date-input" id="aq-date-from" type="date"
                 aria-label="Tanggal dari" />
          <label class="bt-filter-label" for="aq-date-to">Sampai</label>
          <input class="bt-date-input" id="aq-date-to" type="date"
                 aria-label="Tanggal sampai" />
          <button class="bt-btn bt-btn--primary" id="btn-aq-filter" type="button">Filter</button>
          <button class="bt-btn bt-btn--outline" id="btn-aq-clear"  type="button">Clear Filter</button>
        </div>
      </div>

      <!-- Filter badge -->
      <div class="bt-filter-badge hidden" id="aq-filter-badge">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <span id="aq-filter-badge-text"></span>
      </div>

      <!-- ░░ TABLE ░░ -->
      <div class="bt-table-wrap" style="margin-top:12px;">
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
      </div>

      <div class="bt-footer-info" id="aq-footer-info"></div>`;
  }

  // ── Render stat cards (selalu pakai _todayRows) ────────────
  function _renderStats() {
    const s = QueueAdminService.getSummary(_todayRows);
    document.getElementById('stat-total').textContent    = s.total;
    document.getElementById('stat-menunggu').textContent = s.menunggu;
    document.getElementById('stat-dilayani').textContent = s.dilayani;
    document.getElementById('stat-selesai').textContent  = s.selesai;
    document.getElementById('stat-nomor').textContent    = s.nomorDilayani;
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

    if (!_tableRows.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="bt-empty">Tidak ada data antrian.</td></tr>`;
      _updateFooter(0);
      return;
    }

    // Cek apakah ada yang sedang dilayani HARI INI
    // (aksi panggil/selesai hanya relevan untuk antrian hari ini)
    const adaYangDilayani = _todayRows.some(r => r.queue_status === 'Sedang dilayani');

    tbody.innerHTML = _tableRows.map(r => {
      const guest   = r.pst_guest ?? {};
      const status  = r.queue_status;
      const idQueue = r.id_queue;
      const isRowToday = _isToday(r.created_at);

      let actionHtml = '';

      if (!isRowToday) {
        // Antrian lampau — tidak ada aksi
        actionHtml = `<span class="aq-done-label">–</span>`;
      } else if (status === 'Menunggu') {
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

    _updateFooter(_tableRows.length);
  }

  function _statusClass(s) {
    if (s === 'Sedang dilayani') return 'active';
    if (s === 'Selesai')         return 'done';
    return 'waiting';
  }

  function _updateFooter(count) {
    const el = document.getElementById('aq-footer-info');
    if (el) el.textContent = `Menampilkan ${count} antrian`;
  }

  function _updateFilterBadge() {
    const badge = document.getElementById('aq-filter-badge');
    const text  = document.getElementById('aq-filter-badge-text');
    if (!badge || !text) return;
    if (_isFiltered) {
      text.textContent = `Filter aktif: ${_formatDate(_dateFrom + 'T00:00:00')} – ${_formatDate(_dateTo + 'T00:00:00')}`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // ── Load data ──────────────────────────────────────────────

  /** Load stat cards (hari ini) — selalu dipanggil terpisah */
  async function _loadTodayStats() {
    const { data } = await QueueAdminService.getTodayQueue();
    _todayRows = data ?? [];
    _renderStats();
  }

  /** Load semua antrian untuk tabel */
  async function _loadAll() {
    _setTableLoading();
    const { data, error } = await QueueAdminService.getAllQueue();
    if (error) { _renderTableError(error); return; }
    _tableRows  = data ?? [];
    _isFiltered = false;
    _updateFilterBadge();
    _renderTable();
  }

  /** Load antrian berdasarkan range tanggal */
  async function _loadRange(from, to) {
    _setTableLoading();
    const { data, error } = await QueueAdminService.getQueueByRange(from, to);
    if (error) { _renderTableError(error); return; }
    _tableRows  = data ?? [];
    _isFiltered = true;
    _dateFrom   = from;
    _dateTo     = to;
    _updateFilterBadge();
    _renderTable();
  }

  function _setTableLoading() {
    const tbody = document.getElementById('aq-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="bt-loading"><div class="bt-spinner"></div> Memuat data…</td></tr>`;
  }

  function _renderTableError(msg) {
    const tbody = document.getElementById('aq-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="bt-error">Gagal memuat: ${_esc(msg)}</td></tr>`;
  }

  // ── Action handlers ────────────────────────────────────────
  async function _handleAction(idQueue, action) {
    const newStatus = action === 'panggil' ? 'Sedang dilayani' : 'Selesai';

    // Optimistic update di _tableRows
    const tableRow = _tableRows.find(r => r.id_queue === idQueue);
    if (tableRow) {
      tableRow.queue_status = newStatus;
      if (newStatus === 'Sedang dilayani') tableRow.called_at   = new Date().toISOString();
      if (newStatus === 'Selesai')         tableRow.finished_at = new Date().toISOString();
    }

    // Sync ke _todayRows juga (untuk stat cards)
    const todayRow = _todayRows.find(r => r.id_queue === idQueue);
    if (todayRow) {
      todayRow.queue_status = newStatus;
      if (newStatus === 'Sedang dilayani') todayRow.called_at   = new Date().toISOString();
      if (newStatus === 'Selesai')         todayRow.finished_at = new Date().toISOString();
    }

    _renderStats();
    _renderTable();

    // Persist ke Supabase
    const { success, error } = await QueueAdminService.updateStatus(idQueue, newStatus);
    if (!success) {
      alert(`Gagal memperbarui status: ${error}`);
      // Rollback: reload dari server
      await Promise.all([_loadTodayStats(), _loadAll()]);
    }
  }

  // ── Event bindings ─────────────────────────────────────────
  function _bindEvents() {
    // Filter apply
    document.getElementById('btn-aq-filter')?.addEventListener('click', () => {
      const from = document.getElementById('aq-date-from')?.value;
      const to   = document.getElementById('aq-date-to')?.value;
      if (!from || !to) { alert('Pilih tanggal dari dan sampai terlebih dahulu.'); return; }
      if (from > to)    { alert('Tanggal "Dari" tidak boleh melebihi "Sampai".'); return; }
      _loadRange(from, to);
    });

    // Clear filter
    document.getElementById('btn-aq-clear')?.addEventListener('click', () => {
      document.getElementById('aq-date-from').value = '';
      document.getElementById('aq-date-to').value   = '';
      _loadAll();
    });

    // Action buttons (delegated)
    document.getElementById('aq-tbody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || btn.disabled) return;
      _handleAction(Number(btn.dataset.id), btn.dataset.action);
    });
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    async render(contentEl) {
      contentEl.innerHTML = _template();
      _bindEvents();

      // Load keduanya paralel
      await Promise.all([
        _loadTodayStats(),
        _loadAll(),
      ]);
    },
  };
})();
