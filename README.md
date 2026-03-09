# 🐂🐻 BullBear — Zerodha Clone

<div align="center">

![BullBear Banner](https://img.shields.io/badge/BullBear-Stock%20Trading%20Platform-2563eb?style=for-the-badge&logo=trending-up)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-22c55e?style=for-the-badge&logo=render)](https://zerodha-frontend-xtsa.onrender.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/pankajkumar9771369/bullbear)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**A full-stack stock trading platform inspired by Zerodha — India's leading discount broker.**

[🚀 Live Demo](https://zerodha-frontend-xtsa.onrender.com/) · [📦 Repository](https://github.com/pankajkumar9771369/bullbear) · [🐛 Report Bug](https://github.com/pankajkumar9771369/bullbear/issues)

</div>

---

## 📸 Preview

> Visit the live app: **[https://zerodha-frontend-xtsa.onrender.com/](https://zerodha-frontend-xtsa.onrender.com/)**

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure login & registration with cookies
- 📊 **Dashboard** — Real-time portfolio summary with charts
- 📈 **Holdings & Positions** — Track your investments and open trades
- 🔍 **Watchlist** — Search and monitor stocks (powered by Alpha Vantage)
- 🛒 **Buy / Sell Orders** — Place and manage stock orders
- 💰 **Funds Management** — Add and manage trading funds
- 💳 **Stripe Payments** — Real payment gateway integration
- 📉 **Market Indices** — Live market data via Finnhub
- 🌐 **Marketing Homepage** — Full landing page (Home, About, Products, Pricing, Support)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI Framework |
| React Router v6 | Client-side routing |
| Material UI (MUI) | UI Components |
| Bootstrap 5 | Responsive grid & styling |
| Chart.js + react-chartjs-2 | Charts & graphs |
| Stripe (react-stripe-js) | Payment UI |
| Axios | API calls |
| React Toastify | Notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API Server |
| MongoDB + Mongoose | Database & ODM |
| JSON Web Tokens (JWT) | Authentication |
| bcryptjs | Password hashing |
| Stripe | Payment processing |
| Alpha Vantage API | Stock search & pricing |
| Finnhub | Market indices data |
| cookie-parser | Cookie management |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16
- MongoDB Atlas account (or local MongoDB)
- Alpha Vantage API key — [Get free key](https://www.alphavantage.co/support/#api-key)
- Stripe account — [stripe.com](https://stripe.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/pankajkumar9771369/bullbear.git
cd bullbear
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
ALPHA_VANTAGE_KEY=your_alpha_vantage_api_key
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm start
# Runs on http://localhost:3002
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```env
REACT_APP_API_URL=http://localhost:3002
```

Start the frontend:

```bash
npm start
# Runs on http://localhost:3000
```

---

## 📁 Project Structure

```
bullbear/
├── backend/
│   ├── controllers/         # Business logic
│   │   ├── AuthController.js
│   │   ├── OrdersController.js
│   │   ├── HoldingsController.js
│   │   ├── PositionsController.js
│   │   ├── FundsController.js
│   │   ├── WatchlistController.js
│   │   ├── SummaryController.js
│   │   ├── IndicesController.js
│   │   └── PaymentControllers.js
│   ├── routes/              # Express route definitions
│   ├── model/               # Mongoose schemas
│   ├── Middlewares/         # Auth middleware (JWT verification)
│   ├── util/                # Utility helpers
│   ├── finnhubClient.js     # Finnhub API client
│   └── index.js             # App entry point
│
└── frontend/
    └── src/
        ├── components/      # Dashboard components
        │   ├── Summary.js
        │   ├── Holdings.js
        │   ├── Positions.js
        │   ├── Orders.js
        │   ├── Funds.js
        │   ├── WatchList.js
        │   ├── BuyActionWindow.js
        │   ├── SellPage.js
        │   ├── StripeCheckout.js
        │   └── ...
        └── home_page/       # Marketing / landing pages
            ├── Auth/
            ├── home/
            ├── about/
            ├── products/
            ├── pricing/
            └── support/
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login and get JWT cookie |
| GET | `/api/orders` | ✅ | Get user orders |
| POST | `/api/orders` | ✅ | Place a new order |
| GET | `/api/holdings` | ✅ | Get portfolio holdings |
| GET | `/api/positions` | ✅ | Get open positions |
| GET | `/api/funds` | ✅ | Get fund details |
| POST | `/api/funds` | ✅ | Add funds |
| GET | `/api/summary` | ✅ | Get portfolio summary |
| GET | `/api/watchlist` | ❌ | Get watchlist |
| GET | `/api/indices` | ❌ | Get market indices |
| GET | `/api/stocks/search?q=` | ❌ | Search stocks |
| POST | `/api/payment` | ✅ | Create Stripe payment |

---

## ☁️ Deployment

This project is deployed on **[Render](https://render.com)**:

| Service | URL |
|---|---|
| Frontend | [zerodha-frontend-xtsa.onrender.com](https://zerodha-frontend-xtsa.onrender.com/) |
| Backend | Render backend service (port 3002) |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Pankaj Kumar**

[![GitHub](https://img.shields.io/badge/GitHub-pankajkumar9771369-181717?style=flat-square&logo=github)](https://github.com/pankajkumar9771369)

---

<div align="center">
  Made with ❤️ | Inspired by <a href="https://zerodha.com">Zerodha</a>
</div>
