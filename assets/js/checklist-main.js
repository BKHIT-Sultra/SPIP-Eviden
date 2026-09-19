/**
 * =============================================
 * CHECKLIST MAIN — Init, load data, actions
 * =============================================
 */

// ============ STATE GLOBAL ============
const params = new URLSearchParams(location.search);
let kodeKK = params.get('kk') || '';
let unit = params.get('unit');
let periode = params.get('periode');
let allData = [];

// ============ PERSIST STATE ============
const STATE_KEY = 'spip_checklist_state';
let _isRestoring = false;
let _scrollTimer = null;

/**
 * Capture state: ID details yang terbuka + posisi scroll
 */
function captureState() {
  if (_isRestoring) return;
  try {
    const openEl = document.querySelector('details[data-id][open]');
    const openId = openEl ? openEl.dataset.id : '';
    const y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    sessionStorage.setItem(STATE_KEY, JSON.stringify({
      openId,
      y,
      ts: Date.now()
    }));

    console.log('[STATE] Saved →', { openId, y });
  } catch (e) {
    console.warn('[STATE] Save error:', e);
  }
}

/**
 * Restore state: buka details + scroll ke posisi
 */
function restoreState() {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) {
      console.log('[STATE] No state');
      return;
    }

    const state = JSON.parse(raw);
    console.log('[STATE] Restoring →', state);

    if (Date.now() - (state.ts || 0) > 30 * 60 * 1000) {
      sessionStorage.removeItem(STATE_KEY);
      return;
    }

    const openId = state.openId || '';
    const targetY = state.y || 0;

    if (!openId && targetY === 0) return;

    _isRestoring = true;

    // 1. Buka details yang tersimpan
    if (openId) {
      const el = document.querySelector(`details[data-id="${openId}"]`);
      if (el) el.open = true;
    }

    // 2. Scroll — pakai scrollIntoView kalau ada openId
    let attempt = 0;

    const doScroll = () => {
      attempt++;

      if (openId) {
        const el = document.querySelector(`details[data-id="${openId}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const currentY = window.scrollY || window.pageYOffset || 0;
          const targetScroll = rect.top + currentY - 80;
          window.scrollTo(0, Math.max(0, targetScroll));
          console.log('[STATE] scrollIntoView →', targetScroll, 'attempt', attempt);
        }
      } else {
        window.scrollTo(0, targetY);
        console.log('[STATE] scrollTo Y →', targetY, 'attempt', attempt);
      }

      if (attempt < 6) {
        requestAnimationFrame(doScroll);
      } else {
        setTimeout(() => {
          _isRestoring = false;
          console.log('[STATE] Restore done');
        }, 150);
      }
    };

    // Tunggu 2 frame biar DOM siap
    requestAnimationFrame(() => {
      requestAnimationFrame(doScroll);
    });

  } catch (e) {
    _isRestoring = false;
    console.warn('[STATE] Restore error:', e);
  }
}

/**
 * Alias untuk backward-compat
 */
window.saveChecklistState = captureState;
window.restoreChecklistState = restoreState;
window.captureState = captureState;
window.restoreState = restoreState;

/**
 * Tracking scroll otomatis
 */
function setupScrollTracking() {
  if (window._spip_tracking) return;
  window._spip_tracking = true;

  window.addEventListener('scroll', () => {
    if (_isRestoring) return;
    clearTimeout(_scrollTimer);
    _scrollTimer = setTimeout(captureState, 200);
  }, { passive: true });
}

/**
 * Tracking toggle details (saat user buka/tutup parameter)
 */
function setupDetailsTracking() {
  document.addEventListener('toggle', (e) => {
    if (e.target && e.target.tagName === 'DETAILS' && e.target.dataset.id) {
      if (_isRestoring) return;
      captureState();
    }
  }, true); // capture=true biar catch semua toggle
}

// ============ INIT ============
async function initChecklist() {
  // Matikan auto scroll restore bawaan browser
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  setupScrollTracking();
  setupDetailsTracking();

  console.log('🚀 INIT checklist');

  const user = AUTH.getUser();
  if (!unit && user && user.kode_unit) unit = user.kode_unit;

  if (!unit) {
    try {
      const units = await API.getUnits();
      const aktif = units.filter(u =>
        u.aktif === true || String(u.aktif).toUpperCase() === 'TRUE'
      );
      unit = aktif[0]?.kode_unit || '';
    } catch (e) {
      console.error('Gagal ambil units:', e);
    }
  }

  if (!periode) {
    try {
      const periodes = await API.getPeriodes();
      let aktif = periodes.find(p => String(p.status || '').toLowerCase().trim() === 'aktif');
      if (!aktif) {
        const sorted = periodes
          .map(p => ({ ...p, _t: parseInt(String(p.periode).match(/\d{4}/)?.[0] || 0) }))
          .sort((a, b) => b._t - a._t);
        aktif = sorted[0];
      }
      periode = aktif ? String(aktif.periode).replace(/\.0+$/, '') : '';
    } catch (e) {
      console.error('Gagal ambil periodes:', e);
    }
  }

  if (!unit || !periode) {
    LAYOUT.content().innerHTML = APP.errorBox(
      `Unit atau periode tidak ditemukan.\nUnit: ${unit || '-'} · Periode: ${periode || '-'}`
    );
    return;
  }

  loadChecklist();
}

// ============ LOAD DATA ============
async function loadChecklist() {
  // Save state SEBELUM ganti konten
  captureState();

  const el = LAYOUT.content();
  el.innerHTML = APP.loadingBox('Memuat checklist...');

  try {
    const data = await API.getChecklist(unit, periode, kodeKK);

    // ✅ FILTER: KKLEAD II hanya kode_kk yang berawalan ANGKA
    // (bukan 'L*' = KKLEAD I, bukan 'P*' = KKLEAD III)
    allData = data.filter(d => /^\d/.test(String(d.kode_kk || '').trim()));

    console.log(`📊 KKLEAD II: ${allData.length} dari ${data.length} parameter (filtered)`);

    renderChecklist();
  } catch (err) {
    console.error('❌ Error:', err);
    el.innerHTML = APP.errorBox(err.message);
  }
}

// ============ ACTIONS ============
async function ambilLinkUpload(idTrans) {
  try {
    const result = await API.getUploadLink(idTrans);
    window.open(result.folder_url, '_blank');
  } catch (err) {
    alert('Gagal: ' + err.message);
  }
}

async function syncFolder(idTrans) {
  if (!confirm('Sync file dari folder Drive?')) return;

  // Save state sebelum reload
  captureState();

  try {
    const r = await API.syncFolder({ id_trans: idTrans });
    alert(`Selesai. ${r.added} file baru, ${r.skipped} dilewati.`);
    loadChecklist();
  } catch (err) {
    alert('Gagal: ' + err.message);
  }
}

async function updateStatus(idTrans, statusSekarang) {
  const status = prompt(
    'Status baru (Belum/Upload/Selesai):',
    statusSekarang
  );
  if (!status) return;

  captureState();

  try {
    await API.saveStatus({ id_trans: idTrans, status: status });
    loadChecklist();
  } catch (err) {
    alert('Gagal: ' + err.message);
  }
}

// ============ TOGGLE GRADE SELESAI ============
async function toggleGradeSelesai(idTrans, grade) {
  const btn = document.querySelector(`[data-grade-btn="${idTrans}-${grade}"]`);
  const originalHtml = btn ? btn.innerHTML : '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Memproses...
    `;
  }

  // ✅ Save state SEBELUM API call
  captureState();

  try {
    await API.post('markGradeSelesai', {
      id_trans: idTrans,
      grade: grade
    });

    showToast(`Grade ${grade} berhasil diupdate`, 'success');

    // Fade konten + reload
    const content = document.getElementById('pageContent');
    if (content) {
      content.style.transition = 'opacity 0.25s';
      content.style.opacity = '0.5';
    }
    setTimeout(() => {
      if (typeof loadChecklist === 'function') loadChecklist();
      setTimeout(() => { if (content) content.style.opacity = '1'; }, 100);
    }, 250);

  } catch (err) {
    showToast(err.message, 'error');
    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  }
}

window.toggleGradeSelesai = toggleGradeSelesai;

// ============ START ============
initChecklist();
