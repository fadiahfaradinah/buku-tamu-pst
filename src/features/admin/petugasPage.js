/**
 * petugasPage.js
 * Feature: Admin – Kelola Petugas
 *
 * Layout:
 *   - Form Tambah / Edit Petugas (collapsed jika sedang edit)
 *   - Tabel Daftar Petugas
 */

const PetugasPage = (() => {

  // ── Konstanta ──────────────────────────────────────────────
  const JENIS_OPTIONS  = ['Pelayanan', 'Pengaduan'];
  const JADWAL_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  // ── State ──────────────────────────────────────────────────
  let _petugas    = [];        // master list
  let _editId     = null;      // null = mode tambah, number = mode edit
  let _editFotoUrl = null;     // URL foto saat ini saat edit

  // ── Escape HTML ────────────────────────────────────────────
  function _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Select options helpers ─────────────────────────────────
  function _jenisOpts(selected = '') {
    return JENIS_OPTIONS.map(v =>
      `<option value="${v}" ${selected === v ? 'selected' : ''}>${v}</option>`
    ).join('');
  }

  function _jadwalOpts(selected = '') {
    return JADWAL_OPTIONS.map(v =>
      `<option value="${v}" ${selected === v ? 'selected' : ''}>${v}</option>`
    ).join('');
  }

  // ── Template ───────────────────────────────────────────────
  function _template() {
    return `
      <!-- ░░ FORM CARD ░░ -->
      <div class="pt-form-card" id="pt-form-card">
        <div class="pt-form-header">
          <h3 class="pt-form-title" id="pt-form-title">Tambah Petugas</h3>
          <button class="pt-form-collapse-btn hidden" id="btn-pt-cancel" type="button"
                  title="Batal edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
            Batal
          </button>
        </div>

        <form id="pt-form" novalidate>
          <div class="pt-form-grid">

            <!-- Nama Lengkap -->
            <div class="pt-form-group pt-form-group--full">
              <label class="pt-label" for="pt-nama">
                Nama Lengkap <span class="required">*</span>
              </label>
              <input class="pt-input" type="text" id="pt-nama" name="nama"
                     placeholder="Masukkan nama lengkap" autocomplete="off" />
              <span class="pt-error hidden" id="err-pt-nama">⚠ Nama wajib diisi.</span>
            </div>

            <!-- Jenis Petugas -->
            <div class="pt-form-group">
              <label class="pt-label" for="pt-jenis">
                Jenis Petugas <span class="required">*</span>
              </label>
              <select class="pt-input" id="pt-jenis" name="jenis_petugas">
                <option value="">-- Pilih jenis --</option>
                ${_jenisOpts()}
              </select>
              <span class="pt-error hidden" id="err-pt-jenis">⚠ Jenis wajib dipilih.</span>
            </div>

            <!-- Jabatan -->
            <div class="pt-form-group">
              <label class="pt-label" for="pt-jabatan">
                Jabatan <span class="required">*</span>
              </label>
              <input class="pt-input" type="text" id="pt-jabatan" name="jabatan"
                     placeholder="Masukkan jabatan" autocomplete="off" />
              <span class="pt-error hidden" id="err-pt-jabatan">⚠ Jabatan wajib diisi.</span>
            </div>

            <!-- Jadwal -->
            <div class="pt-form-group">
              <label class="pt-label" for="pt-jadwal">
                Jadwal Bertugas <span class="required">*</span>
              </label>
              <select class="pt-input" id="pt-jadwal" name="jadwal">
                <option value="">-- Pilih jadwal --</option>
                ${_jadwalOpts()}
              </select>
              <span class="pt-error hidden" id="err-pt-jadwal">⚠ Jadwal wajib dipilih.</span>
            </div>

            <!-- Foto -->
            <div class="pt-form-group pt-form-group--full">
              <label class="pt-label" for="pt-foto">
                Foto <span class="pt-label-hint">(JPG/PNG, maks. 2 MB)</span>
              </label>
              <div class="pt-foto-wrap">
                <div class="pt-foto-preview" id="pt-foto-preview">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8"
                       stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div class="pt-foto-actions">
                  <label class="bt-btn bt-btn--outline pt-foto-btn" for="pt-foto">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Pilih Foto
                  </label>
                  <input type="file" id="pt-foto" name="foto" accept="image/*"
                         class="pt-foto-input" aria-label="Upload foto" />
                  <span class="pt-foto-filename" id="pt-foto-filename">Belum ada foto dipilih</span>
                </div>
              </div>
              <span class="pt-error hidden" id="err-pt-foto">⚠ Ukuran foto melebihi 2 MB.</span>
            </div>

          </div><!-- end grid -->

          <div class="pt-form-footer">
            <button type="submit" class="bt-btn bt-btn--primary" id="btn-pt-submit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span id="btn-pt-submit-label">Tambah Petugas</span>
            </button>
          </div>
        </form>
      </div>

      <!-- ░░ TABLE ░░ -->
      <div class="bt-table-wrap" style="margin-top:24px;">
        <table class="bt-table" id="pt-table">
          <thead>
            <tr>
              <th style="width:64px">Foto</th>
              <th>Nama</th>
              <th>Jenis</th>
              <th>Jabatan</th>
              <th>Jadwal</th>
              <th style="width:120px">Action</th>
            </tr>
          </thead>
          <tbody id="pt-tbody">
            <tr><td colspan="6" class="bt-loading">
              <div class="bt-spinner"></div> Memuat data…
            </td></tr>
          </tbody>
        </table>
      </div>

      <!-- Delete confirm modal -->
      <div class="bt-modal-overlay hidden" id="pt-modal-overlay" role="dialog"
           aria-modal="true" aria-labelledby="pt-modal-title">
        <div class="bt-modal">
          <h2 class="bt-modal-title" id="pt-modal-title">Hapus Petugas</h2>
          <p class="bt-modal-body"  id="pt-modal-body"></p>
          <div class="bt-modal-actions">
            <button class="bt-btn bt-btn--outline" id="btn-pt-modal-cancel"  type="button">Batal</button>
            <button class="bt-btn bt-btn--danger"  id="btn-pt-modal-confirm" type="button">Hapus</button>
          </div>
        </div>
      </div>`;
  }

  // ── Render table ───────────────────────────────────────────
  function _renderTable() {
    const tbody = document.getElementById('pt-tbody');
    if (!tbody) return;

    if (!_petugas.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="bt-empty">Belum ada data petugas.</td></tr>`;
      return;
    }

    tbody.innerHTML = _petugas.map(p => `
      <tr>
        <td>
          ${p.foto_url
            ? `<img class="pt-table-foto" src="${_esc(p.foto_url)}"
                    alt="${_esc(p.nama)}" loading="lazy" />`
            : `<div class="pt-table-foto pt-foto-placeholder">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                   <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                   <circle cx="12" cy="7" r="4"/>
                 </svg>
               </div>`
          }
        </td>
        <td><strong>${_esc(p.nama)}</strong></td>
        <td>
          <span class="pt-badge pt-badge--${p.jenis_petugas === 'Pelayanan' ? 'pelayanan' : 'pengaduan'}">
            ${_esc(p.jenis_petugas)}
          </span>
        </td>
        <td>${_esc(p.jabatan)}</td>
        <td>${_esc(p.jadwal)}</td>
        <td>
          <div class="pt-action-wrap">
            <button class="bt-btn bt-btn--outline pt-btn-edit"
                    data-id="${p.id_petugas}" type="button" title="Edit">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button class="bt-btn-delete pt-btn-delete"
                    data-id="${p.id_petugas}" data-nama="${_esc(p.nama)}"
                    data-foto="${_esc(p.foto_url || '')}"
                    type="button" title="Hapus">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>`).join('');
  }

  // ── Form reset / populate ──────────────────────────────────
  function _resetForm() {
    _editId      = null;
    _editFotoUrl = null;

    document.getElementById('pt-form')?.reset();
    document.getElementById('pt-form-title').textContent         = 'Tambah Petugas';
    document.getElementById('btn-pt-submit-label').textContent   = 'Tambah Petugas';
    document.getElementById('btn-pt-cancel')?.classList.add('hidden');
    document.getElementById('pt-foto-filename').textContent      = 'Belum ada foto dipilih';
    _clearFotoPreview();

    // Reset jenis & jadwal select ke placeholder
    document.getElementById('pt-jenis').value  = '';
    document.getElementById('pt-jadwal').value = '';

    // Hilangkan semua error
    document.querySelectorAll('.pt-error').forEach(e => e.classList.add('hidden'));
    document.querySelectorAll('.pt-input.error').forEach(e => e.classList.remove('error'));
  }

  function _populateForm(p) {
    _editId      = p.id_petugas;
    _editFotoUrl = p.foto_url ?? null;

    document.getElementById('pt-nama').value    = p.nama;
    document.getElementById('pt-jenis').value   = p.jenis_petugas;
    document.getElementById('pt-jabatan').value = p.jabatan;
    document.getElementById('pt-jadwal').value  = p.jadwal;

    document.getElementById('pt-form-title').textContent       = 'Edit Petugas';
    document.getElementById('btn-pt-submit-label').textContent = 'Simpan Perubahan';
    document.getElementById('btn-pt-cancel')?.classList.remove('hidden');
    document.getElementById('pt-foto-filename').textContent    = p.foto_url
      ? 'Foto tersimpan (pilih baru untuk mengganti)'
      : 'Belum ada foto';

    // Tampilkan foto lama di preview
    if (p.foto_url) {
      const prev = document.getElementById('pt-foto-preview');
      prev.innerHTML = `<img src="${_esc(p.foto_url)}" alt="preview" class="pt-preview-img" />`;
    } else {
      _clearFotoPreview();
    }

    // Scroll ke form
    document.getElementById('pt-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function _clearFotoPreview() {
    const prev = document.getElementById('pt-foto-preview');
    if (!prev) return;
    prev.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8"
           stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>`;
  }

  // ── Validation ─────────────────────────────────────────────
  function _validate() {
    let ok = true;
    const setErr = (inputId, errId, show) => {
      document.getElementById(inputId)?.classList.toggle('error', show);
      document.getElementById(errId)?.classList.toggle('hidden', !show);
      if (show) ok = false;
    };

    setErr('pt-nama',    'err-pt-nama',    !document.getElementById('pt-nama')?.value.trim());
    setErr('pt-jenis',   'err-pt-jenis',   !document.getElementById('pt-jenis')?.value);
    setErr('pt-jabatan', 'err-pt-jabatan', !document.getElementById('pt-jabatan')?.value.trim());
    setErr('pt-jadwal',  'err-pt-jadwal',  !document.getElementById('pt-jadwal')?.value);

    // Cek ukuran foto jika ada file baru
    const fotoInput = document.getElementById('pt-foto');
    const file      = fotoInput?.files?.[0];
    const tooBig    = file && file.size > 2 * 1024 * 1024;
    setErr('pt-foto', 'err-pt-foto', tooBig);

    return ok;
  }

  // ── Submit ─────────────────────────────────────────────────
  async function _handleSubmit(e) {
    e.preventDefault();
    if (!_validate()) return;

    const btn        = document.getElementById('btn-pt-submit');
    const fotoInput  = document.getElementById('pt-foto');
    const fotoFile   = fotoInput?.files?.[0] ?? null;

    const fields = {
      nama:          document.getElementById('pt-nama').value,
      jenis_petugas: document.getElementById('pt-jenis').value,
      jabatan:       document.getElementById('pt-jabatan').value,
      jadwal:        document.getElementById('pt-jadwal').value,
    };

    // Loading state
    btn.disabled = true;
    btn.innerHTML = `<div class="bt-spinner" style="width:14px;height:14px;border-width:2px;"></div> Menyimpan…`;

    let result;
    if (_editId) {
      result = await PetugasService.update(_editId, fields, fotoFile, _editFotoUrl);
    } else {
      result = await PetugasService.create(fields, fotoFile);
    }

    btn.disabled = false;
    document.getElementById('btn-pt-submit-label').textContent =
      _editId ? 'Simpan Perubahan' : 'Tambah Petugas';
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span id="btn-pt-submit-label">${_editId ? 'Simpan Perubahan' : 'Tambah Petugas'}</span>`;

    if (result.error) {
      alert(`Gagal menyimpan: ${result.error}`);
      return;
    }

    // Update local array
    if (_editId) {
      _petugas = _petugas.map(p => p.id_petugas === _editId ? result.data : p);
    } else {
      _petugas.push(result.data);
      _petugas.sort((a, b) => a.nama.localeCompare(b.nama));
    }

    _resetForm();
    _renderTable();
  }

  // ── Delete modal ───────────────────────────────────────────
  let _pendingDelete = null; // { id, fotoUrl }

  function _showDeleteModal(id, nama, fotoUrl) {
    _pendingDelete = { id, fotoUrl };
    const body = document.getElementById('pt-modal-body');
    if (body) body.textContent =
      `Yakin ingin menghapus petugas "${nama}"? Tindakan ini tidak bisa dibatalkan.`;
    document.getElementById('pt-modal-overlay')?.classList.remove('hidden');
  }

  function _hideDeleteModal() {
    document.getElementById('pt-modal-overlay')?.classList.add('hidden');
    _pendingDelete = null;
  }

  async function _confirmDelete() {
    if (!_pendingDelete) return;
    const { id, fotoUrl } = _pendingDelete;
    _hideDeleteModal();

    const { success, error } = await PetugasService.remove(id, fotoUrl);
    if (!success) { alert(`Gagal menghapus: ${error}`); return; }

    _petugas = _petugas.filter(p => p.id_petugas !== id);
    if (_editId === id) _resetForm();
    _renderTable();
  }

  // ── Event bindings ─────────────────────────────────────────
  function _bindEvents() {
    // Submit form
    document.getElementById('pt-form')
      ?.addEventListener('submit', _handleSubmit);

    // Batal edit
    document.getElementById('btn-pt-cancel')
      ?.addEventListener('click', _resetForm);

    // Preview foto saat file dipilih
    document.getElementById('pt-foto')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      document.getElementById('pt-foto-filename').textContent = file.name;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const prev = document.getElementById('pt-foto-preview');
        prev.innerHTML = `<img src="${ev.target.result}" alt="preview" class="pt-preview-img" />`;
      };
      reader.readAsDataURL(file);
    });

    // Tabel — delegasi event
    document.getElementById('pt-tbody')?.addEventListener('click', (e) => {
      // Edit
      const editBtn = e.target.closest('.pt-btn-edit');
      if (editBtn) {
        const id = Number(editBtn.dataset.id);
        const p  = _petugas.find(x => x.id_petugas === id);
        if (p) _populateForm(p);
        return;
      }

      // Hapus
      const delBtn = e.target.closest('.pt-btn-delete');
      if (delBtn) {
        _showDeleteModal(
          Number(delBtn.dataset.id),
          delBtn.dataset.nama,
          delBtn.dataset.foto || null
        );
      }
    });

    // Modal
    document.getElementById('btn-pt-modal-cancel')
      ?.addEventListener('click', _hideDeleteModal);
    document.getElementById('btn-pt-modal-confirm')
      ?.addEventListener('click', _confirmDelete);
    document.getElementById('pt-modal-overlay')
      ?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) _hideDeleteModal();
      });
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    async render(contentEl) {
      // Reset state saat navigasi ulang
      _editId      = null;
      _editFotoUrl = null;
      _petugas     = [];

      contentEl.innerHTML = _template();
      _bindEvents();

      // Load data
      const { data, error } = await PetugasService.getAll();
      if (error) {
        document.getElementById('pt-tbody').innerHTML =
          `<tr><td colspan="6" class="bt-error">Gagal memuat: ${_esc(error)}</td></tr>`;
        return;
      }
      _petugas = data;
      _renderTable();
    },
  };
})();
