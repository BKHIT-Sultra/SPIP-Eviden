/**
 * UTILS UMUM
 */

const APP = {
  formatDate(d) {
    if (!d) return '-';
    try {
      const date = new Date(d);
      if (isNaN(date)) return String(d);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch (e) { return String(d); }
  },

  formatDateTime(d) {
    if (!d) return '-';
    try {
      const date = new Date(d);
      if (isNaN(date)) return String(d);
      return date.toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return String(d); }
  },

  esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  statusClass(status) {
    return {
      'Belum':      'badge badge-belum',
      'Proses':     'badge badge-proses',
      'Upload':     'badge badge-upload',
      'Verifikasi': 'badge badge-verifikasi',
      'Selesai':    'badge badge-selesai',
      'Revisi':     'badge badge-revisi'
    }[status] || 'badge badge-belum';
  },

  gradeClass(grade) {
    return `badge badge-${grade}`;
  },

  loadingBox(message = 'Memuat...') {
    return `
      <div class="card p-12 flex flex-col items-center justify-center">
        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-sm text-slate-500">${message}</p>
      </div>
    `;
  },

  errorBox(message) {
    return `
      <div class="card p-8 text-center">
        <div class="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div class="font-semibold text-slate-800 mb-1">Terjadi Kesalahan</div>
        <p class="text-sm text-slate-500 mb-4">${this.esc(message)}</p>
        <button onclick="location.reload()" class="btn btn-primary text-sm">Coba Lagi</button>
      </div>
    `;
  }
};

window.APP = APP;
