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
