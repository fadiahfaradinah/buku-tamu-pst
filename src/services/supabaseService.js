/**
 * supabaseService.js
 * Low-level wrapper around Supabase REST & Auth API.
 * No external SDK needed — uses native fetch().
 */

const SupabaseService = (() => {
  const SUPABASE_URL = 'https://fufjaptmggulmzjrefvg.supabase.co';
  const ANON_KEY     = 'sb_publishable_KpToL4zDIleZviiLL6hnvA_RXs3la0l';

  const REST_URL  = `${SUPABASE_URL}/rest/v1`;
  const AUTH_URL  = `${SUPABASE_URL}/auth/v1`;

  // ── Header builders ────────────────────────────────────────

  /** Headers for anonymous / public REST requests. */
  const _anonHeaders = (extra = {}) => ({
    'Content-Type':  'application/json',
    'apikey':        ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    ...extra,
  });

  /**
   * Headers for authenticated REST requests using a Supabase user access_token.
   * This respects Row-Level Security (RLS) policies.
   * @param {string} accessToken – JWT returned by Supabase Auth
   */
  const _authHeaders = (accessToken, extra = {}) => ({
    'Content-Type':  'application/json',
    'apikey':        ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
    ...extra,
  });

  // ── Auth API ───────────────────────────────────────────────

  /**
   * Sign in with a Google id_token via Supabase Auth (PKCE not needed for id_token flow).
   * Supabase verifies the token with Google and returns a Supabase session.
   *
   * @param {string} idToken     – Google credential (id_token) from GIS callback
   * @param {string} nonce       – optional nonce used when generating the token
   * @returns {Promise<{
   *   session: { access_token, refresh_token, user } | null,
   *   error:   string | null
   * }>}
   */
  async function signInWithGoogle(idToken, nonce = '') {
    try {
      const body = {
        provider:    'google',
        id_token:    idToken,
      };
      if (nonce) body.nonce = nonce;

      const res = await fetch(`${AUTH_URL}/token?grant_type=id_token`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey':       ANON_KEY,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json?.error_description || json?.msg || json?.error || `HTTP ${res.status}`;
        return { session: null, error: msg };
      }

      // json contains: access_token, refresh_token, token_type, expires_in, user
      return {
        session: {
          access_token:  json.access_token,
          refresh_token: json.refresh_token,
          expires_in:    json.expires_in,
          user:          json.user,
        },
        error: null,
      };

    } catch (err) {
      return { session: null, error: err.message || 'Network error.' };
    }
  }

  /**
   * Sign out the current Supabase session (invalidates the refresh token).
   * @param {string} accessToken
   */
  async function signOut(accessToken) {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method:  'POST',
        headers: _authHeaders(accessToken),
      });
    } catch (err) {
      console.warn('[SupabaseService] signOut error:', err.message);
    }
  }

  // ── REST API ───────────────────────────────────────────────

  /**
   * INSERT one row into a table (uses anon key — for public-facing forms).
   * @param {string} table
   * @param {Object} payload
   * @returns {Promise<{ data: Object|null, error: string|null }>}
   */
  async function insert(table, payload) {
    try {
      const res = await fetch(`${REST_URL}/${table}`, {
        method:  'POST',
        headers: _anonHeaders({ 'Prefer': 'return=representation' }),
        body:    JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json?.message || json?.error || `HTTP ${res.status}`;
        return { data: null, error: msg };
      }

      const row = Array.isArray(json) ? json[0] : json;
      return { data: row, error: null };

    } catch (err) {
      return { data: null, error: err.message || 'Network error.' };
    }
  }

  /**
   * SELECT rows from a table (uses anon key).
   * @param {string} table
   * @param {Object} params – query params e.g. { email: 'eq.x@y.com' }
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function select(table, params = {}) {
    try {
      const qs = new URLSearchParams({ select: '*', ...params }).toString();
      const res = await fetch(`${REST_URL}/${table}?${qs}`, {
        method:  'GET',
        headers: _anonHeaders(),
      });

      const json = await res.json();

      if (!res.ok) {
        return { data: [], error: json?.message || `HTTP ${res.status}` };
      }

      return { data: json, error: null };

    } catch (err) {
      return { data: [], error: err.message || 'Network error.' };
    }
  }

  /**
   * SELECT rows using an authenticated access_token (respects RLS).
   * @param {string} accessToken – Supabase JWT from Auth session
   * @param {string} table
   * @param {Object} params
   * @returns {Promise<{ data: Array, error: string|null }>}
   */
  async function selectAuth(accessToken, table, params = {}) {
    try {
      const qs = new URLSearchParams({ select: '*', ...params }).toString();
      const res = await fetch(`${REST_URL}/${table}?${qs}`, {
        method:  'GET',
        headers: _authHeaders(accessToken),
      });

      const json = await res.json();

      if (!res.ok) {
        return { data: [], error: json?.message || `HTTP ${res.status}` };
      }

      return { data: json, error: null };

    } catch (err) {
      return { data: [], error: err.message || 'Network error.' };
    }
  }

  /**
   * DELETE rows matching a filter using an authenticated access_token.
   * @param {string} accessToken
   * @param {string} table
   * @param {string} filter – PostgREST filter, e.g. 'id_guest=eq.5'
   * @returns {Promise<{ success: boolean, error: string|null }>}
   */
  async function deleteAuth(accessToken, table, filter) {
    try {
      const res = await fetch(`${REST_URL}/${table}?${filter}`, {
        method:  'DELETE',
        headers: _authHeaders(accessToken),
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

  return {
    // Auth
    signInWithGoogle,
    signOut,
    // REST (anon)
    insert,
    select,
    // REST (authenticated)
    selectAuth,
    deleteAuth,
  };
})();
