const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const escrow = require('./escrow');

const app = express();
app.use(cors());
app.use(express.json());

// API Endpoints
app.get('/api/services', (req, res) => {
  res.json(escrow.getServices());
});

app.get('/api/pools', (req, res) => {
  res.json(escrow.getAllPools());
});

app.post('/api/pools', (req, res) => {
  try {
    const newPool = escrow.createPool(req.body);
    res.status(201).json(newPool);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/pools/:id/join', (req, res) => {
  try {
    const result = escrow.joinSlot(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/pools/:id/confirm', (req, res) => {
  try {
    const result = escrow.confirmSlotDelivery(req.params.id, req.body.memberId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'SubRelay Escrow Engine' });
});

// Serve frontend in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

const PORT = process.env.PORT || 4001;
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`[SubRelay] Backend running on port ${PORT}`);
});
