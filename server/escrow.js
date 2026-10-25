/**
 * SubRelay Escrow & Slot Manager Engine
 * Manages family plan slots, SBP transfers, renewal cycles, and dispute time-locks.
 */

class EscrowPool {
  constructor() {
    this.pools = new Map();
    this.subscriptions = [
      { id: 'spotify', name: 'Spotify Family (6 слотов)', totalSlots: 6, pricePerSlotRub: 180, region: 'Турция / Казахстан', periodDays: 30 },
      { id: 'youtube', name: 'YouTube Premium Family (5 слотов)', totalSlots: 5, pricePerSlotRub: 220, region: 'Турция / Украина', periodDays: 30 },
      { id: 'steam', name: 'Steam Family Sharing (4 слота)', totalSlots: 4, pricePerSlotRub: 350, region: 'Казахстан', periodDays: 30 },
      { id: 'claude', name: 'Claude Pro Team (Shared API/Seat)', totalSlots: 3, pricePerSlotRub: 890, region: 'США / ЕС', periodDays: 30 },
      { id: 'cursor', name: 'Cursor AI Pro Team', totalSlots: 4, pricePerSlotRub: 650, region: 'Global', periodDays: 30 },
      { id: 'midjourney', name: 'Midjourney Standard', totalSlots: 3, pricePerSlotRub: 950, region: 'Global', periodDays: 30 },
    ];
    this.initDefaultPools();
  }

  initDefaultPools() {
    this.createPool({
      id: 'pool-spot-1',
      serviceId: 'spotify',
      hostUsername: 'Rustam_Almaty',
      hostCardCountry: 'Казахстан (Kaspi Bank)',
      totalSlots: 6,
      occupiedSlots: 4,
      pricePerSlotRub: 180,
      nextBillingDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'active',
      sbpPhoneMask: '+7 (701) ***-44-12',
    });

    this.createPool({
      id: 'pool-claude-1',
      serviceId: 'claude',
      hostUsername: 'Alex_Quant',
      hostCardCountry: 'США (Mercury Bank)',
      totalSlots: 3,
      occupiedSlots: 2,
      pricePerSlotRub: 890,
      nextBillingDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
      status: 'active',
      sbpPhoneMask: '+7 (916) ***-88-90',
    });

    this.createPool({
      id: 'pool-steam-1',
      serviceId: 'steam',
      hostUsername: 'Denis_Astana',
      hostCardCountry: 'Казахстан (Halyk)',
      totalSlots: 4,
      occupiedSlots: 1,
      pricePerSlotRub: 350,
      nextBillingDate: new Date(Date.now() + 27 * 86400000).toISOString().split('T')[0],
      status: 'active',
      sbpPhoneMask: '+7 (707) ***-11-22',
    });
  }

  getServices() {
    return this.subscriptions;
  }

  getAllPools() {
    return Array.from(this.pools.values());
  }

  getPool(id) {
    return this.pools.get(id);
  }

  createPool(data) {
    const pool = {
      id: data.id || `pool-${Date.now().toString(36)}`,
      serviceId: data.serviceId,
      hostUsername: data.hostUsername,
      hostCardCountry: data.hostCardCountry,
      totalSlots: Number(data.totalSlots) || 4,
      occupiedSlots: Number(data.occupiedSlots) || 1,
      pricePerSlotRub: Number(data.pricePerSlotRub) || 200,
      nextBillingDate: data.nextBillingDate,
      status: data.status || 'active',
      sbpPhoneMask: data.sbpPhoneMask || '+7 (9**) ***-**-**',
      members: data.members || [],
      escrowLockedRub: 0,
    };
    this.pools.set(pool.id, pool);
    return pool;
  }

  joinSlot(poolId, { username, sbpAccount }) {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Пул подписки не найден');
    if (pool.occupiedSlots >= pool.totalSlots) {
      throw new Error('Все слоты в этой подписке уже заняты');
    }

    const member = {
      id: `usr-${Date.now().toString(36)}`,
      username,
      sbpAccount,
      joinedAt: new Date().toISOString(),
      escrowStatus: 'locked', // locked in escrow until 24h verification pass
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    };

    pool.members.push(member);
    pool.occupiedSlots += 1;
    pool.escrowLockedRub += pool.pricePerSlotRub;

    return { pool, member };
  }

  confirmSlotDelivery(poolId, memberId) {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Пул подписки не найден');
    const member = pool.members.find((m) => m.id === memberId);
    if (!member) throw new Error('Участник не найден');

    member.escrowStatus = 'released'; // Funds released to host
    pool.escrowLockedRub = Math.max(0, pool.escrowLockedRub - pool.pricePerSlotRub);
    return { success: true, member };
  }
}

module.exports = new EscrowPool();
