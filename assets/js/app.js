/**
 * UTILS UMUM
 */

const APP = {
  /**
   * Format tanggal
   */
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

  /**
   * Format tanggal + waktu
   */
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

  /**
   * Badge warna untuk status
   */
  statusClass(status) {
    return {
      'Belum':      'bg-gray-100 text-gray-700 border-gray-300',
      'Proses':     'bg-blue-100 text-blue-700 border-blue-300',
      'Upload':     'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Verifikasi': 'bg-purple-100 text-purple-700 border-purple-300',
      'Selesai':    'bg-green-100 text-green-700 border-green-300',
      'Revisi':     'bg-red-100 text-red-700 border-red-300'
    }[status] || 'bg-gray-100 text-gray-700';
  },

  /**
   * Badge warna untuk grade
   */
  gradeClass(grade) {
    return {
      'A': 'bg-green-100 text-green-700 border-green-300',
      'B': 'bg-blue-100 text-blue-700 border-blue-300',
      'C': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'D': 'bg-orange-100 text-orange-700 border-orange-300',
      'E': 'bg-red-100 text-red-700 border-red-300'
    }[grade] || 'bg-gray-100 text-gray-700';
  },

  /**
   * Escape HTML
   */
  esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  /**
   * Render navbar
   */
  renderNavbar(active) {
    const user = AUTH.getUser();
    const initials = user ? user.nama.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U';

    const menus = [
      { href: 'dashboard.html', label: 'Dashboard', key: 'dashboard' },
      { href: 'checklist.html', label: 'Checklist', key: 'checklist' },
      { href: 'verifikasi.html', label: 'Verifikasi', key: 'verifikasi' }
    ];

    const menuHtml = menus.map(m =>
      `<a href="${m.href}" class="${
        m.key === active
          ? 'font-medium border-b-2 border-white pb-0.5'
          : 'text-blue-100 hover:text-white'
      }">${m.label}</a>`
    ).join('');

    return `
      <nav class="bg-blue-800 text-white shadow-lg sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="font-semibold">📋 ${CONFIG.APP_NAME}</span>
          </div>
          <div class="hidden md:flex items-center gap-6 text-sm">
            ${menuHtml}
          </div>
          <div class="flex items-center gap-3">
            <span class="hidden sm:block text-sm text-blue-100">${user ? user.nama : ''}</span>
            <div class="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              ${initials}
            </div>
            <button onclick="AUTH.logout()" class="text-xs text-blue-200 hover:text-white">Logout</button>
          </div>
        </div>
      </nav>
    `;
  },

  /**
   * Loading state
   */
  showLoading(el, message = 'Memuat...') {
    el.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="mt-3 text-sm text-gray-500">${message}</p>
        </div>
      </div>
    `;
  },

  /**
   * Error state
   */
  showError(el, message) {
    el.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div class="text-red-600 font-medium">Terjadi kesalahan</div>
        <div class="text-sm text-red-500 mt-1">${this.esc(message)}</div>
        <button onclick="location.reload()" class="mt-3 text-xs bg-red-600 text-white px-4 py-2 rounded-lg">
          Coba Lagi
        </button>
      </div>
    `;
  }
};

window.APP = APP;

APP.loadingBox = function(message = 'Memuat...') {
  return `
    <div class="card p-12 flex flex-col items-center justify-center">
      <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-4 text-sm text-slate-500">${message}</p>
    </div>
  `;
};

APP.errorBox = function(message) {
  return `
    <div class="card p-8 text-center">
      <div class="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <div class="font-semibold text-slate-800 mb-1">Terjadi Kesalahan</div>
      <p class="text-sm text-slate-500 mb-4">${APP.esc(message)}</p>
      <button onclick="location.reload()" class="btn btn-primary text-sm">Coba Lagi</button>
    </div>
  `;
};

APP.statusClass = function(status) {
  return {
    'Belum':      'badge badge-belum',
    'Proses':     'badge badge-proses',
    'Upload':     'badge badge-upload',
    'Verifikasi': 'badge badge-verifikasi',
    'Selesai':    'badge badge-selesai',
    'Revisi':     'badge badge-revisi'
  }[status] || 'badge badge-belum';
};

APP.gradeClass = function(grade) {
  return `badge badge-${grade}`;
};
