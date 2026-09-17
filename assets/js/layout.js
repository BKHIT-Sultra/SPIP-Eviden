/**
 * LAYOUT — Sidebar & Topbar
 */

const LAYOUT = {
  render(active) {
    const user = AUTH.getUser();
    const initials = user
      ? user.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'U';

    const menus = [
      { key: 'dashboard',  href: 'dashboard.html',  label: 'Dashboard',   icon: 'grid' },
      { key: 'checklist',  href: 'checklist.html',  label: 'Checklist',   icon: 'check' },
      { key: 'verifikasi', href: 'verifikasi.html', label: 'Verifikasi',  icon: 'shield' },
      { key: 'profil',     href: 'profil.html',     label: 'Profil',      icon: 'user' }
    ];

    const icons = {
      'grid':   '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>',
      'check':  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>',
      'shield': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
      'user':   '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>'
    };

    const menuHtml = menus.map(m => `
      <a href="${m.href}" class="sidebar-nav-item ${m.key === active ? 'active' : ''}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons[m.icon]}</svg>
        <span class="nav-label">${m.label}</span>
      </a>
    `).join('');

    // Bersihkan body — HAPUS class login-bg
    document.body.className = 'bg-slate-100';

    document.body.innerHTML = `
      <aside id="sidebar" class="sidebar">
        <div class="flex items-center gap-3 px-5 py-6 border-b border-white/10">
          <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <span class="text-xl">📋</span>
          </div>
          <div class="nav-label">
            <div class="text-white font-bold leading-tight">SPIP Eviden</div>
            <div class="text-blue-200 text-xs">v${CONFIG.APP_VERSION}</div>
          </div>
        </div>

        <nav class="py-4">${menuHtml}</nav>

        <div class="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition">
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

      <div class="main-content" id="mainContent">
        <header class="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div class="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <button onclick="LAYOUT.toggleSidebar()" class="btn btn-ghost p-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
              <div>
                <h1 id="pageTitle" class="text-lg font-bold text-slate-800">
                  ${active ? active[0].toUpperCase() + active.slice(1) : ''}
                </h1>
                <p id="pageSubtitle" class="text-xs text-slate-500"></p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="AUTH.logout()" class="btn btn-ghost text-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </header>
        <main id="pageContent" class="p-4 md:p-6"></main>
      </div>
    `;
  },

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

  setTitle(title, subtitle) {
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = subtitle || '';
  },

  content() {
    return document.getElementById('pageContent');
  }
};

window.LAYOUT = LAYOUT;
