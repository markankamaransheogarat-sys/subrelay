# SubRelay (SplitPay) 💳

> **P2P Escrow & Subscription Sharing Engine for International Services in Russia**  
> Совместная оплата зарубежных сервисов (Spotify, YouTube, Steam, Claude, Midjourney, Cursor) в складчину без драконовских комиссий перекупов (30–50%).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19.3-61dafb.svg)](https://react.dev/)
[![Escrow Safety](https://img.shields.io/badge/Escrow-24h%20TimeLock-success.svg)](https://github.com/markankamaransheogarat-sys/subrelay)

---

## 🎯 Проблема (Pain Point)
Из-за санкций и блокировок российских банковских карт (Visa / Mastercard / МИР) пользователи из РФ не могут напрямую оплачивать иностранные подписки (Steam, Spotify Family, YouTube Premium, Claude AI, Midjourney, Figma, серверы Hetzner). 
- Перекупщики на Plati/Avito берут **30–50% комиссии** и регулярно кидают с семейными аккаунтами.
- У многих людей в СНГ (Казахстан, Армения, Грузия, Турция, ОАЭ) есть рабочие международные карты, но им не с кем делить семейный план.

## 💡 Решение (Solution)
**SubRelay** автоматизирует модель шеринга семейных подписок с встроенной защитой покупателя и продавца:
1. **P2P-Складчины**: Организатор с иностранной картой (Kaspi, Halyk, Ininal, Papara) создает пул семейной подписки.
2. **24-часовой Смарт-Эскроу**: Оплата участника в рублях (СБП) холдируется в эскроу-контракте. Деньги переводятся хосту только после того, как покупатель активировал слот и подтвердил доступ.
3. **Автоматический календарь биллинга**: Система рассчитывает даты регулярных списаний, напоминая участникам пула о продлении за 3 дня до даты платежа.
4. **Защита от переполнения**: Атомарное бронирование слотов исключает овербукинг.

---

## 🏗 Архитектура

```
subrelay/
├── server/
│   ├── index.js          # REST API & Static Single Page App Server
│   └── escrow.js         # Core Escrow State Machine & Capacity Allocator
├── client/
│   ├── src/
│   │   ├── App.tsx       # Interactive Dashboard (Pools, Escrow status, Join Modal)
│   │   ├── index.css     # Responsive Dark Theme UI
│   │   └── main.tsx      # React Entrypoint
│   ├── vite.config.ts    # Bundler config
│   └── package.json
├── tests/
│   └── escrow.test.js    # Automated State & Escrow Capacity Unit Tests
└── package.json
```

---

## 🚀 Быстрый старт (Quickstart)

### 1. Клонирование и установка
```bash
git clone https://github.com/markankamaransheogarat-sys/subrelay.git
cd subrelay
npm install
cd client && npm install && npm run build && cd ..
```

### 2. Запуск сервера
```bash
npm start
# Server listening on http://localhost:4001
```

### 3. Запуск тестов
```bash
npm test
```

---

## 🛡️ Безопасность Escrow
- **Time-Lock**: Средства замораживаются на 24 часа с момента платежа.
- **Dispute Resolution**: Если инвайт в семью не сработал или регион аккаунта не совпал, средства возвращаются покупателю по реквизитам СБП.
- **Zero Custody**: Сервис не хранит данные банковских карт пользователей.

---

## 👤 Автор
**markankamaransheogarat-sys**  
GitHub: [@markankamaransheogarat-sys](https://github.com/markankamaransheogarat-sys)

## 📄 Лицензия
MIT License.
