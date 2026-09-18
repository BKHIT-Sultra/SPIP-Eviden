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
  },

  async confirm() {
    if (!hapusState.idEviden) return;
    try {
      await API.deleteEviden({ id_eviden: hapusState.idEviden });
      this.close();
      if (typeof loadChecklist === 'function') loadChecklist();
    } catch (err) {
      alert('Gagal: ' + err.message);
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

// Expose ke window
window.ModalEviden = ModalEviden;
window.ModalHapus = ModalHapus;

// ============ SHORTCUT untuk onclick di render ============
function openModalTambah(idTrans, grade) { ModalEviden.openTambah(idTrans, grade); }
function openModalUpload(idEviden, nama) { ModalEviden.openUpload(idEviden, nama); }
function openModalEdit(idEviden, nama, link) { ModalEviden.openEdit(idEviden, nama, link); }
function openModalHapus(idEviden, nama) { ModalHapus.open(idEviden, nama); }
