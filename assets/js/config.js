/**
 * KONFIGURASI FRONTEND
 * Ganti nilai di bawah sesuai environment Anda
 */

const CONFIG = {
  // URL Web App Apps Script (hasil deploy)
  API_URL: 'https://script.google.com/macros/s/AKfycbwCLRSj2CR-NYUuCG6nQqF8Cg9HUV9YMA1Ct3bpkxsWsO8flJ0rJwwuBRLQFrFWhIC5YQ/exec',

  // Google OAuth Client ID
  GOOGLE_CLIENT_ID: 'XXXXX.apps.googleusercontent.com',

  // Nama aplikasi
  APP_NAME: 'Checklist SPIP',
  APP_VERSION: '1.0'
};

// Simpan ke window biar bisa diakses dari file lain
window.CONFIG = CONFIG;
