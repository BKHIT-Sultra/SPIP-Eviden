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
const STATE_KEY = 'spip_checklist_state_v5';
const RESTORE_FLAG = 'spip_should_restore';
let _isRestoring = false;
let _scrollTimer = null;

/**
 * Set flag: restore setelah reload
 * Dipanggil HANYA dari modal aksi (tambah/edit/upload/hapus)
 */
function markForRestore() {
  try {
    sessionStorage.setItem(RESTORE_FLAG, 'true');
    console.log('[STATE] 🚩 Marked for restore');
  } catch (e) { /* ignore */ }
}

/**
 * Cek flag
 */
function shouldRestore() {
  try {
    return sessionStorage.getItem(RESTORE_FLAG) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Clear flag — dipanggil setelah restore selesai
 */
function clearRestoreFlag() {
  try {
    sessionStorage.removeItem(RESTORE_FLAG);
  } catch (e) { /* ignore */ }
}

/**
 * Simpan state (openId + offset + scroll)
 */
function captureState() {
  if (_isRestoring) return;

  try {
    const openIds = [];
    document.querySelectorAll('details[data-id]').forEach(el => {
      if (el.open === true) openIds.push(el.dataset.id);
    });

    const openId = openIds[0] || '';

    let viewportOffset = 0;
    if (openId) {
      const el = document.querySelector(`details[data-id="${openId}"]`);
      if (el) viewportOffset = el.getBoundingClientRect().top;
    }

    const y = window.scrollY || window.pageYOffset || 0;

    sessionStorage.setItem(STATE_KEY, JSON.stringify({
      openId, viewportOffset, y, ts: Date.now()
    }));

    console.log('[STATE] 💾 Captured', {
      openId: openId ? openId.substring(0, 35) + '...' : '(NONE)',
      y: Math.round(y)
    });
  } catch (e) {
    console.warn('[STATE] Capture error:', e);
  }
}

/**
 * Restore — hanya jalan kalau flag aktif
 */
function restoreState() {
  // ✅ Skip kalau bukan dari aksi
  if (!shouldRestore()) {
    console.log('[STATE] ⏸️ Skip restore — no flag');
    return;
  }

  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) {
      clearRestoreFlag();
      return;
    }

    const state = JSON.parse(raw);
    console.log('[STATE] 🔄 Restoring:', state);

    if (Date.now() - (state.ts || 0) > 30 * 60 * 1000) {
      clearRestoreFlag();
      sessionStorage.removeItem(STATE_KEY);
      return;
    }

    const openId = state.openId || '';
    const viewportOffset = typeof state.viewportOffset === 'number' ? state.viewportOffset : 0;
    const savedY = state.y || 0;

    if (!openId && savedY === 0) {
      clearRestoreFlag();
      return;
    }

    _isRestoring = true;

    // Buka details
    if (openId) {
      const el = document.querySelector(`details[data-id="${openId}"]`);
      if (el) el.open = true;
    }

    // Scroll dengan retry
    const doScroll = (attempt) => {
      attempt = attempt || 0;
      let targetY = savedY;

      if (openId) {
        const el = document.querySelector(`details[data-id="${openId}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const currentY = window.scrollY || window.pageYOffset || 0;
          const computed = rect.top + currentY - viewportOffset;
          if (!isNaN(computed) && computed >= 0) targetY = computed;
        }
      }

      window.scrollTo(0, Math.max(0, targetY));

      if (attempt < 4) {
        requestAnimationFrame(() => doScroll(attempt + 1));
      } else {
        console.log(`[STATE] ✅ Restored → y = ${Math.round(targetY)}`);
        setTimeout(() => {
          _isRestoring = false;
          clearRestoreFlag();  // Clear flag setelah restore selesai
          console.log('[STATE] 🔓 Done + flag cleared');
        }, 250);
      }
    };

    setTimeout(() => {
      requestAnimationFrame(() => doScroll(0));
    }, 150);

  } catch (e) {
    _isRestoring = false;
    clearRestoreFlag();
    console.warn('[STATE] Restore error:', e);
  }
}

// Aliases untuk backward-compat
window.saveChecklistState = captureState;
window.restoreChecklistState = restoreState;
window.captureState = captureState;
window.restoreState = restoreState;
window.markForRestore = markForRestore;
window.shouldRestore = shouldRestore;
window.clearRestoreFlag = clearRestoreFlag;

/**
 * Tracking scroll (tetap jalan — untuk auto-save)
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
    if (!e.target || e.target.tagName !== 'DETAILS') return;
    if (!e.target.dataset.id) return;
    if (_isRestoring) return;
    setTimeout(captureState, 50);
  }, true);
}

// ============ INIT ============
async function initChecklist() {
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
  const el = LAYOUT.content();
  el.innerHTML = APP.loadingBox('Memuat checklist...');

  try {
    const data = await API.getChecklist(unit, periode, kodeKK);
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
  const status = prompt('Status baru (Belum/Upload/Selesai):', statusSekarang);
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

  // ✅ MARK FOR RESTORE — karena ini aksi
  markForRestore();
  captureState();

  try {
    await API.post('markGradeSelesai', { id_trans: idTrans, grade: grade });
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
    clearRestoreFlag();  // ✅ clear kalau gagal
    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  }
}

window.toggleGradeSelesai = toggleGradeSelesai;

// ============ START ============
initChecklist();
