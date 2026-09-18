/**
 * ============================================
 * LAYOUT — Sidebar & Topbar
 * ============================================
 */

const LAYOUT = {
  render(active) {
    const user = AUTH.getUser();
    const initials = user
      ? user.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'U';

    // ============ MENU ============
    const menus = [
      { key: 'dashboard', href: 'dashboard.html', label: 'Dashboard',  icon: 'grid' },
      { key: 'kklead1',   href: 'kklead-1.html',  label: 'KKLEAD I',   icon: 'target', sub: 'Penetapan Tujuan' },
      { key: 'kklead2',   href: 'checklist.html', label: 'KKLEAD II',  icon: 'check',  sub: 'Struktur & Proses' },
      { key: 'kklead3',   href: 'kklead-3.html',  label: 'KKLEAD III', icon: 'award',  sub: 'Pencapaian Tujuan' },
      { key: 'profil',    href: 'profil.html',    label: 'Profil',     icon: 'user' }
    ];

    // ============ ICONS ============
    const icons = {
      'grid':   '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>',
      'target': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      'check':  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>',
      'award':  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>',
      'user':   '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>'
    };

    // ============ MENU HTML ============
    const menuHtml = menus.map(m => `
      <a href="${m.href}" class="sidebar-nav-item ${m.key === active ? 'active' : ''}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             style="width:20px;height:20px;max-width:20px;max-height:20px;flex-shrink:0;">
          ${icons[m.icon]}
        </svg>
        <div class="nav-label flex-1 min-w-0">
          <div class="font-medium">${m.label}</div>
          ${m.sub ? `<div class="text-xs opacity-70 truncate">${m.sub}</div>` : ''}
        </div>
      </a>
    `).join('');

    // ============ BERSIHKAN BODY ============
    document.body.className = 'bg-slate-100';

    // ============ RENDER LAYOUT ============
    document.body.innerHTML = `
      <aside id="sidebar" class="sidebar">

        <!-- HEADER SIDEBAR — Logo + Nama Aplikasi -->
        <div class="flex items-center gap-3 px-5 py-6 border-b border-white/10">

          <!-- Logo mini morphing blob -->
          <div class="sidebar-logo shrink-0"
               style="position:relative;width:40px;height:40px;flex-shrink:0;">
            <div class="sidebar-logo-outer"></div>
            <div class="sidebar-logo-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff"
                   stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
                   style="width:20px;height:20px;max-width:20px;max-height:20px;flex-shrink:0;">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
          </div>

          <!-- Nama aplikasi -->
          <div class="nav-label">
            <div class="text-white font-bold leading-tight">SPIP Eviden</div>
            <div class="text-blue-200 text-xs">v${CONFIG.APP_VERSION}</div>
          </div>
        </div>

        <!-- MENU NAVIGASI -->
        <nav class="py-4">${menuHtml}</nav>

        <!-- USER CARD (bawah) -->
        <div class="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition cursor-pointer">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              ${initials}
            </div>
            <div class="nav-label flex-1 min-w-0">
              <div class="text-white text-sm font-medium truncate">${user ? user.nama : '-'}</div>
              <div class="text-blue-200 text-xs truncate">${user ? user.role : '-'}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <div class="main-content" id="mainContent">

        <!-- TOPBAR -->
        <header class="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div class="px-4 md:px-6 py-3 flex items-center justify-between gap-4">

            <!-- Kiri: Toggle + Judul -->
            <div class="flex items-center gap-3">
              <button onclick="LAYOUT.toggleSidebar()" class="btn btn-ghost p-2" title="Toggle Sidebar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     style="width:20px;height:20px;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
              <div>
                <h1 id="pageTitle" class="text-lg font-bold text-slate-800">
                  ${active ? active[0].toUpperCase() + active.slice(1) : ''}
                </h1>
                <p id="pageSubtitle" class="text-xs text-slate-500"></p>
              </div>
            </div>

            <!-- Kanan: Logout -->
            <div class="flex items-center gap-2">
              <button onclick="konfirmasiLogout()"
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                             text-blue-700 bg-white border-2 border-blue-200
                             hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800
                             active:scale-95 transition-all duration-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                     style="width:16px;height:16px;max-width:16px;max-height:16px;flex-shrink:0;">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </header>

        <!-- KONTEN HALAMAN -->
        <main id="pageContent" class="p-4 md:p-6"></main>
      </div>
    `;
  },

  /**
   * Toggle collapse sidebar (desktop) atau slide (mobile)
   */
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('mainContent');

    if (window.innerWidth < 768) {
      sidebar.classList.toggle('mobile-open');
    } else {
      sidebar.classList.toggle('collapsed');
      main.classList.toggle('collapsed');
    }
  },

  /**
   * Set judul & subjudul halaman
   */
  setTitle(title, subtitle) {
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = subtitle || '';
  },

  /**
   * Dapatkan container konten
   */
  content() {
    return document.getElementById('pageContent');
  }
};
function konfirmasiLogout() {
  if (confirm('Yakin ingin keluar dari aplikasi?')) {
    AUTH.logout();
  }
}

window.LAYOUT = LAYOUT;

