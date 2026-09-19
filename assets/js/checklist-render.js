/**
 * =============================================
 * CHECKLIST RENDER — dengan Role-Based Access
 * =============================================
 */

// ============ PERMISSION HELPER ============

/**
 * Cek apakah user adalah PIC dari trans ini
 * @param {Object} user - user dari AUTH.getUser()
 * @param {Object} trans - trans object {pic, ...}
 * @returns {Boolean}
 */
function isUserPIC(user, trans) {
  if (!user || !trans) return false;
  const pic = String(trans.pic || '').trim().toLowerCase();
  if (!pic) return false;

  const nama = String(user.nama || '').trim().toLowerCase();
  const username = String(user.username || '').trim().toLowerCase();

  return pic === nama || pic === username;
}

/**
 * Cek apakah user boleh edit parameter ini
 * - Admin / Verifikator: selalu boleh
 * - Unit: hanya kalau PIC-nya dia
 * @returns {Boolean}
 */
/**
 * Cek apakah user boleh edit parameter ini
 * - Admin: selalu boleh
 * - Unit: hanya kalau PIC-nya dia
 * @returns {Boolean}
 */
function canEditTrans(user, trans) {
  if (!user) return false;

  const role = String(user.role || '').toLowerCase();

  // Admin: full access
  if (role === 'admin') return true;

  // Unit: cek apakah PIC-nya dia
  if (role === 'unit') return isUserPIC(user, trans);

  // Role lain (termasuk verifikator lama) → tidak boleh
  return false;
}

// ============ RENDER MAIN ============
function renderChecklist() {
  const el = LAYOUT.content();

  LAYOUT.setTitle(
    kodeKK ? `KK ${kodeKK}` : 'KKLEAD II — Struktur & Proses',
    `${allData.length} parameter · ${unit} · ${periode}`
  );

  if (allData.length === 0) {
    el.innerHTML = renderEmptyState();
    return;
  }

  let headerHtml = '';
  if (kodeKK) headerHtml = renderHeaderKK();

  const filterHtml = renderFilterBar();

  const groups = {};
  allData.forEach(d => {
    if (!groups[d.kode_kk]) {
      groups[d.kode_kk] = { kode_kk: d.kode_kk, subunsur: d.subunsur, items: [] };
    }
    groups[d.kode_kk].items.push(d);
  });

  const groupsHtml = Object.values(groups).map(g => renderGroup(g)).join('');

  el.innerHTML = headerHtml + filterHtml + `<div class="space-y-4">${groupsHtml}</div>`;

  document.getElementById('searchParam').addEventListener('input', filterChecklist);
  document.getElementById('filterStatus').addEventListener('change', filterChecklist);
  document.getElementById('filterGrade').addEventListener('change', filterChecklist);

  const picSel = document.getElementById('filterPIC');
  if (picSel) {
    picSel.addEventListener('change', filterChecklist);
  }
}

function renderEmptyState() {
  return `
    <div class="card p-12 text-center">
      <div class="text-5xl mb-4">📭</div>
      <div class="text-lg font-semibold text-slate-800 mb-2">Tidak ada data checklist</div>
      <div class="text-sm text-slate-500 mb-4">
        Filter: <b>${APP.esc(unit)}</b> · Periode: <b>${APP.esc(periode)}</b>
      </div>
      <button onclick="loadChecklist()" class="btn btn-primary mt-4 text-sm">
        🔄 Coba Lagi
      </button>
    </div>
  `;
}

function renderHeaderKK() {
  const total = allData.length;
  const selesai = allData.filter(d => d.trans.status === 'Selesai').length;
  const progress = total > 0 ? Math.round((selesai / total) * 100) : 0;

  return `
    <div class="card p-6 mb-6 border-l-4 border-blue-600 animate-fade-in">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span class="badge badge-proses mb-2">KK ${kodeKK}</span>
          <h1 class="text-xl font-bold text-slate-800">${APP.esc(allData[0].subunsur)}</h1>
          <p class="text-sm text-slate-500 mt-1">
            Unit: <span class="font-medium text-slate-700">${APP.esc(unit)}</span> ·
            Periode: <span class="font-medium text-slate-700">${APP.esc(periode)}</span>
          </p>
        </div>
        <div class="text-right">
          <div class="text-4xl font-bold text-blue-700">${progress}%</div>
          <div class="text-xs text-slate-500 mt-1">${selesai} dari ${total} selesai</div>
        </div>
      </div>
    </div>
  `;
}

function renderFilterBar() {
  // Ambil daftar PIC unik
  const allPICs = [...new Set(allData.map(d => d.trans.pic).filter(Boolean))].sort();
  const picOptions = allPICs
    .map(p => `<option value="${APP.esc(p)}">${APP.esc(p)}</option>`)
    .join('');

  return `
    <div class="card p-4 mb-6 animate-fade-in">
      <div class="flex flex-wrap gap-3 items-center">
        <div class="flex-1 min-w-[200px] relative">
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" id="searchParam" placeholder="Cari parameter..." class="input pl-10"/>
        </div>
        <select id="filterStatus" class="input max-w-[180px]">
          <option value="">Semua Status</option>
          <option>Belum</option><option>Proses</option><option>Upload</option>
          <option>Verifikasi</option><option>Selesai</option><option>Revisi</option>
        </select>
        <select id="filterGrade" class="input max-w-[160px]">
          <option value="">Semua Grade</option>
          <option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
        </select>
        <select id="filterPIC" class="input max-w-[180px]">
          <option value="">Semua PIC</option>
          ${picOptions}
        </select>
      </div>
    </div>
  `;
}

function renderGroup(g) {
  const total = g.items.length;
  const selesai = g.items.filter(i => i.trans.status === 'Selesai').length;

  return `
    <div class="card overflow-hidden animate-fade-in">
      <div class="px-5 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center justify-between">
        <h2 class="font-bold text-slate-800 flex items-center gap-2">
          <span class="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-mono font-bold">${g.kode_kk}</span>
          ${APP.esc(g.subunsur)}
        </h2>
        <span class="badge badge-proses">${selesai}/${total} selesai</span>
      </div>
      <div class="divide-y divide-slate-100">
        ${g.items.map(i => renderItem(i)).join('')}
      </div>
    </div>
  `;
}

// ============ RENDER ITEM ============
function renderItem(item) {
  const t = item.trans;
  const allEviden = item.eviden || [];
  const selectedGrade = t.grade_dipilih;

  // ✅ CEK PERMISSION
  const user = AUTH.getUser();
  const canEdit = canEditTrans(user, t);
  const isPIC = isUserPIC(user, t);

  const sumberBadges = [];
  if (item.sumber.spip) sumberBadges.push('<span class="badge bg-emerald-100 text-emerald-700">SPIP</span>');
  if (item.sumber.mri) sumberBadges.push('<span class="badge badge-proses">MRI</span>');
  if (item.sumber.iepk) sumberBadges.push('<span class="badge bg-violet-100 text-violet-700">IEPK</span>');

  const totalEviden = allEviden.length;
  const terupload = allEviden.filter(e => e.status === 'terupload').length;

  const gradesHtml = item.grades.map(g =>
    renderGradeCard(g, item, allEviden, selectedGrade, canEdit)
  ).join('');

  const evidenCount = totalEviden > 0
    ? `${terupload}/${totalEviden} dokumen terupload`
    : '';

  const picEsc = APP.esc(t.pic || '').replace(/'/g, "\\'");

  // ✅ Badge PIC dengan tanda "Ini Anda" kalau PIC-nya user login
  const picBadge = t.pic
    ? `<span class="inline-flex items-center gap-1 text-xs ${
        isPIC ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-blue-50 text-blue-700 border-blue-200'
      } px-2 py-0.5 rounded-md border">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
        ${APP.esc(t.pic)}
        ${isPIC ? '<span class="font-semibold">· Anda</span>' : ''}
      </span>`
    : '';

  // ✅ Badge "Terkunci" untuk role Unit yang bukan PIC
  const lockedBadge = (!canEdit && user && String(user.role || '').toLowerCase() === 'unit')
    ? `<span class="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        Terkunci
      </span>`
    : '';

  return `
    <details class="group" data-id="${item.id_trans}">
      <summary class="p-4 hover:bg-slate-50 transition cursor-pointer list-none">
        <div class="flex items-start gap-3">

          <div class="pt-0.5 shrink-0">
            <div class="w-6 h-6 rounded-full flex items-center justify-center ${
              t.status === 'Selesai' ? 'bg-emerald-500' :
              t.status === 'Upload'  ? 'bg-amber-500' :
              t.status === 'Belum'   ? 'bg-slate-300' : 'bg-blue-500'
            }">
              ${t.status === 'Selesai' ? `
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>` : ''}
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3 flex-wrap lg:flex-nowrap">

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span class="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">Param ${item.no_parameter}</span>
                  ${t.grade_dipilih ? `<span class="${APP.gradeClass(t.grade_dipilih)}">Grade ${t.grade_dipilih}</span>` : ''}
                  ${sumberBadges.join('')}
                  <span class="${APP.statusClass(t.status)}">${t.status}</span>
                  ${picBadge}
                  ${lockedBadge}
                </div>
                <div class="font-medium text-sm text-slate-800 leading-snug">
                  ${APP.esc(item.uraian_parameter)}
                </div>
                ${evidenCount ? `
                  <div class="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                    </svg>
                    ${evidenCount}
                  </div>
                ` : ''}
              </div>

              <!-- ====== ACTION BUTTONS ====== -->
              <!-- Hanya tampil kalau canEdit = true -->
              ${canEdit ? `
                <div class="flex items-center gap-1.5 shrink-0 flex-wrap"
                     onclick="event.preventDefault(); event.stopPropagation();">

                  <button onclick="openModalPIC('${item.id_trans}', '${picEsc}')"
                          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg
                                 bg-white border border-slate-200 text-slate-600
                                 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700
                                 active:scale-95 transition-all duration-150"
                          title="${t.pic ? 'Ubah PIC' : 'Set PIC'}">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <span class="hidden sm:inline">${t.pic ? 'Ubah PIC' : 'Set PIC'}</span>
                  </button>

                  <button onclick="ambilLinkUpload('${item.id_trans}')"
                          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg
                                 bg-white border border-slate-200 text-slate-600
                                 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700
                                 active:scale-95 transition-all duration-150"
                          title="Ambil Link Upload">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                    <span class="hidden sm:inline">Ambil Link</span>
                  </button>

                  <button onclick="syncFolder('${item.id_trans}')"
                          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg
                                 bg-white border border-slate-200 text-slate-600
                                 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700
                                 active:scale-95 transition-all duration-150"
                          title="Sync Folder Drive">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <span class="hidden sm:inline">Sync</span>
                  </button>

                  <button onclick="updateStatus('${item.id_trans}', '${t.status}')"
                          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg
                                 text-white bg-gradient-to-r from-blue-600 to-blue-700
                                 shadow-md shadow-blue-500/30
                                 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/40
                                 active:scale-95 transition-all duration-150"
                          title="Update Status">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span class="hidden sm:inline">Update</span>
                  </button>

                </div>
              ` : `
                <!-- Role Unit yang bukan PIC — tampilkan info saja -->
                <div class="flex items-center gap-1.5 shrink-0"
                     onclick="event.preventDefault(); event.stopPropagation();">
                  <div class="text-xs text-slate-400 italic px-2 py-1">
                    Hanya PIC yang dapat mengubah
                  </div>
                </div>
              `}
            </div>
          </div>

          <div class="pt-1 shrink-0 text-slate-400">
            <svg class="w-5 h-5 chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </summary>

      <div class="px-5 pb-5 pt-3 bg-slate-50/50 border-t border-slate-100">
        <div class="text-xs font-semibold text-slate-500 uppercase mb-3">Referensi Grade</div>
        ${gradesHtml}
      </div>
    </details>
  `;
}

// ============ GRADE CARD ============
function renderGradeCard(g, item, allEviden, selectedGrade, canEdit) {
  const isSelected = selectedGrade && g.grade === selectedGrade;
  const gradeUpper = String(g.grade).toUpperCase();

  // Filter eviden per grade
  const ev = allEviden.filter(e => {
    const eGrade = String(e.grade || '').toUpperCase().trim();
    return (eGrade || 'A') === gradeUpper;
  });

  const gradesDone = item.trans.grades_done || [];
  const isDone = gradesDone.includes(gradeUpper);

  // ✅ VALIDASI TOMBOL SELESAI
  const totalEviden = ev.length;
  const uploadedCount = ev.filter(e => e.status === 'terupload').length;
  const isLengkap = totalEviden > 0 && uploadedCount === totalEviden;

  let reason = '';
  if (!canEdit) reason = 'Hanya PIC yang bisa';
  else if (totalEviden === 0) reason = 'Belum ada item lampiran';
  else if (!isLengkap) reason = `Masih ${totalEviden - uploadedCount} item belum diupload`;

  const cardClass = isDone
    ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-200'
    : isSelected
      ? 'border-blue-400 bg-blue-50/40 ring-1 ring-blue-200'
      : 'border-slate-100 bg-white';

  const doneBadge = isDone
    ? '<span class="badge badge-selesai ml-1">✓ Selesai</span>'
    : '';

  // ✅ TOMBOL SELESAI — hanya muncul kalau canEdit
  const doneBtnHtml = canEdit
    ? `<button
         data-grade-btn="${item.id_trans}-${gradeUpper}"
         onclick="event.preventDefault(); event.stopPropagation(); toggleGradeSelesai('${item.id_trans}', '${gradeUpper}')"
         ${!isLengkap && !isDone ? 'disabled' : ''}
         title="${reason || (isDone ? 'Klik untuk batal selesai' : 'Tandai grade ini selesai')}"
         class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                ${isDone
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  : isLengkap
                    ? 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70'
                }">
         <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
           <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
         </svg>
         ${isDone ? 'Selesai' : 'Tandai Selesai'}
       </button>`
    : '';

  return `
    <div class="rounded-xl border ${cardClass} mb-3 overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap bg-slate-50">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="${APP.gradeClass(g.grade)}">Grade ${g.grade}</span>
          <span class="text-xs text-slate-500">Cara: ${APP.esc(g.cara_pengujian)}</span>
          ${isSelected && !isDone ? '<span class="badge bg-blue-100 text-blue-700 ml-1">✓ Dipilih</span>' : ''}
          ${doneBadge}
          ${totalEviden > 0 ? `<span class="badge ${isLengkap ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">📎 ${uploadedCount}/${totalEviden}</span>` : ''}
        </div>
        ${doneBtnHtml}
      </div>

      <div class="p-4">
        <div class="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <div class="text-xs font-semibold text-slate-500 uppercase mb-1.5">Kriteria</div>
            <div class="text-sm text-slate-700 leading-relaxed">${APP.esc(g.kriteria)}</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-500 uppercase mb-1.5">Penjelasan</div>
            <div class="text-sm text-slate-700 leading-relaxed">${formatPenjelasan(g.penjelasan)}</div>
          </div>
        </div>

        <div class="mt-4">
          <div class="text-xs font-semibold text-slate-500 uppercase mb-2">Uraian Hasil & Eviden</div>

          <div class="border border-slate-200 rounded-xl bg-white overflow-hidden">

            ${ev.length > 0 ? `
              <div class="divide-y divide-slate-100">
                ${ev.map((e, idx) => renderEvidenRow(e, idx + 1, canEdit)).join('')}
              </div>
            ` : (canEdit ? `
              <div class="px-4 py-3 text-xs text-slate-500 text-center bg-slate-50/60">
                Belum ada item lampiran. Klik "Tambah Item Lampiran" di bawah.
              </div>
            ` : `
              <div class="px-4 py-3 text-xs text-slate-400 italic text-center bg-slate-50/60">
                Belum ada item lampiran
              </div>
            `)}

            ${canEdit ? `
              <div class="p-3 bg-slate-50/50">
                <button onclick="openModalTambah('${item.id_trans}', '${g.grade}')"
                        class="w-full text-xs text-slate-600 hover:text-blue-700 hover:bg-white border border-dashed border-slate-300 hover:border-blue-400 rounded-lg py-2.5 inline-flex items-center justify-center gap-1.5 transition font-medium">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Tambah Item Lampiran
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============ EVIDEN ROW ============
function renderEvidenRow(e, nomor, canEdit) {
  const isUploaded = e.status === 'terupload';
  const isFile = e.jenis === 'file';

  const iconHtml = isUploaded
    ? (isFile
        ? `<div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
             </svg>
           </div>`
        : `<div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
             </svg>
           </div>`)
    : `<div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
         </svg>
       </div>`;

  let subtitle = '';
  if (isUploaded) {
    if (isFile) {
      subtitle = [e.file_name, e.ukuran, e.upload_by, e.upload_at ? APP.formatDate(e.upload_at) : '']
        .filter(Boolean).join(' · ');
    } else {
      subtitle = [e.link, e.upload_by, e.upload_at ? APP.formatDate(e.upload_at) : '']
        .filter(Boolean).join(' · ');
    }
  } else {
    subtitle = 'Belum ada dokumen';
  }

  const badge = isUploaded
    ? `<span class="badge badge-selesai">
         <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
           <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
         </svg>
         Terupload
       </span>`
    : `<span class="badge badge-revisi">
         <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
           <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
         </svg>
         Belum
       </span>`;

  const namaEsc = APP.esc(e.nama_dokumen || '').replace(/'/g, "\\'");
  const linkEsc = APP.esc(e.link || '').replace(/'/g, "\\'");

  // ✅ Tombol Buka (kalau uploaded) — selalu tampil, semua role bisa akses
  const openBtn = isUploaded
    ? `<a href="${APP.esc(e.link || '#')}" target="_blank"
          class="btn btn-ghost p-2 text-blue-700 hover:bg-blue-50" title="Buka dokumen">
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
         </svg>
       </a>`
    : '';

  // ✅ Tombol Upload — hanya kalau canEdit
  const uploadBtn = (!isUploaded && canEdit)
    ? `<button onclick="openModalUpload('${e.id_eviden}', '${namaEsc}')"
               class="btn btn-primary text-xs px-3 py-1.5" title="Upload dokumen">
         <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
         </svg>
         Upload
       </button>`
    : '';

  // ✅ Tombol Edit — hanya kalau canEdit
  const editBtn = canEdit
    ? `<button onclick="openModalEdit('${e.id_eviden}', '${namaEsc}', '${linkEsc}')"
              class="btn btn-ghost p-2" title="Edit">
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
         </svg>
       </button>`
    : '';

  // ✅ Tombol Hapus — hanya kalau canEdit
  const deleteBtn = canEdit
    ? `<button onclick="openModalHapus('${e.id_eviden}', '${namaEsc}')"
              class="btn btn-ghost p-2 hover:!bg-rose-50 hover:!text-rose-600" title="Hapus">
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
         </svg>
       </button>`
    : '';

  // ✅ Badge "Terkunci" kalau !canEdit dan belum upload
  const lockedLabel = (!canEdit && !isUploaded)
    ? `<span class="text-xs text-slate-400 italic px-2 py-1">Terkunci</span>`
    : '';

  return `
    <div class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition"
         data-id-trans="${e.id_eviden}"
         data-eviden-row>
      <div class="text-sm font-semibold text-slate-400 w-6 pt-2.5 shrink-0 text-right">${nomor}.</div>
      ${iconHtml}
      <div class="flex-1 min-w-0 pt-0.5">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-medium text-slate-800 break-words">${APP.esc(e.nama_dokumen)}</span>
          ${badge}
        </div>
        <div class="text-xs text-slate-400 mt-0.5 break-all">${APP.esc(subtitle)}</div>
      </div>
      <div class="flex items-center gap-0.5 shrink-0 pt-1">
        ${openBtn}
        ${uploadBtn}
        ${editBtn}
        ${deleteBtn}
        ${lockedLabel}
      </div>
    </div>
  `;
}

// ============ FORMAT HELPER ============
function formatPenjelasan(text) {
  if (!text) return '-';
  const lines = String(text).split('\n').filter(l => l.trim());
  if (lines.some(l => l.trim().startsWith('-') || l.trim().startsWith('•'))) {
    const items = lines.map(l => `<li>${APP.esc(l.replace(/^[\s\-•]+/, ''))}</li>`).join('');
    return `<ul class="list-disc pl-5 space-y-0.5">${items}</ul>`;
  }
  return APP.esc(text);
}

// ============ FILTER ============
function filterChecklist() {
  const q = document.getElementById('searchParam').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const grade = document.getElementById('filterGrade').value;
  const pic = document.getElementById('filterPIC')?.value || '';

  document.querySelectorAll('details[data-id]').forEach(el => {
    const text = el.textContent.toLowerCase();
    let show = true;
    if (q && !text.includes(q)) show = false;
    if (status && !el.textContent.includes(status)) show = false;
    if (grade && !el.textContent.includes('Grade ' + grade)) show = false;
    if (pic && !el.textContent.includes(pic)) show = false;
    el.style.display = show ? '' : 'none';
  });
}
