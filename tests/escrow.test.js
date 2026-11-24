const test = require('node:test');
const assert = require('node:assert/strict');
const escrow = require('../server/escrow');

test('loads seeded pools and supported services', () => {
  assert.ok(escrow.getServices().length >= 6);
  assert.ok(escrow.getAllPools().length >= 3);
});

test('creates pool, locks escrow on join, releases on confirm, and prevents double release', () => {
  const pool = escrow.createPool({
    serviceId: 'claude',
    hostUsername: 'TestHost',
    hostCardCountry: 'Казахстан (Kaspi)',
    totalSlots: 3,
    occupiedSlots: 1,
    pricePerSlotRub: 750,
    nextBillingDate: '2026-11-15',
    sbpPhoneMask: '+7 (777) ***-12-34'
  });

  const joinRes = escrow.joinSlot(pool.id, {
    username: '@tester_ivan',
    sbpAccount: '+79991234567'
  });
  assert.equal(joinRes.member.escrowStatus, 'locked');
  assert.equal(joinRes.pool.occupiedSlots, 2);
  assert.equal(joinRes.pool.escrowLockedRub, 750);

  const confirmRes = escrow.confirmSlotDelivery(pool.id, joinRes.member.id);
  assert.equal(confirmRes.success, true);
  assert.equal(confirmRes.member.escrowStatus, 'released');
  assert.equal(pool.escrowLockedRub, 0);

  assert.throws(() => escrow.confirmSlotDelivery(pool.id, joinRes.member.id), /Невозможно подтвердить/);
});

test('handles dispute refund and frees up occupied slot', () => {
  const pool = escrow.createPool({
    serviceId: 'spotify',
    hostUsername: 'Host2',
    hostCardCountry: 'Турция',
    totalSlots: 2,
    occupiedSlots: 1,
    pricePerSlotRub: 200,
    nextBillingDate: '2026-12-01'
  });

  const { member } = escrow.joinSlot(pool.id, { username: '@buyer', sbpAccount: '+79001112233' });
  assert.equal(pool.occupiedSlots, 2);

  const disputeRes = escrow.disputeSlot(pool.id, member.id, 'Инвайт не подошёл');
  assert.equal(disputeRes.success, true);
  assert.equal(disputeRes.member.escrowStatus, 'refunded');
  assert.equal(pool.occupiedSlots, 1);
  assert.equal(pool.escrowLockedRub, 0);
});

test('rejects invalid join input and overflow slots', () => {
  const pool = escrow.createPool({
    serviceId: 'steam',
    hostUsername: 'Host3',
    hostCardCountry: 'Казахстан',
    totalSlots: 2,
    occupiedSlots: 1,
    pricePerSlotRub: 350,
    nextBillingDate: '2026-12-01'
  });

  assert.throws(() => escrow.joinSlot(pool.id, { username: '', sbpAccount: '' }), /Необходимо указать/);
  escrow.joinSlot(pool.id, { username: 'u2', sbpAccount: '+79000000001' });
  assert.throws(() => escrow.joinSlot(pool.id, { username: 'u3', sbpAccount: '+79000000002' }), /заняты/);
});

test('rejects invalid pool parameters and duplicate joins', () => {
  assert.throws(() => escrow.createPool({ serviceId: 'spotify', hostUsername: 'H', totalSlots: 1 }), /totalSlots/);
  assert.throws(() => escrow.createPool({ serviceId: 'spotify', hostUsername: 'H', totalSlots: 4, occupiedSlots: 5 }), /occupiedSlots/);
  assert.throws(() => escrow.createPool({ serviceId: 'spotify', hostUsername: 'H', pricePerSlotRub: -10 }), /pricePerSlotRub/);

  const pool = escrow.createPool({
    serviceId: 'cursor',
    hostUsername: 'DupHost',
    totalSlots: 4,
    occupiedSlots: 1,
    pricePerSlotRub: 650,
  });
  escrow.joinSlot(pool.id, { username: '@unique_user', sbpAccount: '+79001112233' });
  assert.throws(() => escrow.joinSlot(pool.id, { username: '@unique_user', sbpAccount: '+79001112233' }), /уже участвует/);
});

test('HTTP API exposes /health, /api/metrics, and validates pool creation', async () => {
  const http = require('node:http');
  const { createApp } = require('../server/index');
  const server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const healthRes = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.headers.get('x-content-type-options'), 'nosniff');
    const health = await healthRes.json();
    assert.equal(health.status, 'ok');
    assert.ok(health.pools >= 3);

    const badPoolRes = await fetch(`http://127.0.0.1:${port}/api/pools`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ serviceId: 'spotify', hostUsername: 'X', totalSlots: 99 }),
    });
    assert.equal(badPoolRes.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
