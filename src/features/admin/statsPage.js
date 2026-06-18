/**
 * statsPage.js
 * Feature: Admin – Dashboard Statistik
 *
 * Section 1 – Tahunan:
 *   - Barchart jumlah pengunjung Jan–Des untuk tahun yang dipilih
 *   - Pie chart jenis keperluan tahun yang dipilih
 *
 * Section 2 – Bulanan:
 *   - Total pengunjung bulan yang dipilih
 *   - Pie chart jenis keperluan bulan yang dipilih
 *
 * Menggunakan Chart.js (dimuat via CDN di admin-index.html).
 */

const StatsPage = (() => {

  // ── Palette warna konsisten ────────────────────────────────
  const COLORS = [
    '#1a3a6b', '#3b82f6', '#16a34a', '#f59e0b',
    '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899',
    '#14b8a6', '#f97316',
  ];

  // ── Nama bulan ─────────────────────────────────────────────
  const MONTHS = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
  ];

  // ── Referensi Chart.js instance ───────────────────────────
  let _barChart  = null;
  let _pieYear   = null;
  let _pieMonth  = null;

  // ── Utility ────────────────────────────────────────────────
  function _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _monthOptions(selected) {
    return MONTHS.map((m, i) =>
      `<option value="${i + 1}" ${selected === i + 1 ? 'selected' : ''}>${m}</option>`
    ).join('');
  }

  function _yearOptions(years, selected) {
    return years.map(y =>
      `<option value="${y}" ${selected === y ? 'selected' : ''}>${y}</option>`
    ).join('');
  }

  // ── Destroy chart instance sebelum re-render ───────────────
  function _destroyChart(ref) {
    if (ref) { try { ref.destroy(); } catch (_) {} }
    return null;
  }

  // ── Template ───────────────────────────────────────────────
  function _template(years) {
    const thisYear  = new Date().getFullYear();
    const thisMonth = new Date().getMonth() + 1;
    const yearOpts  = _yearOptions(years, thisYear);
    const monthOpts = _monthOptions(thisMonth);

    return `
      <!-- ══════════════════════════════════════
           SECTION 1 — TAHUNAN
           ══════════════════════════════════════ -->
      <div class="stats-section">

        <div class="stats-section-header">
          <h2 class="stats-section-title">Barchart Jumlah Pengunjung Tahun</h2>
          <div class="stats-filter-row">
            <select class="stats-select" id="sel-year-annual" aria-label="Pilih tahun">
              ${yearOpts}
            </select>
          </div>
        </div>

        <div id="annual-loading" class="stats-loading">
          <div class="bt-spinner"></div> Memuat data…
        </div>

        <div class="stats-charts-row" id="annual-charts" style="display:none">
          <!-- Barchart -->
          <div class="stats-chart-card stats-chart-card--wide">
            <div class="stats-chart-label" id="annual-bar-label">Jumlah Pengunjung 2024</div>
            <div class="stats-chart-wrap">
              <canvas id="chart-bar-annual"></canvas>
            </div>
          </div>
          <!-- Pie -->
          <div class="stats-chart-card">
            <div class="stats-chart-label">Jenis Keperluan</div>
            <div class="stats-chart-wrap stats-chart-wrap--pie">
              <canvas id="chart-pie-annual"></canvas>
            </div>
            <div class="stats-legend" id="legend-pie-annual"></div>
          </div>
        </div>

        <div class="stats-empty hidden" id="annual-empty">Tidak ada data untuk tahun ini.</div>
      </div>

      <!-- ══════════════════════════════════════
           SECTION 2 — BULANAN
           ══════════════════════════════════════ -->
      <div class="stats-section" style="margin-top:32px;">

        <div class="stats-section-header">
          <h2 class="stats-section-title">Pengunjung PST BPS Kota Parepare Bulan</h2>
          <div class="stats-filter-row">
            <select class="stats-select" id="sel-month-monthly" aria-label="Pilih bulan">
              ${monthOpts}
            </select>
            <span class="stats-filter-sep">Tahun</span>
            <select class="stats-select" id="sel-year-monthly" aria-label="Pilih tahun">
              ${yearOpts}
            </select>
          </div>
        </div>

        <div id="monthly-loading" class="stats-loading">
          <div class="bt-spinner"></div> Memuat data…
        </div>

        <div class="stats-monthly-wrap" id="monthly-content" style="display:none">

          <!-- Total card -->
          <div class="stats-total-card">
            <div class="stats-total-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div class="stats-total-label" id="monthly-period-label">Januari 2024</div>
              <div class="stats-total-value" id="monthly-total-value">0</div>
              <div class="stats-total-sub">pengunjung</div>
            </div>
          </div>

          <!-- Pie keperluan -->
          <div class="stats-chart-card" style="max-width:460px;">
            <div class="stats-chart-label">Jenis Keperluan</div>
            <div class="stats-chart-wrap stats-chart-wrap--pie">
              <canvas id="chart-pie-monthly"></canvas>
            </div>
            <div class="stats-legend" id="legend-pie-monthly"></div>
          </div>

        </div>

        <div class="stats-empty hidden" id="monthly-empty">Tidak ada data untuk bulan ini.</div>
      </div>`;
  }

  // ── Render barchart tahunan ────────────────────────────────
  function _renderBarChart(monthly, year) {
    _barChart = _destroyChart(_barChart);

    const label = document.getElementById('annual-bar-label');
    if (label) label.textContent = `Jumlah Pengunjung ${year}`;

    const ctx = document.getElementById('chart-bar-annual')?.getContext('2d');
    if (!ctx) return;

    _barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: MONTHS,
        datasets: [{
          label: 'Jumlah Pengunjung',
          data:  monthly,
          backgroundColor: COLORS[0],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed.y} pengunjung`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 },
            grid: { color: '#f0f3f9' },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  // ── Render pie chart ───────────────────────────────────────
  function _renderPie(canvasId, legendId, labels, counts, instanceRef, setRef) {
    setRef(_destroyChart(instanceRef));

    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const colors = labels.map((_, i) => COLORS[i % COLORS.length]);

    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data:            counts,
          backgroundColor: colors,
          borderWidth:     2,
          borderColor:     '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} pengunjung`,
            },
          },
        },
      },
    });

    setRef(chart);

    // Custom legend
    const legendEl = document.getElementById(legendId);
    if (legendEl) {
      const total = counts.reduce((a, b) => a + b, 0);
      legendEl.innerHTML = labels.map((l, i) => {
        const pct = total ? Math.round((counts[i] / total) * 100) : 0;
        return `
          <div class="stats-legend-item">
            <span class="stats-legend-dot" style="background:${colors[i]}"></span>
            <span class="stats-legend-name">${_esc(l)}</span>
            <span class="stats-legend-val">${counts[i]} <span class="stats-legend-pct">(${pct}%)</span></span>
          </div>`;
      }).join('');
    }
  }

  // ── Load & render Section 1 (Tahunan) ─────────────────────
  async function _loadAnnual(year) {
    document.getElementById('annual-loading').style.display = 'flex';
    document.getElementById('annual-charts').style.display  = 'none';
    document.getElementById('annual-empty')?.classList.add('hidden');

    const [statsRes, purposeRes] = await Promise.all([
      StatsService.getYearlyStats(year),
      StatsService.getYearlyPurpose(year),
    ]);

    document.getElementById('annual-loading').style.display = 'none';

    if (statsRes.error || purposeRes.error) {
      const el = document.getElementById('annual-empty');
      if (el) { el.textContent = 'Gagal memuat data.'; el.classList.remove('hidden'); }
      return;
    }

    if (statsRes.total === 0) {
      document.getElementById('annual-empty')?.classList.remove('hidden');
      return;
    }

    document.getElementById('annual-charts').style.display = 'flex';

    _renderBarChart(statsRes.monthly, year);

    _renderPie(
      'chart-pie-annual', 'legend-pie-annual',
      purposeRes.labels, purposeRes.counts,
      _pieYear,
      chart => { _pieYear = chart; }
    );
  }

  // ── Load & render Section 2 (Bulanan) ─────────────────────
  async function _loadMonthly(year, month) {
    document.getElementById('monthly-loading').style.display = 'flex';
    document.getElementById('monthly-content').style.display = 'none';
    document.getElementById('monthly-empty')?.classList.add('hidden');

    const res = await StatsService.getMonthlyStats(year, month);

    document.getElementById('monthly-loading').style.display = 'none';

    if (res.error) {
      const el = document.getElementById('monthly-empty');
      if (el) { el.textContent = 'Gagal memuat data.'; el.classList.remove('hidden'); }
      return;
    }

    // Update label & total
    const periodLabel = document.getElementById('monthly-period-label');
    if (periodLabel) periodLabel.textContent = `${MONTHS[month - 1]} ${year}`;

    const totalVal = document.getElementById('monthly-total-value');
    if (totalVal) totalVal.textContent = res.total;

    if (res.total === 0) {
      document.getElementById('monthly-empty')?.classList.remove('hidden');
      return;
    }

    document.getElementById('monthly-content').style.display = 'flex';

    _renderPie(
      'chart-pie-monthly', 'legend-pie-monthly',
      res.labels, res.counts,
      _pieMonth,
      chart => { _pieMonth = chart; }
    );
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    async render(contentEl) {
      // Pastikan Chart.js tersedia
      if (typeof Chart === 'undefined') {
        contentEl.innerHTML = `<p style="color:#dc2626;padding:24px">
          Chart.js belum dimuat. Pastikan CDN tersedia.</p>`;
        return;
      }

      const years = await StatsService.getAvailableYears();
      const thisYear  = new Date().getFullYear();
      const thisMonth = new Date().getMonth() + 1;

      // Pastikan tahun ini ada di list
      if (!years.includes(thisYear)) years.unshift(thisYear);

      contentEl.innerHTML = _template(years);

      // Destroy chart lama jika ada (navigasi ulang)
      _barChart = _destroyChart(_barChart);
      _pieYear  = _destroyChart(_pieYear);
      _pieMonth = _destroyChart(_pieMonth);

      // Load data awal
      await Promise.all([
        _loadAnnual(thisYear),
        _loadMonthly(thisYear, thisMonth),
      ]);

      // ── Events ──────────────────────────────────────────────

      document.getElementById('sel-year-annual')?.addEventListener('change', (e) => {
        _loadAnnual(Number(e.target.value));
      });

      document.getElementById('sel-month-monthly')?.addEventListener('change', () => {
        const m = Number(document.getElementById('sel-month-monthly').value);
        const y = Number(document.getElementById('sel-year-monthly').value);
        _loadMonthly(y, m);
      });

      document.getElementById('sel-year-monthly')?.addEventListener('change', () => {
        const m = Number(document.getElementById('sel-month-monthly').value);
        const y = Number(document.getElementById('sel-year-monthly').value);
        _loadMonthly(y, m);
      });
    },
  };
})();
