const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Fallback data (quiet defaults shown if live fetch fails)
const fallbackData = {
  SENSEX: { symbol: 'SENSEX', price: 75000, change: 120, percentChange: 0.16 },
  NIFTY: { symbol: 'NIFTY', price: 22500, change: 45, percentChange: 0.2 },
  BANKNIFTY: { symbol: 'BANKNIFTY', price: 49500, change: 75, percentChange: 0.15 },
  NIFTYIT: { symbol: 'NIFTYIT', price: 35500, change: 100, percentChange: 0.28 }
};

function toYahooSym(sym) {
  const s = String(sym).toUpperCase();
  switch (s) {
    case 'SENSEX': return '^BSESN';
    case 'NIFTY': return '^NSEI';
    case 'BANKNIFTY': return '^NSEBANK';
    case 'NIFTYIT': return '^CNXIT';
    default: return s;
  }
}

app.get('/api/indices', async (req, res) => {
  const qs = (req.query.symbols || 'SENSEX,NIFTY,BANKNIFTY,NIFTYIT').split(',').map(s=>s.trim()).filter(Boolean);
  const yahooSymbols = qs.map(toYahooSym).join(',');

  try {
    const resp = await axios.get('https://query1.finance.yahoo.com/v7/finance/quote', {
      params: { symbols: yahooSymbols },
      timeout: 10000
    });

    const quotes = (resp.data && resp.data.quoteResponse && resp.data.quoteResponse.result) ? resp.data.quoteResponse.result : [];
    const results = {};

    qs.forEach(sym => {
      const y = toYahooSym(sym);
      let quote = quotes.find(q => String(q.symbol).toUpperCase() === String(y).toUpperCase())
               || quotes.find(q => String(q.symbol).toUpperCase() === y.replace(/^\^/,'').toUpperCase());

      if (quote && typeof quote.regularMarketPrice !== 'undefined') {
        results[sym.toUpperCase()] = {
          symbol: sym.toUpperCase(),
          price: quote.regularMarketPrice,
          change: (typeof quote.regularMarketChange === 'number') ? quote.regularMarketChange : 0,
          percentChange: (typeof quote.regularMarketChangePercent === 'number') ? quote.regularMarketChangePercent : 0
        };
      } else {
        results[sym.toUpperCase()] = fallbackData[sym.toUpperCase()] || { symbol: sym.toUpperCase(), price: null, change: 0, percentChange: 0 };
      }
    });

    res.json({ data: results });
  } catch (err) {
    console.error('Error fetching indices:', err && err.message ? err.message : err);
    const results = {};
    qs.forEach(sym => {
      results[sym.toUpperCase()] = fallbackData[sym.toUpperCase()] || { symbol: sym.toUpperCase(), price: null, change: 0, percentChange: 0 };
    });
    res.json({ data: results, note: 'fallback' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
