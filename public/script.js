const SYMBOLS = ['SENSEX','NIFTY','BANKNIFTY','NIFTYIT'];
const API = '/api/indices';

async function fetchIndices(){
  try {
    const res = await fetch(API + '?symbols=' + SYMBOLS.join(','));
    const json = await res.json();
    const data = json && json.data ? json.data : {};
    const now = new Date();
    SYMBOLS.forEach(sym => {
      const el = document.getElementById(sym);
      const meta = document.getElementById(sym + '-meta');
      if (!el) return;
      const info = data[sym] || {};
      const price = (typeof info.price === 'number') ? info.price.toLocaleString('en-IN',{maximumFractionDigits:2}) : (info.price || '—');
      el.textContent = price;
      if (meta){
        meta.textContent = info.price ? ('Updated: ' + now.toLocaleTimeString()) : '';
      }
    });
    const status = document.getElementById('status');
    if (status) status.textContent = 'Last checked: ' + now.toLocaleTimeString();
  } catch (err) {
    console.error('FetchIndices error:', err && err.message ? err.message : err);
    const status = document.getElementById('status');
    if (status) status.textContent = 'Last checked: ' + new Date().toLocaleTimeString();
  }
}

fetchIndices();
setInterval(fetchIndices, 120000);
