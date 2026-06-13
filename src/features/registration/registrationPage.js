/**
 * registrationPage.js
 * Feature: Registration
 * Halaman registrasi buku tamu PST.
 */

const RegistrationPage = (() => {
  const JENIS_KEPERLUAN = [
    'Tugas sekolah/tugas kuliah',
    'Pemerintahan',
    'Komersial',
    'Penelitian',
    'Lainnya',
  ];

  /** Returns today's date as YYYY-MM-DD for the date input default value */
  function _todayISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function _optionsHTML() {
    return JENIS_KEPERLUAN.map(
      (l) => `<option value="${l}">${l}</option>`
    ).join('');
  }

  function _template() {
    return `
      <div class="reg-page page">

        <!-- Header -->
        <header class="reg-header">
          <button class="reg-back-btn" id="btn-back" aria-label="Kembali">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="reg-header-text">
            <h2 class="reg-header-title">Registrasi Tamu</h2>
            <p class="reg-header-sub">PST BPS Kota Parepare</p>
          </div>
        </header>

        <!-- Form card -->
        <main class="reg-main">
          <div class="card reg-card">
            <form id="reg-form" novalidate>

              <!-- Tanggal Kunjungan -->
              <div class="form-group">
                <label class="form-label" for="tanggal">Tanggal Kunjungan</label>
                <input class="form-control" type="date" id="tanggal" name="tanggal"
                       value="${_todayISO()}" />
              </div>

              <!-- Nama Lengkap -->
              <div class="form-group">
                <label class="form-label" for="nama">
                  Nama Lengkap <span class="required">*</span>
                </label>
                <input class="form-control" type="text" id="nama" name="nama"
                       placeholder="Masukkan nama lengkap Anda" autocomplete="name" />
                <span class="form-error hidden" id="err-nama">⚠ Nama wajib diisi.</span>
              </div>

              <!-- Asal Instansi -->
              <div class="form-group">
                <label class="form-label" for="instansi">
                  Asal Instansi <span class="required">*</span>
                </label>
                <input class="form-control" type="text" id="instansi" name="instansi"
                       placeholder="Nama instansi atau perorangan" />
                <span class="form-error hidden" id="err-instansi">⚠ Instansi wajib diisi.</span>
              </div>

              <!-- Alamat -->
              <div class="form-group">
                <label class="form-label" for="alamat">Alamat</label>
                <input class="form-control" type="text" id="alamat" name="alamat"
                       placeholder="Jalan, kelurahan, kota…" autocomplete="street-address" />
              </div>

              <!-- Kontak WhatsApp -->
              <div class="form-group">
                <label class="form-label" for="noWa">
                  Kontak WhatsApp <span class="required">*</span>
                </label>
                <input class="form-control" type="tel" id="noWa" name="noWa"
                       placeholder="Contoh: 08123456789" autocomplete="tel" />
                <span class="form-error hidden" id="err-noWa">⚠ Kontak WhatsApp wajib diisi.</span>
              </div>

              <!-- Email -->
              <div class="form-group">
                <label class="form-label" for="email">Email</label>
                <input class="form-control" type="email" id="email" name="email"
                       placeholder="contoh@email.com" autocomplete="email" />
                <span class="form-error hidden" id="err-email">⚠ Format email tidak valid.</span>
              </div>

              <!-- Jenis Keperluan -->
              <div class="form-group">
                <label class="form-label" for="jenisKeperluan">
                  Jenis Keperluan <span class="required">*</span>
                </label>
                <select class="form-control" id="jenisKeperluan" name="jenisKeperluan">
                  <option value="">-- Pilih jenis keperluan --</option>
                  ${_optionsHTML()}
                </select>
                <span class="form-error hidden" id="err-jenisKeperluan">⚠ Jenis keperluan wajib dipilih.</span>
              </div>

              <!-- Deskripsi Keperluan -->
              <div class="form-group">
                <label class="form-label" for="deskripsi">
                  Deskripsi Keperluan <span class="required">*</span>
                </label>
                <input class="form-control" type="text" id="deskripsi" name="deskripsi"
                       placeholder="Jelaskan jenis pelayanan atau data apa yang Anda butuhkan" />
                <span class="form-error hidden" id="err-deskripsi">⚠ Deskripsi keperluan wajib diisi.</span>
              </div>

              <button type="submit" class="btn btn-primary btn-lg reg-submit-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Registrasi
              </button>
            </form>
          </div>
        </main>

      </div>

      <!-- Success modal -->
      <div class="modal-overlay hidden" id="modal-success" role="dialog" aria-modal="true">
        <div class="modal-box">
          <div class="modal-icon modal-icon-success">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3 class="modal-title">Registrasi Berhasil!</h3>
          <p class="modal-desc" id="modal-id-text"></p>
          <p class="modal-desc">Silakan menunggu, petugas kami akan segera melayani Anda.</p>
          <button class="btn btn-primary btn-lg modal-close-btn" id="modal-ok">
            Kembali ke Beranda
          </button>
        </div>
      </div>`;
  }

  function _validate(fields) {
    let valid = true;
    const setErr = (id, errId, show) => {
      document.getElementById(id)?.classList.toggle('error', show);
      document.getElementById(errId)?.classList.toggle('hidden', !show);
      if (show) valid = false;
    };

    setErr('nama',           'err-nama',           !fields.nama.trim());
    setErr('instansi',       'err-instansi',       !fields.instansi.trim());
    setErr('noWa',           'err-noWa',           !fields.noWa.trim());
    setErr('jenisKeperluan', 'err-jenisKeperluan', !fields.jenisKeperluan);
    setErr('deskripsi',      'err-deskripsi',      !fields.deskripsi.trim());

    // Email format check (only when not empty)
    const emailEl = document.getElementById('email');
    const emailVal = emailEl?.value.trim() || '';
    const emailInvalid = emailVal !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    setErr('email', 'err-email', emailInvalid);

    return valid;
  }

  function _bindEvents() {
    document.getElementById('btn-back')?.addEventListener('click', () => {
      Router.navigate('/');
    });

    document.getElementById('reg-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        tanggal:        form.tanggal.value,
        nama:           form.nama.value,
        instansi:       form.instansi.value,
        alamat:         form.alamat.value,
        noWa:           form.noWa.value,
        email:          form.email.value,
        jenisKeperluan: form.jenisKeperluan.value,
        deskripsi:      form.deskripsi.value,
      };

      if (!_validate(data)) return;

      // ── Loading state ──────────────────────────────────────
      const submitBtn = form.querySelector('.reg-submit-btn');
      _setLoading(submitBtn, true);

      const result = await GuestService.register(data);

      _setLoading(submitBtn, false);

      if (result.success) {
        document.getElementById('modal-id-text').textContent =
          `No. Registrasi: ${result.id}`;
        document.getElementById('modal-success')?.classList.remove('hidden');
      } else {
        _showSubmitError(result.message);
      }
    });

    document.getElementById('modal-ok')?.addEventListener('click', () => {
      Router.navigate('/');
    });
  }

  /** Toggle submit button into loading/normal state */
  function _setLoading(btn, isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.innerHTML = isLoading
      ? `<svg class="reg-spinner" viewBox="0 0 24 24" fill="none" width="18" height="18">
           <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10" stroke-linecap="round"/>
         </svg>
         Menyimpan…`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
           <polyline points="20 6 9 17 4 12"/>
         </svg>
         Registrasi`;
  }

  /** Show inline error below the submit button */
  function _showSubmitError(msg) {
    let errEl = document.getElementById('submit-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id        = 'submit-error';
      errEl.className = 'form-error reg-submit-error';
      const btn = document.querySelector('.reg-submit-btn');
      btn?.parentNode?.insertBefore(errEl, btn.nextSibling);
    }
    errEl.innerHTML = `⚠ ${msg}`;
    errEl.classList.remove('hidden');
  }

  return {
    render() {
      const app = document.getElementById('app');
      app.innerHTML = _template();
      _bindEvents();

      // Load registration-specific styles lazily
      if (!document.getElementById('css-reg')) {
        const link = document.createElement('link');
        link.id   = 'css-reg';
        link.rel  = 'stylesheet';
        link.href = 'src/styles/registration.css';
        document.head.appendChild(link);
      }
    },
  };
})();
