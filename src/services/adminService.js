/**
 * adminService.js
 * Business logic for admin panel operations.
 * Handles fetching, filtering, and deleting guest records.
 */

const AdminService = (() => {
  const GUEST_TABLE = 'pst_guest';

  // Map id_purpose → label
  const PURPOSE_LABELS = {
    1: 'Tugas sekolah/tugas kuliah',
    2: 'Pemerintahan',
    3: 'Komersial',
    4: 'Penelitian',
    5: 'Lainnya',
  };

  /**
   * Fetch all guests, ordered by visit_date descending.
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function getAllGuests() {
    try {
      const qs = new URLSearchParams({
        select: '*',
        order:  'visit_date.desc,id_guest.desc',
      }).toString();

      const URL    = 'https://fufjaptmggulmzjrefvg.supabase.co/rest/v1';
      const APIKEY = 'sb_publishable_KpToL4zDIleZviiLL6hnvA_RXs3la0l';

      const res = await fetch(`${URL}/${GUEST_TABLE}?${qs}`, {
        headers: {
          'Content-Type':  'application/json',
          'apikey':        APIKEY,
          'Authorization': `Bearer ${APIKEY}`,
        },
      });

      const json = await res.json();
      if (!res.ok) return { data: [], error: json?.message || `HTTP ${res.status}` };
      return { data: json, error: null };

    } catch (err) {
      return { data: [], error: err.message || 'Network error.' };
    }
  }

  /**
   * Fetch guests filtered by date range.
   * @param {string} dateFrom  – YYYY-MM-DD
   * @param {string} dateTo    – YYYY-MM-DD
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function getGuestsByRange(dateFrom, dateTo) {
    try {
      const qs = new URLSearchParams({
        select:     '*',
        visit_date: `gte.${dateFrom}`,
        order:      'visit_date.desc,id_guest.desc',
      }).toString() + `&visit_date=lte.${dateTo}`;

      const URL    = 'https://fufjaptmggulmzjrefvg.supabase.co/rest/v1';
      const APIKEY = 'sb_publishable_KpToL4zDIleZviiLL6hnvA_RXs3la0l';

      const res = await fetch(`${URL}/${GUEST_TABLE}?${qs}`, {
        headers: {
          'Content-Type':  'application/json',
          'apikey':        APIKEY,
          'Authorization': `Bearer ${APIKEY}`,
        },
      });

      const json = await res.json();
      if (!res.ok) return { data: [], error: json?.message || `HTTP ${res.status}` };
      return { data: json, error: null };

    } catch (err) {
      return { data: [], error: err.message || 'Network error.' };
    }
  }

  /**
   * Delete a guest record by id_guest.
   * @param {number|string} id
   * @returns {Promise<{ success: boolean, error: string|null }>}
   */
  async function deleteGuest(id) {
    try {
      const URL    = 'https://fufjaptmggulmzjrefvg.supabase.co/rest/v1';
      const APIKEY = 'sb_publishable_KpToL4zDIleZviiLL6hnvA_RXs3la0l';

      const res = await fetch(`${URL}/${GUEST_TABLE}?id_guest=eq.${id}`, {
        method:  'DELETE',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        APIKEY,
          'Authorization': `Bearer ${APIKEY}`,
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { success: false, error: json?.message || `HTTP ${res.status}` };
      }

      return { success: true, error: null };

    } catch (err) {
      return { success: false, error: err.message || 'Network error.' };
    }
  }

  /**
   * Get human-readable label for id_purpose.
   * @param {number} id
   * @returns {string}
   */
  function purposeLabel(id) {
    return PURPOSE_LABELS[id] || '-';
  }

  /**
   * Format a date string (YYYY-MM-DD) to DD/MM/YYYY.
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
