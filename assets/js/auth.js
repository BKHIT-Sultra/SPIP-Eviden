const AUTH = {
  isLoggedIn() {
    const token = this.getToken();
    const user = this.getUser();
    if (!token || !user) return false;

    // Cek expiry kalau disimpan
    const exp = localStorage.getItem('spip_expires');
    if (exp && new Date(exp) < new Date()) {
      this.logout();
      return false;
    }
    return true;
  },

  getUser() {
    const raw = localStorage.getItem('spip_user');
    return raw ? JSON.parse(raw) : null;
  },

  saveUser(user, token, expiresAt) {
    localStorage.setItem('spip_user', JSON.stringify(user));
    localStorage.setItem('spip_token', token);
    if (expiresAt) localStorage.setItem('spip_expires', expiresAt);
  },

  logout() {
    const token = this.getToken();
    // Fire-and-forget revoke
    if (token) {
      fetch(CONFIG.API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'logout', token }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      }).catch(() => {});
    }
    localStorage.removeItem('spip_user');
    localStorage.removeItem('spip_token');
    localStorage.removeItem('spip_expires');
    window.location.href = 'index.html';
  },

  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  getToken() {
    return localStorage.getItem('spip_token');
  }
};

window.AUTH = AUTH;
