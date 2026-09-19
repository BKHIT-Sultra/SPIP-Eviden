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

// ============ INIT ============
async function initChecklist() {
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
      periode = aktif ? String(aktif.periode) : '';
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
    allData = await API.getChecklist(unit, periode, kodeKK);
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
    'Status baru (Belum/Proses/Upload/Verifikasi/Selesai/Revisi):',
    statusSekarang
  );
  if (!status) return;
  try {
    await API.saveStatus({ id_trans: idTrans, status: status });
    loadChecklist();
  } catch (err) {
    alert('Gagal: ' + err.message);
  }
}

// ============ START ============
initChecklist();

/**
 * Toggle mark grade sebagai Selesai
 */
async function toggleGradeSelesai(idTrans, grade) {
  const btn = document.querySelector(`[data-grade-btn="${idTrans}-${grade}"]`);
  const originalHtml = btn ? btn.innerHTML : '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Memproses...
    `;
  }

  try {
    await API.post('markGradeSelesai', {
      id_trans: idTrans,
      grade: grade
    });

    showToast(`Grade ${grade} berhasil diupdate`, 'success');

    // Fade konten lalu reload
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
    showToast('Gagal: ' + err.message, 'error');
    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  }
}

window.toggleGradeSelesai = toggleGradeSelesai;

/**
 * Prompt untuk isi/edit uraian hasil
 */
async function isiUraian(idTrans) {
  // Cari data trans saat ini
  const item = allData.find(d => d.id_trans === idTrans);
  const uraianLama = item?.trans?.uraian_hasil || '';

  const uraian = prompt(
    'Uraian Hasil Pengujian:\n\n' +
    '(Ketik uraian kondisi/hasil pengujian untuk parameter ini)',
    uraianLama
  );

  if (uraian === null) return; // user batal
  if (uraian.trim() === '') {
    alert('Uraian tidak boleh kosong');
    return;
  }

  try {
    await API.post('saveUraian', {
      id_trans: idTrans,
      uraian_hasil: uraian
    });

    showToast('Uraian berhasil disimpan', 'success');

    // Fade + reload
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
    showToast('Gagal menyimpan uraian: ' + err.message, 'error');
  }
}

window.isiUraian = isiUraian;
