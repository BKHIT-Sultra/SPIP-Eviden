/**
 * AUTH HELPER — Google Sign-In
 */

const AUTH = {
  /**
   * Cek apakah user sudah login
   */
  isLoggedIn() {
    return !!localStorage.getItem('spip_user');
  },

  /**
   * Ambil user yang login
   */
  getUser() {
    const raw = localStorage.getItem('spip_user');
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * Simpan user + token
   */
  saveUser(user, token) {
    localStorage.setItem('spip_user', JSON.stringify(user));
    localStorage.setItem('spip_token', token);
  },

  /**
   * Logout
   */
  logout() {
    localStorage.removeItem('spip_user');
    localStorage.removeItem('spip_token');
    window.location.href = 'index.html';
  },

  /**
   * Cek login, kalau belum redirect ke index
   */
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  /**
   * Ambil token
   */
  getToken() {
    return localStorage.getItem('spip_token');
  },

  /**
   * Handle response Google Sign-In
   */
  async handleCredential(response) {
    try {
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          token: response.credential
        }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await res.json();

      if (data.success) {
        AUTH.saveUser(data.data.user, data.data.session);
        window.location.href = 'dashboard.html';
      } else {
        alert('Login gagal: ' + data.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }
};

window.AUTH = AUTH;
