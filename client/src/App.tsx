import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  Clock, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Zap,
  Globe,
  Lock
} from 'lucide-react';

interface Member {
  id: string;
  username: string;
  sbpAccount: string;
  joinedAt: string;
  escrowStatus: 'locked' | 'released';
  expiresAt: string;
}

interface Pool {
  id: string;
  serviceId: string;
  hostUsername: string;
  hostCardCountry: string;
  totalSlots: number;
  occupiedSlots: number;
  pricePerSlotRub: number;
  nextBillingDate: string;
  status: string;
  sbpPhoneMask: string;
  members: Member[];
  escrowLockedRub: number;
}

interface ServiceMeta {
  id: string;
  name: string;
  totalSlots: number;
  pricePerSlotRub: number;
  region: string;
  periodDays: number;
}

export default function App() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [services, setServices] = useState<ServiceMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [username, setUsername] = useState('');
  const [sbpAccount, setSbpAccount] = useState('');
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New pool state
  const [newServiceId, setNewServiceId] = useState('spotify');
  const [newHostName, setNewHostName] = useState('');
  const [newTotalSlots, setNewTotalSlots] = useState(6);
  const [newSlotCost, setNewSlotCost] = useState(180);
  const [newRegion, setNewRegion] = useState('Казахстан (Kaspi Gold)');

  const fetchPools = async () => {
    try {
      const res = await fetch('/api/pools');
      const data = await res.json();
      setPools(data);
    } catch (err) {
      console.error('Failed to fetch pools:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  useEffect(() => {
    Promise.all([fetchPools(), fetchServices()]).finally(() => setLoading(false));
  }, []);

  const handleJoinSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool) return;
    setBookingStatus('Бронирование слота и холдирование в Эскроу...');

    try {
      const res = await fetch(`/api/pools/${selectedPool.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          sbpAccount: sbpAccount.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBookingStatus('✓ Слот забронирован! Средства заблокированы на 24 часа. Доступ выдан.');
        await fetchPools();
        setTimeout(() => {
          setSelectedPool(null);
          setBookingStatus(null);
          setUsername('');
          setSbpAccount('');
        }, 1800);
      } else {
        setBookingStatus(`Ошибка: ${data.error}`);
      }
    } catch (err: any) {
      setBookingStatus(`Сетевая ошибка: ${err.message}`);
    }
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: newServiceId,
          hostUsername: newHostName || 'Anonymous Cardholder',
          hostCardCountry: newRegion,
          totalSlots: Number(newTotalSlots),
          pricePerSlotRub: Number(newSlotCost),
          occupiedSlots: 1,
          nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          sbpPhoneMask: '+7 (9**) ***-**-**'
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        await fetchPools();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmSlot = async (poolId: string, memberId: string) => {
    try {
      const res = await fetch(`/api/pools/${poolId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId })
      });
      if (res.ok) {
        await fetchPools();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getServiceName = (serviceId: string) => {
    const s = services.find(x => x.id === serviceId);
    return s ? s.name : serviceId.toUpperCase();
  };

  return (
    <div className="subrelay-app">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-logo">
              <Zap className="brand-icon" size={24} />
            </div>
            <div>
              <div className="brand-title">SubRelay</div>
              <div className="brand-sub">P2P Subscription Sharing & Escrow Platform</div>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn-secondary" onClick={fetchPools} title="Обновить">
              <RefreshCw size={16} />
            </button>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <PlusCircle size={18} />
              <span>Создать складчину</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck size={16} /> 100% Защита через 24h Escrow СБП
          </div>
          <h1>Оплачивай зарубежные сервисы в складчину без наценок посредников</h1>
          <p>
            Владельцы зарубежных карт (Казахстан, Турция, Грузия) делятся семейными слотами. 
            Деньги удерживаются смарт-эскроу и переводятся организатору только после успешного входа в семейную подписку.
          </p>

          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-num">до 85%</span>
              <span className="stat-label">Экономия на подписках</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">24 ч</span>
              <span className="stat-label">Безопасный холд средств</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">СБП</span>
              <span className="stat-label">Моментальные переводы в рублях</span>
            </div>
          </div>
        </div>
      </section>

      {/* POOLS GRID */}
      <main className="pools-main">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={32} />
            <p>Загрузка проверенных складчин...</p>
          </div>
        ) : pools.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={48} />
            <h3>Нет доступных пулов</h3>
            <p>Станьте первым организатором и получайте ежемесячный кэшбэк на свою карту!</p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              Создать семейный пул
            </button>
          </div>
        ) : (
          <div className="pools-grid">
            {pools.map((pool) => {
              const freeSlots = Math.max(0, pool.totalSlots - pool.occupiedSlots);
              const fillPct = Math.round((pool.occupiedSlots / pool.totalSlots) * 100);

              return (
                <div key={pool.id} className="pool-card">
                  <div className="pool-card-header">
                    <div>
                      <span className="pool-tag">{pool.serviceId.toUpperCase()}</span>
                      <h3 className="pool-title">{getServiceName(pool.serviceId)}</h3>
                      <div className="pool-region">
                        <Globe size={13} style={{ marginRight: 4, display: 'inline' }} />
                        {pool.hostCardCountry}
                      </div>
                    </div>
                    <div className="pool-price-box">
                      <div className="price-val">{pool.pricePerSlotRub} ₽</div>
                      <div className="price-period">в месяц / слот</div>
                    </div>
                  </div>

                  <div className="host-info">
                    <div className="host-avatar">
                      {pool.hostUsername.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="host-meta">
                      <div className="host-name">{pool.hostUsername}</div>
                      <div className="host-rating">⭐ 4.9 • Проверенный эскроу-хост ({pool.sbpPhoneMask})</div>
                    </div>
                  </div>

                  <div className="slots-progress">
                    <div className="slots-label">
                      <span>Занято {pool.occupiedSlots} из {pool.totalSlots} мест</span>
                      <span>{fillPct}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {pool.members && pool.members.length > 0 && (
                    <div className="members-escrow-list">
                      <div className="members-title">Участники пула:</div>
                      {pool.members.map(m => (
                        <div key={m.id} className="member-item">
                          <span>{m.username}</span>
                          <span className={`escrow-badge ${m.escrowStatus}`}>
                            {m.escrowStatus === 'locked' ? (
                              <>
                                <Lock size={11} style={{ marginRight: 2 }} /> 
                                Escrow Hold
                                <button 
                                  className="btn-confirm-mini" 
                                  onClick={() => handleConfirmSlot(pool.id, m.id)}
                                  title="Подтвердить работу и разблокировать средства хосту"
                                >
                                  Подтвердить доступ
                                </button>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={11} style={{ marginRight: 2 }} /> Выплачено
                              </>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pool-footer">
                    <div className="pool-billing-note">
                      <Clock size={14} /> След. списание: {pool.nextBillingDate}
                    </div>
                    <button 
                      className="btn-join"
                      disabled={freeSlots === 0}
                      onClick={() => setSelectedPool(pool)}
                    >
                      {freeSlots > 0 ? `Занять слот (${freeSlots} своб.)` : 'Мест нет'}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* JOIN SLOT MODAL */}
      {selectedPool && (
        <div className="modal-backdrop" onClick={() => setSelectedPool(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Вступить в складчину: {getServiceName(selectedPool.serviceId)}</h2>
              <button className="btn-close" onClick={() => setSelectedPool(null)}>✕</button>
            </div>

            <form onSubmit={handleJoinSlot} className="join-form">
              <div className="escrow-notice">
                <ShieldCheck size={20} className="notice-icon" />
                <div>
                  <strong>Эскроу-гарантия:</strong> Ваши {selectedPool.pricePerSlotRub} ₽ холдируются на 24 часа. Организатор получит выплату только после того, как вы подтвердите подключение семейного слота.
                </div>
              </div>

              <div className="form-group">
                <label>Ваш Telegram или Никнейм (для приглашения)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="@telegram_handle"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Номер телефона для СБП (для возврата в случае отмены)</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="+7 (999) 000-00-00"
                  value={sbpAccount}
                  onChange={(e) => setSbpAccount(e.target.value)}
                />
              </div>

              <div className="modal-price-summary">
                <span>К оплате через СБП:</span>
                <strong>{selectedPool.pricePerSlotRub} ₽ / мес</strong>
              </div>

              {bookingStatus && (
                <div className="status-banner">
                  {bookingStatus}
                </div>
              )}

              <button type="submit" className="btn-submit-pay">
                <CreditCard size={18} />
                Оплатить {selectedPool.pricePerSlotRub} ₽ через СБП (Escrow)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE POOL MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Создать семейный пул подписок</h2>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreatePool} className="join-form">
              <div className="form-group">
                <label>Сервис</label>
                <select 
                  value={newServiceId} 
                  onChange={(e) => setNewServiceId(e.target.value)}
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ваше имя / позывной организатора</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Alex_KZ"
                  value={newHostName}
                  onChange={(e) => setNewHostName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Всего слотов</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={newTotalSlots}
                    onChange={(e) => setNewTotalSlots(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Цена слота (₽ / мес)</label>
                  <input 
                    type="number" 
                    min="50" 
                    value={newSlotCost}
                    onChange={(e) => setNewSlotCost(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Страна и банк карты</label>
                <input 
                  type="text" 
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-submit-pay">
                Опубликовать пул и открыть бронирование
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
