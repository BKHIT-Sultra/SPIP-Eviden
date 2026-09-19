/**
 * =============================================
 * CHECKLIST MODAL — Handle tambah/upload/edit/hapus
 * =============================================
 */

// ============ STATE ============
let modalState = {
  mode: 'add', // 'add' | 'edit' | 'upload'
  idTrans: null,
  grade: null,
  idEviden: null
};

let hapusState = { idEviden: null, nama: null };
let selectedFile = null;

// ============ MODAL: EVIDEN (Tambah/Upload/Edit) ============
const ModalEviden = {

  // ---------- OPEN: Tambah ----------
  openTambah(idTrans, grade) {
    modalState = { mode: 'add', idTrans, grade, idEviden: null };

    document.getElementById('modalTitle').textContent = 'Tambah Item Lampiran';
    document.getElementById('modalGradeInfo').classList.remove('hidden');
    document.getElementById('modalGradeText').textContent = `Grade ${grade}`;
    document.getElementById('modalNama').value = '';
    document.getElementById('modalNama').readOnly = false;
    document.getElementById('modalFileGroup').classList.add('hidden');
    document.getElementById('modalSubmitBtn').textContent = 'Simpan';

    this.clearFile();
    this.show();
    setTimeout(() => document.getElementById('modalNama').focus(), 100);
  },

  // ---------- OPEN: Upload ----------
  openUpload(idEviden, nama) {
    modalState = { mode: 'upload', idTrans: null, grade: null, idEviden };

    document.getElementById('modalTitle').textContent = 'Upload Dokumen';
    document.getElementById('modalGradeInfo').classList.add('hidden');
    document.getElementById('modalNama').value = nama;
    document.getElementById('modalNama').readOnly = true;
    document.getElementById('modalFileGroup').classList.remove('hidden');
    document.getElementById('modalSubmitBtn').textContent = 'Upload';

    this.clearFile();
    this.show();
  },

  // ---------- OPEN: Edit ----------
  openEdit(idEviden, nama, link) {
    modalState = { mode: 'edit', idTrans: null, grade: null, idEviden };

    document.getElementById('modalTitle').textContent = 'Edit Item Lampiran';
    document.getElementById('modalGradeInfo').classList.add('hidden');
    document.getElementById('modalNama').value = nama;
    document.getElementById('modalNama').readOnly = false;
    document.getElementById('modalFileGroup').classList.remove('hidden');
    document.getElementById('modalSubmitBtn').textContent = 'Simpan Perubahan';

    this.clearFile();

    // Info file lama
    if (link) {
      const fileGroup = document.getElementById('modalFileGroup');
      let infoOld = document.getElementById('oldFileInfo');
      if (!infoOld) {
        infoOld = document.createElement('div');
        infoOld.id = 'oldFileInfo';
        infoOld.className = 'bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 mb-3';
        fileGroup.insertBefore(infoOld, fileGroup.querySelector('label'));
      }
      infoOld.innerHTML = `
        📎 File saat ini: <a href="${APP.esc(link)}" target="_blank" class="font-medium underline">Lihat</a>
        <div class="text-blue-500 mt-0.5">Upload file baru untuk menggantinya, atau biarkan kosong kalau tidak ingin mengubah.</div>
      `;
    }

    this.show();
  },

  // ---------- SUBMIT ----------
  async submit() {
    const nama = document.getElementById('modalNama').value.trim();
    const btn = document.getElementById('modalSubmitBtn');

    if (!nama) {
      alert('Nama dokumen wajib diisi');
      document.getElementById('modalNama').focus();
      return;
    }

    // Mode add
    if (modalState.mode === 'add') {
      await this.saveAdd(nama, btn);
      return;
    }

    // Mode upload
    if (modalState.mode === 'upload') {
      if (!selectedFile) {
        alert('Pilih file terlebih dahulu');
        return;
      }
      await this.doUpload(btn);
      return;
    }

    // Mode edit
    if (modalState.mode === 'edit') {
      if (selectedFile) {
        await this.doUpload(btn, nama);
      } else {
        await this.saveEditOnlyNama(nama, btn);
      }
      return;
    }
  },

  // ---------- Save: hanya nama ----------
  async saveAdd(nama, btn) {
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';
    try {
      await API.addEviden({
        id_trans: modalState.idTrans,
        grade: modalState.grade,
        nama_dokumen: nama,
        jenis: 'file',
        link: ''
      });
      this.close();
      if (typeof loadChecklist === 'function') loadChecklist();
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Simpan';
    }
  },

  // ---------- Save: edit nama saja (tanpa file baru) ----------
  async saveEditOnlyNama(nama, btn) {
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';
    try {
      await API.updateEviden({
        id_eviden: modalState.idEviden,
        nama_dokumen: nama
      });
      this.close();
      if (typeof loadChecklist === 'function') loadChecklist();
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Simpan Perubahan';
    }
  },

  // ---------- Upload file ----------
  async doUpload(btn, namaBaru) {
    if (!selectedFile) return;

    btn.disabled = true;
    btn.textContent = 'Mengunggah...';

    document.getElementById('uploadProgress').classList.remove('hidden');
    this.updateProgress(5);

    try {
      const base64 = await this.readAsBase64(selectedFile);
      this.updateProgress(20);

      const token = AUTH.getToken();
      const payload = {
        action: 'uploadEvidenFile',
        token,
        id_eviden: modalState.idEviden,
        file_name: selectedFile.name,
        mime_type: selectedFile.type || 'application/octet-stream',
        file_data: base64
      };

      this.updateProgress(30);

      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      this.updateProgress(80);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      this.updateProgress(90);

      // Kalau edit, update nama juga
      if (namaBaru && modalState.mode === 'edit') {
        await API.updateEviden({
          id_eviden: modalState.idEviden,
          nama_dokumen: namaBaru
        });
      }

      this.updateProgress(100);

      setTimeout(() => {
        this.close();
        if (typeof loadChecklist === 'function') loadChecklist();
      }, 300);

    } catch (err) {
      alert('Gagal upload: ' + err.message);
      document.getElementById('uploadProgress').classList.add('hidden');
      this.updateProgress(0);
    } finally {
      btn.disabled = false;
      btn.textContent = modalState.mode === 'edit' ? 'Simpan Perubahan' : 'Upload';
    }
  },

  // ---------- FILE HANDLING ----------
  setupFileInput() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', (e) => {
      if (e.target.closest('#filePreview button')) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-500', 'bg-blue-50/50');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50/50');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  },

  handleFileSelect(file) {
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('Ukuran file terlalu besar. Maksimal 25 MB.');
      return;
    }

    selectedFile = file;

    document.getElementById('dropZoneContent').classList.add('hidden');
    document.getElementById('filePreview').classList.remove('hidden');
    document.getElementById('fileNameText').textContent = file.name;
    document.getElementById('fileSizeText').textContent = this.formatFileSize(file.size);
  },

  clearFile(event) {
    if (event) event.stopPropagation();

    selectedFile = null;
    const fi = document.getElementById('fileInput');
    if (fi) fi.value = '';

    const preview = document.getElementById('filePreview');
    const content = document.getElementById('dropZoneContent');
    if (preview) preview.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    const prog = document.getElementById('uploadProgress');
    if (prog) prog.classList.add('hidden');
    this.updateProgress(0);

    const oldInfo = document.getElementById('oldFileInfo');
    if (oldInfo) oldInfo.remove();
  },

  readAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  },

  updateProgress(percent) {
    const bar = document.getElementById('progressBar');
    const txt = document.getElementById('progressText');
    if (bar) bar.style.width = percent + '%';
    if (txt) txt.textContent = percent + '%';
  },

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  },

  // ---------- SHOW / HIDE / CLOSE ----------
  show() {
    document.getElementById('modalEviden').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  hide() {
    document.getElementById('modalEviden').classList.add('hidden');
    document.body.style.overflow = '';
  },

  close() {
    this.hide();
    modalState = { mode: 'add', idTrans: null, grade: null, idEviden: null };
  }
};

// ============ MODAL: HAPUS ============
const ModalHapus = {
  open(idEviden, nama) {
    hapusState = { idEviden, nama };
    document.getElementById('hapusNamaText').textContent = nama;
    document.getElementById('modalHapus').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Reset tombol
    const btn = document.querySelector('#modalHapus button.btn-danger');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
        </svg>
        Ya, Hapus
      `;
    }
  },

  async confirm() {
    if (!hapusState.idEviden) return;

    const btn = document.querySelector('#modalHapus button.btn-danger');
    const idEviden = hapusState.idEviden;

    // ✅ 1. Loading state di tombol
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Menghapus...
      `;
    }

    try {
      // ✅ 2. Fade-out item sebelum hapus
      const itemEl = document.querySelector(`[data-id-trans="${idEviden}"]`);
      if (itemEl) {
        itemEl.style.transition = 'all 0.3s ease';
        itemEl.style.opacity = '0.5';
        itemEl.style.transform = 'scale(0.98)';
      }

      // API call
      await API.deleteEviden({ id_eviden: idEviden });

      // ✅ 3. Tutup modal + tampil toast
      this.close();
      showToast('Dokumen berhasil dihapus', 'success');

      // ✅ 4. Delay kecil biar user lihat animasi
      setTimeout(() => {
        if (typeof loadChecklist === 'function') {
          // Wrapper fade-out untuk konten
          const content = document.getElementById('pageContent');
          if (content) {
            content.style.transition = 'opacity 0.25s ease';
            content.style.opacity = '0.5';
          }

          setTimeout(() => {
            loadChecklist();
            // Restore opacity setelah load
            setTimeout(() => {
              if (content) content.style.opacity = '1';
            }, 100);
          }, 150);
        }
      }, 300);

    } catch (err) {
      // Restore item state
      const itemEl = document.querySelector(`[data-id-trans="${idEviden}"]`);
      if (itemEl) {
        itemEl.style.opacity = '1';
        itemEl.style.transform = 'scale(1)';
      }

      showToast('Gagal menghapus: ' + err.message, 'error');

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
          </svg>
          Ya, Hapus
        `;
      }
    }
  },

  close() {
    document.getElementById('modalHapus').classList.add('hidden');
    document.body.style.overflow = '';
    hapusState = { idEviden: null, nama: null };
  }
};

// ============ GLOBAL EVENT: ESC + Click overlay + Enter ============
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!document.getElementById('modalEviden').classList.contains('hidden')) ModalEviden.close();
    if (!document.getElementById('modalHapus').classList.contains('hidden')) ModalHapus.close();
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    if (e.target.id === 'modalEviden') ModalEviden.close();
    if (e.target.id === 'modalHapus') ModalHapus.close();
    if (e.target.id === 'modalPIC') ModalPIC.close();  // ← TAMBAH
  }
});

// Enter di nama
document.getElementById('modalNama').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    ModalEviden.submit();
  }
});

// Setup file input
ModalEviden.setupFileInput();

// ============ MODAL: SET PIC ============
const ModalPIC = {

  state: { idTrans: null },
  usersLoaded: false,

  async open(idTrans, picSekarang) {
    this.state.idTrans = idTrans;

    // Isi info
    document.getElementById('modalPICIdText').textContent = idTrans;
    document.getElementById('modalPICNama').value = picSekarang || '';
    document.getElementById('modalPICUser').value = '';

    // Load daftar user kalau belum
    if (!this.usersLoaded) {
      await this.loadUsers();
    }

    // Highlight user kalau cocok
    if (picSekarang) {
      const sel = document.getElementById('modalPICUser');
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === picSekarang) {
          sel.value = picSekarang;
          break;
        }
      }
    }

    document.getElementById('modalPIC').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('modalPICNama').focus(), 100);
  },

  async loadUsers() {
    try {
      const users = await API.get('getUsersList');
      const sel = document.getElementById('modalPICUser');

      // Simpan opsi pertama
      sel.innerHTML = '<option value="">— Pilih user —</option>';

      users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.nama;
        opt.textContent = `${u.nama} (${u.role}${u.kode_unit ? ' · ' + u.kode_unit : ''})`;
        opt.dataset.nama = u.nama;
        sel.appendChild(opt);
      });

      this.usersLoaded = true;
    } catch (e) {
      console.warn('Gagal load users:', e.message);
      // Biarkan dropdown kosong — user tetap bisa isi manual
    }
  },

  onUserSelect() {
    const sel = document.getElementById('modalPICUser');
    const nama = sel.value;
    if (nama) {
      document.getElementById('modalPICNama').value = nama;
    }
  },

  async submit() {
    const pic = document.getElementById('modalPICNama').value.trim();
    const btn = document.getElementById('modalPICSubmitBtn');

    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    try {
      await API.post('savePIC', {
        id_trans: this.state.idTrans,
        pic: pic
      });

      this.close();
      if (typeof loadChecklist === 'function') loadChecklist();
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Simpan';
    }
  },

  close() {
    document.getElementById('modalPIC').classList.add('hidden');
    document.body.style.overflow = '';
    this.state = { idTrans: null };
  }
};

window.ModalPIC = ModalPIC;

// Shortcut
function openModalPIC(idTrans, pic) {
  ModalPIC.open(idTrans, pic);
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'info', duration = 3000) {
  // Buat container toast kalau belum ada
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed bottom-6 right-6 z-[100] flex flex-col gap-2';
    document.body.appendChild(container);
  }

  // Pilih warna & icon berdasarkan type
  const config = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: `<svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
             </svg>`
    },
    error: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      icon: `<svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
             </svg>`
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: `<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
             </svg>`
    }
  }[type] || config?.info;

  // Buat elemen toast
  const toast = document.createElement('div');
  toast.className = `${config.bg} ${config.border} ${config.text} border rounded-xl shadow-lg p-4 flex items-center gap-3 min-w-[280px] max-w-md opacity-0 translate-x-8 transition-all duration-300`;
  toast.innerHTML = `
    <div class="shrink-0">${config.icon}</div>
    <div class="flex-1 text-sm font-medium">${APP.esc(message)}</div>
  `;

  container.appendChild(toast);

  // Trigger animasi masuk
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-x-8');
  });

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-8');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

window.showToast = showToast;

// Expose ke window
window.ModalEviden = ModalEviden;
window.ModalHapus = ModalHapus;

// ============ SHORTCUT untuk onclick di render ============
function openModalTambah(idTrans, grade) { ModalEviden.openTambah(idTrans, grade); }
function openModalUpload(idEviden, nama) { ModalEviden.openUpload(idEviden, nama); }
function openModalEdit(idEviden, nama, link) { ModalEviden.openEdit(idEviden, nama, link); }
function openModalHapus(idEviden, nama) { ModalHapus.open(idEviden, nama); }
