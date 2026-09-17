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
