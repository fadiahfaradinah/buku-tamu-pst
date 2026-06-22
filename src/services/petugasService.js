/**
 * petugasService.js
 * CRUD untuk tabel pst_petugas + upload foto ke Supabase Storage.
 *
 * Tabel pst_petugas:
 *   id_petugas   – PK serial
 *   nama         – text
 *   jenis_petugas– text  ('Pelayanan' | 'Pengaduan')
 *   jabatan      – text
 *   foto_url     – text  (public URL dari Storage, nullable)
 *   jadwal       – text  ('Senin' | 'Selasa' | … | 'Jumat' | 'Senin-Jumat')
 *
 * Storage bucket: petugas-foto  (public bucket)
 */

const PetugasService = (() => {

  const TABLE  = 'pst_petugas';
  const BUCKET = 'petugas-foto';

  function _sb() {
    if (!window._supabase) throw new Error('Supabase client belum siap.');
    return window._supabase;
  }

  // ── READ ──────────────────────────────────────────────────

  /**
   * Ambil semua petugas, diurutkan nama ascending.
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function getAll() {
    const { data, error } = await _sb()
      .from(TABLE)
      .select('*')
      .order('nama', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  }

  // ── UPLOAD FOTO ───────────────────────────────────────────

  /**
   * Upload File foto ke Storage, return public URL.
   * Jika file null/undefined, return null.
   *
   * @param {File|null} file
   * @param {string|null} oldUrl  – URL lama yang akan dihapus jika ada
   * @returns {Promise<{ url: string|null, error: string|null }>}
   */
  async function uploadFoto(file, oldUrl = null) {
    if (!file) return { url: null, error: null };

    // Hapus foto lama kalau ada
    if (oldUrl) {
      const oldPath = _pathFromUrl(oldUrl);
      if (oldPath) {
        await _sb().storage.from(BUCKET).remove([oldPath]).catch(() => {});
      }
    }

    const ext      = file.name.split('.').pop().toLowerCase();
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await _sb()
      .storage
      .from(BUCKET)
      .upload(filename, file, { upsert: false });

    if (upErr) return { url: null, error: upErr.message };

    const { data } = _sb().storage.from(BUCKET).getPublicUrl(filename);
    return { url: data.publicUrl, error: null };
  }

  /**
   * Ekstrak path relatif dari public URL storage.
   * @param {string} url
   * @returns {string|null}
   */
  function _pathFromUrl(url) {
    try {
      const u    = new URL(url);
      const idx  = u.pathname.indexOf(`/${BUCKET}/`);
      if (idx === -1) return null;
      return u.pathname.slice(idx + BUCKET.length + 2);
    } catch {
      return null;
    }
  }

  // ── CREATE ────────────────────────────────────────────────

  /**
   * Tambah petugas baru.
   * @param {{ nama, jenis_petugas, jabatan, jadwal }} fields
   * @param {File|null} fotoFile
   * @returns {Promise<{ data: Object|null, error: string|null }>}
   */
  async function create(fields, fotoFile = null) {
    const { url: foto_url, error: upErr } = await uploadFoto(fotoFile);
    if (upErr) return { data: null, error: `Gagal upload foto: ${upErr}` };

    const payload = {
      nama:          fields.nama.trim(),
      jenis_petugas: fields.jenis_petugas,
      jabatan:       fields.jabatan.trim(),
      jadwal:        fields.jadwal,
      foto_url:      foto_url ?? null,
    };

    const { data, error } = await _sb()
      .from(TABLE)
      .insert(payload)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  // ── UPDATE ────────────────────────────────────────────────

  /**
   * Update data petugas. Jika fotoFile diberikan, upload foto baru.
   * @param {number} id
   * @param {{ nama, jenis_petugas, jabatan, jadwal }} fields
   * @param {File|null} fotoFile     – null = foto tidak diganti
   * @param {string|null} currentFotoUrl – URL foto saat ini (untuk hapus lama)
   * @returns {Promise<{ data: Object|null, error: string|null }>}
   */
  async function update(id, fields, fotoFile = null, currentFotoUrl = null) {
    let foto_url = undefined; // undefined = tidak mengubah kolom

    if (fotoFile) {
      const { url, error: upErr } = await uploadFoto(fotoFile, currentFotoUrl);
      if (upErr) return { data: null, error: `Gagal upload foto: ${upErr}` };
      foto_url = url;
    }

    const payload = {
      nama:          fields.nama.trim(),
      jenis_petugas: fields.jenis_petugas,
      jabatan:       fields.jabatan.trim(),
      jadwal:        fields.jadwal,
    };
    if (foto_url !== undefined) payload.foto_url = foto_url;

    const { data, error } = await _sb()
      .from(TABLE)
      .update(payload)
      .eq('id_petugas', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  // ── DELETE ────────────────────────────────────────────────

  /**
   * Hapus petugas + foto di storage.
   * @param {number} id
   * @param {string|null} fotoUrl
   * @returns {Promise<{ success: boolean, error: string|null }>}
   */
  async function remove(id, fotoUrl = null) {
    // Hapus foto dari storage dulu
    if (fotoUrl) {
      const path = _pathFromUrl(fotoUrl);
      if (path) await _sb().storage.from(BUCKET).remove([path]).catch(() => {});
    }

    const { error } = await _sb()
      .from(TABLE)
      .delete()
      .eq('id_petugas', id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }

  return { getAll, create, update, remove, uploadFoto };
})();
