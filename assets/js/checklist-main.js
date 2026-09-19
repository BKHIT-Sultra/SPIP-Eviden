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
const STATE_KEY = 'spip_checklist_state_v3';
let _isRestoring = false;
let _scrollTimer = null;
let _hasRendered = false;

/**
 * Simpan state:
 * - openId: ID details yang terbuka
 * - viewportOffset: posisi top details terhadap viewport (bisa negatif)
 * - y: scroll position
 */
function captureState() {
  if (_isRestoring) {
    console.log('[STATE] capture skipped (restoring)');
    return;
  }

  try {
    const openEl = document.querySelector('details[data-id][open]');

    let openId = '';
    let viewportOffset = 0;

    if (openEl) {
      openId = openEl.dataset.id;
      const rect = openEl.getBoundingClientRect();
      viewportOffset = rect.top;
    }

    const y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    sessionStorage.setItem(STATE_KEY, JSON.stringify({
      openId,
      viewportOffset,
      y,
      ts: Date.now()
    }));

    console.log('[STATE] 💾 Captured', {
      openId: openId ? openId.substring(0, 30) + '...' : '(none)',
      viewportOffset: Math.round(viewportOffset),
      y: Math.round(y)
    });
  } catch (e) {
    console.warn('[STATE] Capture error:', e);
  }
}

/**
 * Restore state
 */
function restoreState() {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) {
      console.log('[STATE] ℹ️ No state to restore');
      return;
    }

    const state = JSON.parse(raw);
    console.log('[STATE] 🔄 State loaded:', state);

    // Expire 30 menit
    if (Date.now() - (state.ts || 0) > 30 * 60 * 1000) {
      sessionStorage.removeItem(STATE_KEY);
      console.log('[STATE] ⏰ State expired');
      return;
    }

    const openId = state.openId || '';
    const viewportOffset = typeof state.viewportOffset === 'number' ? state.viewportOffset : 0;
    const savedY = state.y || 0;

    if (!openId && savedY === 0) {
      console.log('[STATE] ℹ️ State is empty, skip restore');
      return;
    }

    _isRestoring = true;

    // 1. Buka details
    if (openId) {
      const el = document.querySelector(`details[data-id="${openId}"]`);
      if (el) {
        el.open = true;
        console.log('[STATE] 📂 Opened details:', openId.substring(0, 30) + '...');
      } else {
        console.log('[STATE] ⚠️ Details not found:', openId.substring(0, 30) + '...');
      }
    }

    // 2. Scroll setelah delay
    const doScroll = (attempt) => {
      attempt = attempt || 0;
      let targetY = savedY;

      // Hitung target berdasarkan posisi element
      if (openId) {
        const el = document.querySelector(`details[data-id="${openId}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const currentScrollY = window.scrollY || window.pageYOffset || 0;
          const elementTopInDoc = rect.top + currentScrollY;
          const computedY = elementTopInDoc - viewportOffset;
          if (!isNaN(computedY) && computedY >= 0) {
            targetY = computedY;
          }
        }
      }

      window.scrollTo(0, Math.max(0, targetY));

      if (attempt < 4) {
        requestAnimationFrame(() => doScroll(attempt + 1));
      } else {
        console.log(`[STATE] ✅ Restored → scrollY = ${Math.round(targetY)}`);
        setTimeout(() => {
          _isRestoring = false;
          console.log('[STATE] 🔓 Guard released');
        }, 250);
      }
    };

    // Delay supaya layout selesai
    setTimeout(() => {
      requestAnimationFrame(() => doScroll(0));
    }, 150);

  } catch (e) {
    _isRestoring = false;
    console.warn('[STATE] Restore error:', e);
  }
}

// Alias untuk backward-compat
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
    _scrollTimer = setTimeout(captureState, 250);
  }, { passive: true });
}

/**
 * Tracking toggle details
 */
function setupDetailsTracking() {
  document.addEventListener('toggle', (e) => {
    if (e.target && e.target.tagName === 'DETAILS' && e.target.dataset.id) {
      if (_isRestoring) {
        console.log('[STATE] toggle ignored (restoring)');
        return;
      }
      captureState();
    }
  }, true);
}

// ============ INIT ============
async function initChecklist() {
  // Matikan auto scroll restore browser
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
  // Save state HANYA kalau konten sudah ada (bukan initial load)
  const existing = document.querySelector('details[data-id]');
  if (existing) {
    captureState();
  }

  const el = LAYOUT.content();
  el.innerHTML = APP.loadingBox('Memuat checklist...');

  try {
    const data = await API.getChecklist(unit, periode, kodeKK);

    // Filter: KKLEAD II = prefix angka saja
    allData = data.filter(d => /^\d/.test(String(d.kode_kk || '').trim()));

    console.log(`📊 KKLEAD II: ${allData.length} dari ${data.length} parameter`);

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

  captureState();

  try {
    await API.post('markGradeSelesai', {
      id_trans: idTrans,
      grade: grade
    });

    showToast(`Grade ${grade} berhasil diupdate`, 'success');

    const content = document.getElementById('pageContent');
    if (content) {
      content.style.transition = 'opacity 0.25s';
      content.style.opacity = '0.5';
    }
    setTimeout(() => {
      loadChecklist();
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
