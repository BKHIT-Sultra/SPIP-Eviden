/**
 * API WRAPPER — semua komunikasi ke Apps Script
 */

const API = {
  /**
   * GET request
   */
  async get(action, params = {}) {
    const url = new URL(CONFIG.API_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      }
    });

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  /**
   * POST request
   */
  async post(action, payload = {}) {
    const token = AUTH.getToken();
    const body = { action, token, ...payload };

    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  // ===== Endpoint spesifik =====

  ping()                          { return this.get('ping'); },
  getDashboard(unit, periode)     { return this.get('getDashboard', { kode_unit: unit, periode }); },
  getChecklist(unit, periode, kk) { return this.get('getChecklist', { kode_unit: unit, periode, kode_kk: kk }); },
  getDetail(idTrans)              { return this.get('getDetail', { id_trans: idTrans }); },
  
  // ✅ UBAH BARIS INI — tambahkan parameter grade
  getUploadLink(idTrans, grade)   { return this.get('getUploadLink', { id_trans: idTrans, grade: grade }); },
  
  getUnits()                      { return this.get('getUnits'); },
  getPeriodes()                   { return this.get('getPeriodes'); },

  saveStatus(payload)    { return this.post('saveStatus', payload); },
  saveUraian(payload)    { return this.post('saveUraian', payload); },
  addEviden(payload)     { return this.post('addEviden', payload); },
  updateEviden(payload)  { return this.post('updateEviden', payload); },
  deleteEviden(payload)  { return this.post('deleteEviden', payload); },
  verifyEviden(payload)  { return this.post('verifyEviden', payload); },
  syncFolder(payload)    { return this.post('syncFolder', payload); }
};

window.API = API;
