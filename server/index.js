const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const escrow = require('./escrow');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '64kb' }));
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // API Endpoints
  app.get('/api/services', (req, res) => {
    res.json(escrow.getServices());
  });

  app.get('/api/pools', (req, res) => {
    res.json(escrow.getAllPools());
  });

  app.get('/api/metrics', (req, res) => {
    res.json(escrow.getMetrics());
  });

  app.post('/api/pools', (req, res) => {
    try {
      const newPool = escrow.createPool(req.body || {});
      res.status(201).json(newPool);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/pools/:id/join', (req, res) => {
    try {
      const result = escrow.joinSlot(req.params.id, req.body || {});
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/pools/:id/confirm', (req, res) => {
    try {
      const body = req.body || {};
      const result = escrow.confirmSlotDelivery(req.params.id, body.memberId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/pools/:id/dispute', (req, res) => {
    try {
      const body = req.body || {};
      const result = escrow.disputeSlot(req.params.id, body.memberId, body.reason);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', app: 'SubRelay Escrow Engine', ...escrow.getMetrics() });
  });

  // Serve frontend in production
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));

  return app;
}

if (require.main === module) {
  const PORT = process.env.PORT || 4001;
  const server = http.createServer(createApp());
  server.listen(PORT, () => {
    console.log(`[SubRelay] Backend running on port ${PORT}`);
  });
  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { createApp };
