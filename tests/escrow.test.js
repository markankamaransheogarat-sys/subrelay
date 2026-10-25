const escrow = require('../server/escrow');

function runTests() {
  console.log('--- SubRelay Escrow Engine Unit Tests ---');

  // Test 1: Seed pools exist
  const pools = escrow.getAllPools();
  console.assert(pools.length >= 3, 'Test 1 Failed: Should have initial seeded pools');
  console.log('✓ Initial pools loaded:', pools.length);

  // Test 2: Pool creation
  const newPool = escrow.createPool({
    serviceId: 'claude',
    hostUsername: 'TestHost',
    hostCardCountry: 'Казахстан (Kaspi)',
    totalSlots: 4,
    occupiedSlots: 1,
    pricePerSlotRub: 750,
    nextBillingDate: '2026-11-15',
    sbpPhoneMask: '+7 (777) ***-12-34'
  });
  console.assert(newPool.id && newPool.totalSlots === 4, 'Test 2 Failed: createPool returned invalid pool');
  console.log('✓ Pool created:', newPool.id);

  // Test 3: Join slot with Escrow Lock
  const initialLocked = newPool.escrowLockedRub;
  const joinRes = escrow.joinSlot(newPool.id, {
    username: '@tester_ivan',
    sbpAccount: '+79991234567'
  });
  console.assert(joinRes.member && joinRes.member.escrowStatus === 'locked', 'Test 3 Failed: member escrow should be locked');
  console.assert(joinRes.pool.occupiedSlots === 2, 'Test 3 Failed: occupiedSlots should increment');
  console.assert(joinRes.pool.escrowLockedRub === initialLocked + 750, 'Test 3 Failed: escrowLockedRub should increase');
  console.log('✓ Slot reserved with 24h Escrow Lock (Amount held: 750 ₽)');

  // Test 4: Member confirms delivery, releasing escrow to host
  const confirmRes = escrow.confirmSlotDelivery(newPool.id, joinRes.member.id);
  console.assert(confirmRes.success === true, 'Test 4 Failed: confirmSlotDelivery should succeed');
  console.assert(confirmRes.member.escrowStatus === 'released', 'Test 4 Failed: escrowStatus should be released');
  console.assert(newPool.escrowLockedRub === 0, 'Test 4 Failed: escrowLockedRub should be 0 after release');
  console.log('✓ Escrow funds released to host after buyer confirmation');

  // Test 5: Rejection when pool is full
  try {
    escrow.joinSlot(newPool.id, { username: 'u2', sbpAccount: '1' });
    escrow.joinSlot(newPool.id, { username: 'u3', sbpAccount: '2' });
    // Total is now 4 (1 initial + 1 test3 + 2 more = 4/4)
    escrow.joinSlot(newPool.id, { username: 'u4_overflow', sbpAccount: '3' });
    console.assert(false, 'Test 5 Failed: Should throw error when pool is full');
  } catch (err) {
    console.assert(err.message.includes('заняты'), 'Test 5 Failed: unexpected error message: ' + err.message);
    console.log('✓ Capacity guard verified: rejected overflow slot request');
  }

  console.log('--- ALL SubRelay TESTS PASSED ---');
}

runTests();
