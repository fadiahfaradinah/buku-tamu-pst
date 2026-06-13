/**
 * dashboardPage.js
 * Feature: Admin Dashboard – Buku Tamu
 *
 * Layout:
 *   - Sidebar kiri dengan navigasi menu
 *   - Main content: tabel daftar tamu dengan search, filter tanggal, export Excel
 */

const DashboardPage = (() => {

  // ── State ──────────────────────────────────────────────────
  let _allGuests   = [];   // master data (all or filtered by date range)
  let _dateFrom    = '';
  let _dateTo      = '';
  let _isFiltered  = false; // true = date range active

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
                <button class="admin-nav-item active" data-page="buku-tamu" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  Buku Tamu
                </button>
              </li>
            </ul>
          </nav>

          <div class="admin-sidebar-footer">
            <div class="admin-user-info">
              <img class="admin-user-avatar" src="${session.picture || ''}"
                   alt="${session.name}" referrerpolicy="no-referrer" />
              <div class="admin-user-detail">
                <span class="admin-user-name">${session.name}</span>
                <span class="admin-user-email">${session.email}</span>
              </div>
            </div>
            <button class="admin-logout-btn" id="btn-admin-logout" type="button"
                    title="Logout">
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
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 class="admin-topbar-title" id="admin-page-title">Buku Tamu</h1>
          </div>

          <!-- Page content injected here -->
          <div class="admin-content" id="admin-content"></div>
        </main>

      </div>`;
  }

  // ── Buku Tamu Page Content ─────────────────────────────────
  function _bukuTamuContent() {
    return `
      <div class="bt-toolbar">
        <!-- Search -->
        <div class="bt-search-wrap">
          <svg class="bt-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="bt-search-input" id="bt-search" type="text"
                 placeholder="Cari nama tamu…" aria-label="Cari nama tamu" />
        </div>

        <!-- Date range filter -->
        <div class="bt-filter-wrap">
          <label class="bt-filter-label" for="bt-date-from">Dari</label>
          <input class="bt-date-input" id="bt-date-from" type="date" aria-label="Tanggal dari" />
          <label class="bt-filter-label" for="bt-date-to">Sampai</label>
          <input class="bt-date-input" id="bt-date-to" type="date" aria-label="Tanggal sampai" />
          <button class="bt-btn bt-btn--primary" id="btn-apply-filter" type="button">Filter</button>
          <button class="bt-btn bt-btn--outline" id="btn-clear-filter" type="button">Clear Filter</button>
        </div>

        <!-- Export -->
        <button class="bt-btn bt-btn--success" id="btn-export" type="button">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Excel
        </button>
      </div>

      <!-- Filter badge -->
      <div class="bt-filter-badge hidden" id="bt-filter-badge">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <span id="bt-filter-badge-text"></span>
      </div>

      <!-- Table -->
      <div class="bt-table-wrap">
        <table class="bt-table" id="bt-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Nama Lengkap</th>
              <th>Asal Instansi</th>
              <th>Alamat</th>
              <th>Kontak WA</th>
              <th>Email</th>
              <th>Jenis Keperluan</th>
              <th>Deskripsi Keperluan</th>
              <th>Tanggal Kunjungan</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="bt-tbody">
            <tr>
              <td colspan="10" class="bt-loading">
                <div class="bt-spinner"></div> Memuat data…
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Record count -->
      <div class="bt-footer-info" id="bt-footer-info"></div>

      <!-- Delete confirm modal -->
      <div class="bt-modal-overlay hidden" id="bt-modal-overlay" role="dialog"
           aria-modal="true" aria-labelledby="bt-modal-title">
        <div class="bt-modal">
          <h2 class="bt-modal-title" id="bt-modal-title">Hapus Data Tamu</h2>
          <p class="bt-modal-body" id="bt-modal-body">Yakin ingin menghapus data tamu ini?</p>
          <div class="bt-modal-actions">
            <button class="bt-btn bt-btn--outline" id="btn-modal-cancel" type="button">Batal</button>
            <button class="bt-btn bt-btn--danger"  id="btn-modal-confirm" type="button">Hapus</button>
          </div>
        </div>
      </div>`;
  }

  // ── Render table rows ──────────────────────────────────────
  function _renderTable(rows) {
    const tbody = document.getElementById('bt-tbody');
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="10" class="bt-empty">Tidak ada data tamu.</td></tr>`;
      _updateFooter(0);
      return;
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
                  data-name="${_esc(g.guest_name)}" type="button"
                  title="Hapus">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </td>
      </tr>`).join('');

    _updateFooter(rows.length);
  }

  function _updateFooter(count) {
    const el = document.getElementById('bt-footer-info');
    if (el) el.textContent = `Menampilkan ${count} tamu`;
  }

  // ── Escape HTML ────────────────────────────────────────────
  function _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Get filtered + searched rows ──────────────────────────
  function _getDisplayRows() {
    const q = (document.getElementById('bt-search')?.value || '').toLowerCase().trim();
    if (!q) return _allGuests;
    return _allGuests.filter(g =>
      (g.guest_name || '').toLowerCase().includes(q)
    );
  }

  // ── Load data ──────────────────────────────────────────────
  async function _loadAll() {
    const { data, error } = await AdminService.getAllGuests();
    if (error) {
      _renderError(error);
      return;
    }
    _allGuests  = data;
    _isFiltered = false;
    _updateFilterBadge();
    _renderTable(_getDisplayRows());
  }

  async function _loadRange(from, to) {
    const tbody = document.getElementById('bt-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="bt-loading"><div class="bt-spinner"></div> Memuat data…</td></tr>`;

    const { data, error } = await AdminService.getGuestsByRange(from, to);
    if (error) {
      _renderError(error);
      return;
    }
    _allGuests  = data;
    _isFiltered = true;
    _dateFrom   = from;
    _dateTo     = to;
    _updateFilterBadge();
    _renderTable(_getDisplayRows());
  }

  function _renderError(msg) {
    const tbody = document.getElementById('bt-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="bt-error">Gagal memuat data: ${_esc(msg)}</td></tr>`;
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

  // ── Export to Excel ────────────────────────────────────────
  function _exportExcel() {
    const rows = _getDisplayRows();

    // Build CSV content
    const headers = [
      'No.','Nama Lengkap','Asal Instansi','Alamat','Kontak WA',
      'Email','Jenis Keperluan','Deskripsi Keperluan','Tanggal Kunjungan'
    ];

    const csvRows = [
      headers.join(','),
      ...rows.map((g, i) => [
        i + 1,
        _csvCell(g.guest_name),
        _csvCell(g.organization),
        _csvCell(g.address),
        _csvCell(g.wa_number),
        _csvCell(g.guest_email),
        _csvCell(AdminService.purposeLabel(g.id_purpose)),
        _csvCell(g.purpose_desc),
        AdminService.formatDate(g.visit_date),
      ].join(','))
    ].join('\r\n');

    // BOM for Excel UTF-8 compatibility
    const bom  = '\uFEFF';
    const blob = new Blob([bom + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');

    const filename = _isFiltered
      ? `daftar_tamu_${_dateFrom}_sd_${_dateTo}.csv`
      : `daftar_tamu_semua.csv`;

    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function _csvCell(val) {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  }

  // ── Delete modal ───────────────────────────────────────────
  let _pendingDeleteId = null;

  function _showDeleteModal(id, name) {
    _pendingDeleteId = id;
    const body    = document.getElementById('bt-modal-body');
    const overlay = document.getElementById('bt-modal-overlay');
    if (body) body.textContent = `Yakin ingin menghapus data tamu "${name}"? Tindakan ini tidak bisa dibatalkan.`;
    overlay?.classList.remove('hidden');
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
    if (!success) {
      alert(`Gagal menghapus: ${error}`);
      return;
    }

    // Remove from local array and re-render
    _allGuests = _allGuests.filter(g => g.id_guest !== id);
    _renderTable(_getDisplayRows());
  }

  // ── Event bindings ─────────────────────────────────────────
  function _bindEvents() {
    // Logout
    document.getElementById('btn-admin-logout')?.addEventListener('click', async () => {
      await AuthService.signOut();
      window.location.href = 'admin-index.html';
    });

    // Sidebar toggle (mobile)
    document.getElementById('btn-sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('admin-sidebar')?.classList.toggle('open');
    });

    // Search – live filter
    document.getElementById('bt-search')?.addEventListener('input', () => {
      _renderTable(_getDisplayRows());
    });

    // Filter apply
    document.getElementById('btn-apply-filter')?.addEventListener('click', () => {
      const from = document.getElementById('bt-date-from')?.value;
      const to   = document.getElementById('bt-date-to')?.value;
      if (!from || !to) { alert('Pilih tanggal dari dan sampai terlebih dahulu.'); return; }
      if (from > to)    { alert('Tanggal "Dari" tidak boleh lebih besar dari "Sampai".'); return; }
      _loadRange(from, to);
    });

    // Clear filter
    document.getElementById('btn-clear-filter')?.addEventListener('click', () => {
      document.getElementById('bt-date-from').value = '';
      document.getElementById('bt-date-to').value   = '';
      _loadAll();
    });

    // Export
    document.getElementById('btn-export')?.addEventListener('click', _exportExcel);

    // Delete button (delegated)
    document.getElementById('bt-tbody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.bt-btn-delete');
      if (!btn) return;
      _showDeleteModal(Number(btn.dataset.id), btn.dataset.name);
    });

    // Modal buttons
    document.getElementById('btn-modal-cancel')?.addEventListener('click',  _hideModal);
    document.getElementById('btn-modal-confirm')?.addEventListener('click', _confirmDelete);
    document.getElementById('bt-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) _hideModal();
    });
  }

  // ── Ensure styles ──────────────────────────────────────────
  function _ensureStyles() {
    if (!document.getElementById('css-dashboard')) {
      const link = document.createElement('link');
      link.id   = 'css-dashboard';
      link.rel  = 'stylesheet';
      link.href = 'src/styles/dashboard.css';
      document.head.appendChild(link);
    }
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    async render() {
      if (!AuthService.isLoggedIn()) {
        Router.navigate('/admin/login');
        return;
      }

      _ensureStyles();

      // Ambil profil user dari SDK session
      const profile = await AuthService.getUserProfile();
      const session = profile ?? { name: 'Admin', email: '', picture: '' };

      const app = document.getElementById('app');
      app.innerHTML = _template(session);

      document.getElementById('admin-content').innerHTML = _bukuTamuContent();

      _bindEvents();
      _loadAll();
    },
  };
})();
