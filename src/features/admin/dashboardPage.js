/**
 * dashboardPage.js
 * Feature: Admin Dashboard Shell
 *
 * Bertanggung jawab untuk:
 *   - Layout (sidebar + main)
 *   - Navigasi antar halaman admin (Buku Tamu | Kelola Antrian)
 *   - Routing konten ke sub-page yang sesuai
 */

const DashboardPage = (() => {

  // ── State ──────────────────────────────────────────────────
  let _activePage  = 'buku-tamu';

  // ── Buku Tamu sub-state ────────────────────────────────────
  let _allGuests   = [];
  let _dateFrom    = '';
  let _dateTo      = '';
  let _isFiltered  = false;

  // ── Template Shell ─────────────────────────────────────────
  function _template(session) {
    return `
      <div class="admin-layout">

        <!-- ░░ SIDEBAR ░░ -->
        <aside class="admin-sidebar" id="admin-sidebar">
          <div class="admin-sidebar-brand">
            <div class="admin-sidebar-logo" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="#1a3a6b"/>
                <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
                      font-family="Inter,sans-serif" font-size="16" font-weight="800"
                      fill="#FFD966">BPS</text>
              </svg>
            </div>
            <div class="admin-sidebar-brand-text">
              <span class="admin-sidebar-brand-name">BPS Parepare</span>
              <span class="admin-sidebar-brand-sub">Panel Admin</span>
            </div>
          </div>

          <nav class="admin-sidebar-nav" aria-label="Menu Admin">
            <ul>
              <li>
                <button class="admin-nav-item ${_activePage === 'buku-tamu' ? 'active' : ''}"
                        data-page="buku-tamu" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  Buku Tamu
                </button>
              </li>
              <li>
                <button class="admin-nav-item ${_activePage === 'antrian' ? 'active' : ''}"
                        data-page="antrian" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="8"  y1="6"  x2="21" y2="6"/>
                    <line x1="8"  y1="12" x2="21" y2="12"/>
                    <line x1="8"  y1="18" x2="21" y2="18"/>
                    <line x1="3"  y1="6"  x2="3.01" y2="6"/>
                    <line x1="3"  y1="12" x2="3.01" y2="12"/>
                    <line x1="3"  y1="18" x2="3.01" y2="18"/>
                  </svg>
                  Kelola Antrian
                </button>
              </li>
            </ul>
          </nav>

          <div class="admin-sidebar-footer">
            <div class="admin-user-info">
              <img class="admin-user-avatar" src="${session.picture || ''}"
                   alt="${_esc(session.name)}" referrerpolicy="no-referrer" />
              <div class="admin-user-detail">
                <span class="admin-user-name">${_esc(session.name)}</span>
                <span class="admin-user-email">${_esc(session.email)}</span>
              </div>
            </div>
            <button class="admin-logout-btn" id="btn-admin-logout" type="button" title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </aside>

        <!-- ░░ MAIN ░░ -->
        <main class="admin-main" id="admin-main">
          <div class="admin-topbar">
            <button class="admin-sidebar-toggle" id="btn-sidebar-toggle" type="button"
                    aria-label="Toggle sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 class="admin-topbar-title" id="admin-page-title">
              ${_activePage === 'antrian' ? 'Kelola Antrian' : 'Buku Tamu'}
            </h1>
          </div>
          <div class="admin-content" id="admin-content"></div>
        </main>

      </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  //  BUKU TAMU
  // ═══════════════════════════════════════════════════════════

  function _bukuTamuContent() {
    return `
      <div class="bt-toolbar">
        <div class="bt-search-wrap">
          <svg class="bt-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="bt-search-input" id="bt-search" type="text"
                 placeholder="Cari nama tamu…" aria-label="Cari nama tamu" />
        </div>

        <div class="bt-filter-wrap">
          <label class="bt-filter-label" for="bt-date-from">Dari</label>
          <input class="bt-date-input" id="bt-date-from" type="date" />
          <label class="bt-filter-label" for="bt-date-to">Sampai</label>
          <input class="bt-date-input" id="bt-date-to" type="date" />
          <button class="bt-btn bt-btn--primary" id="btn-apply-filter" type="button">Filter</button>
          <button class="bt-btn bt-btn--outline" id="btn-clear-filter" type="button">Clear Filter</button>
        </div>

        <button class="bt-btn bt-btn--success" id="btn-export" type="button">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Excel
        </button>
      </div>

      <div class="bt-filter-badge hidden" id="bt-filter-badge">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <span id="bt-filter-badge-text"></span>
      </div>

      <div class="bt-table-wrap">
        <table class="bt-table" id="bt-table">
          <thead>
            <tr>
              <th>No.</th><th>Nama Lengkap</th><th>Asal Instansi</th>
              <th>Alamat</th><th>Kontak WA</th><th>Email</th>
              <th>Jenis Keperluan</th><th>Deskripsi Keperluan</th>
              <th>Tanggal Kunjungan</th><th>Action</th>
            </tr>
          </thead>
          <tbody id="bt-tbody">
            <tr><td colspan="10" class="bt-loading"><div class="bt-spinner"></div> Memuat data…</td></tr>
          </tbody>
        </table>
      </div>

      <div class="bt-footer-info" id="bt-footer-info"></div>

      <div class="bt-modal-overlay hidden" id="bt-modal-overlay" role="dialog"
           aria-modal="true" aria-labelledby="bt-modal-title">
        <div class="bt-modal">
          <h2 class="bt-modal-title" id="bt-modal-title">Hapus Data Tamu</h2>
          <p class="bt-modal-body" id="bt-modal-body"></p>
          <div class="bt-modal-actions">
            <button class="bt-btn bt-btn--outline" id="btn-modal-cancel" type="button">Batal</button>
            <button class="bt-btn bt-btn--danger"  id="btn-modal-confirm" type="button">Hapus</button>
          </div>
        </div>
      </div>`;
  }

  function _renderBukuTamuTable(rows) {
    const tbody = document.getElementById('bt-tbody');
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="10" class="bt-empty">Tidak ada data tamu.</td></tr>`;
      _updateBTFooter(0); return;
    }
    tbody.innerHTML = rows.map((g, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${_esc(g.guest_name)}</td>
        <td>${_esc(g.organization)}</td>
        <td>${_esc(g.address || '-')}</td>
        <td>${_esc(g.wa_number)}</td>
        <td>${_esc(g.guest_email || '-')}</td>
        <td>${_esc(AdminService.purposeLabel(g.id_purpose))}</td>
        <td class="bt-td-desc">${_esc(g.purpose_desc || '-')}</td>
        <td>${AdminService.formatDate(g.visit_date)}</td>
        <td>
          <button class="bt-btn-delete" data-id="${g.id_guest}"
                  data-name="${_esc(g.guest_name)}" type="button" title="Hapus">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </button>
        </td>
      </tr>`).join('');
    _updateBTFooter(rows.length);
  }

  function _updateBTFooter(count) {
    const el = document.getElementById('bt-footer-info');
    if (el) el.textContent = `Menampilkan ${count} tamu`;
  }

  function _getDisplayRows() {
    const q = (document.getElementById('bt-search')?.value || '').toLowerCase().trim();
    return q ? _allGuests.filter(g => (g.guest_name || '').toLowerCase().includes(q)) : _allGuests;
  }

  async function _loadAllGuests() {
    const { data, error } = await AdminService.getAllGuests();
    if (error) { _renderBTError(error); return; }
    _allGuests = data; _isFiltered = false;
    _updateFilterBadge(); _renderBukuTamuTable(_getDisplayRows());
  }

  async function _loadGuestRange(from, to) {
    const tbody = document.getElementById('bt-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="bt-loading"><div class="bt-spinner"></div> Memuat data…</td></tr>`;
    const { data, error } = await AdminService.getGuestsByRange(from, to);
    if (error) { _renderBTError(error); return; }
    _allGuests = data; _isFiltered = true; _dateFrom = from; _dateTo = to;
    _updateFilterBadge(); _renderBukuTamuTable(_getDisplayRows());
  }

  function _renderBTError(msg) {
    const tbody = document.getElementById('bt-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="bt-error">Gagal memuat: ${_esc(msg)}</td></tr>`;
  }

  function _updateFilterBadge() {
    const badge = document.getElementById('bt-filter-badge');
    const text  = document.getElementById('bt-filter-badge-text');
    if (!badge || !text) return;
    if (_isFiltered) {
      text.textContent = `Filter aktif: ${AdminService.formatDate(_dateFrom)} – ${AdminService.formatDate(_dateTo)}`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  function _exportExcel() {
    const rows = _getDisplayRows();
    const headers = ['No.','Nama Lengkap','Asal Instansi','Alamat','Kontak WA',
                     'Email','Jenis Keperluan','Deskripsi Keperluan','Tanggal Kunjungan'];
    const csvRows = [
      headers.join(','),
      ...rows.map((g, i) => [
        i + 1, _csvCell(g.guest_name), _csvCell(g.organization),
        _csvCell(g.address), _csvCell(g.wa_number), _csvCell(g.guest_email),
        _csvCell(AdminService.purposeLabel(g.id_purpose)), _csvCell(g.purpose_desc),
        AdminService.formatDate(g.visit_date),
      ].join(','))
    ].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = _isFiltered ? `daftar_tamu_${_dateFrom}_sd_${_dateTo}.csv` : 'daftar_tamu_semua.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function _csvCell(val) { return `"${String(val ?? '').replace(/"/g, '""')}"`; }

  let _pendingDeleteId = null;

  function _showDeleteModal(id, name) {
    _pendingDeleteId = id;
    const body = document.getElementById('bt-modal-body');
    if (body) body.textContent = `Yakin ingin menghapus data tamu "${name}"? Tindakan ini tidak bisa dibatalkan.`;
    document.getElementById('bt-modal-overlay')?.classList.remove('hidden');
  }

  function _hideModal() {
    document.getElementById('bt-modal-overlay')?.classList.add('hidden');
    _pendingDeleteId = null;
  }

  async function _confirmDelete() {
    if (!_pendingDeleteId) return;
    const id = _pendingDeleteId;
    _hideModal();
    const { success, error } = await AdminService.deleteGuest(id);
    if (!success) { alert(`Gagal menghapus: ${error}`); return; }
    _allGuests = _allGuests.filter(g => g.id_guest !== id);
    _renderBukuTamuTable(_getDisplayRows());
  }

  function _bindBukuTamuEvents() {
    document.getElementById('bt-search')?.addEventListener('input', () => _renderBukuTamuTable(_getDisplayRows()));

    document.getElementById('btn-apply-filter')?.addEventListener('click', () => {
      const from = document.getElementById('bt-date-from')?.value;
      const to   = document.getElementById('bt-date-to')?.value;
      if (!from || !to) { alert('Pilih tanggal dari dan sampai.'); return; }
      if (from > to)    { alert('Tanggal "Dari" tidak boleh melebihi "Sampai".'); return; }
      _loadGuestRange(from, to);
    });

    document.getElementById('btn-clear-filter')?.addEventListener('click', () => {
      document.getElementById('bt-date-from').value = '';
      document.getElementById('bt-date-to').value   = '';
      _loadAllGuests();
    });

    document.getElementById('btn-export')?.addEventListener('click', _exportExcel);

    document.getElementById('bt-tbody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.bt-btn-delete');
      if (!btn) return;
      _showDeleteModal(Number(btn.dataset.id), btn.dataset.name);
    });

    document.getElementById('btn-modal-cancel')?.addEventListener('click', _hideModal);
    document.getElementById('btn-modal-confirm')?.addEventListener('click', _confirmDelete);
    document.getElementById('bt-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) _hideModal();
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  PAGE SWITCHING
  // ═══════════════════════════════════════════════════════════

  async function _switchPage(page) {
    _activePage = page;

    // Update active state di sidebar
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Update topbar title
    const title = document.getElementById('admin-page-title');
    if (title) title.textContent = page === 'antrian' ? 'Kelola Antrian' : 'Buku Tamu';

    const content = document.getElementById('admin-content');
    if (!content) return;

    if (page === 'antrian') {
      await QueuePage.render(content);
    } else {
      content.innerHTML = _bukuTamuContent();
      _bindBukuTamuEvents();
      await _loadAllGuests();
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  SHELL EVENT BINDINGS
  // ═══════════════════════════════════════════════════════════

  function _bindShellEvents() {
    document.getElementById('btn-admin-logout')?.addEventListener('click', async () => {
      await AuthService.signOut();
      window.location.href = 'admin-index.html';
    });

    document.getElementById('btn-sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('admin-sidebar')?.classList.toggle('open');
    });

    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      btn.addEventListener('click', () => _switchPage(btn.dataset.page));
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════════════════

  function _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _ensureStyles() {
    if (!document.getElementById('css-dashboard')) {
      const link = document.createElement('link');
      link.id = 'css-dashboard'; link.rel = 'stylesheet';
      link.href = 'src/styles/dashboard.css';
      document.head.appendChild(link);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════

  return {
    async render() {
      // Boot sudah memastikan user valid sebelum router jalan.
      // Tidak perlu cek isLoggedIn() di sini lagi.
      _ensureStyles();
      _activePage = 'buku-tamu';

      const profile = await AuthService.getUserProfile();
      const session = profile ?? { name: 'Admin', email: '', picture: '' };

      document.getElementById('app').innerHTML = _template(session);
      _bindShellEvents();

      const content = document.getElementById('admin-content');
      content.innerHTML = _bukuTamuContent();
      _bindBukuTamuEvents();
      await _loadAllGuests();
    },
  };
})();
