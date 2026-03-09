# Fintech Microservices Platform

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="80" alt="Nest Logo" />
</p>

A **production-style fintech platform** built with **NestJS** and a **microservices architecture**. This project demonstrates backend development skills including authentication, distributed services communication, payment processing, and financial transaction management.

---

## Overview

This repository showcases a multi-service financial application where four autonomous microservices work together to provide:

- **User authentication** with JWT and role-based access control
- **Digital wallet** operations (balance, deposits, withdrawals, transfers)
- **Payment processing** via multiple methods (PIX, Boleto, Credit Card)
- **Transaction ledger** for audit trails and financial records

Each service owns its database and communicates via HTTP using a lightweight service-discovery pattern, as well as **RabbitMQ** (hosted on **CloudAMQP**) for asynchronous messaging.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Auth Service   │────▶│ Wallet Service  │◀────│ Payment Service │     │ Ledger Service  │
│  (JWT, Users)   │     │  (Balance, etc) │     │ (PIX, Boleto,   │────▶│ (Transactions)  │
│                 │     │                 │────▶│  Credit Card)   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │                        │
        ▼                        ▼                        ▼                        ▼
   MongoDB                 MongoDB                 MongoDB                 MongoDB
```

### Services

| Service | Port | Responsibility |
|---------|------|----------------|
| **auth-service** | 3001 | User registration, login, JWT authentication, RBAC (USER/ADMIN) |
| **ledger-service** | 3002 | Immutable transaction log (deposits, withdrawals, transfers, chargebacks) |
| **payment-service** | 3003 | Payment creation (PIX, Boleto, Credit Card), webhooks, capture, refund, chargeback |
| **wallet-service** | 3004 | Wallet CRUD, deposits, withdrawals, transfers between users |

### Design Patterns

- **Strategy Pattern**: Payment methods (PIX, Boleto, Credit Card) implemented via a `PaymentStrategy` interface
- **Guard-based Authorization**: JWT + Passport for protected routes, `RolesGuard` for admin-only endpoints
- **Service-to-Service Communication**: Axios-based `serviceCall` utility for inter-service HTTP calls
- **Single Responsibility**: Each service focuses on one domain (auth, wallet, ledger, payments)

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: NestJS 11
- **Language**: TypeScript 5.7
- **Database**: MongoDB (Mongoose ODM)
- **Message Broker**: RabbitMQ (hosted on CloudAMQP)
- **Auth**: Passport, JWT, bcrypt
- **Linting**: ESLint, Prettier

---

## Features

### Auth Service

- User registration (creates user + wallet automatically)
- Login with email/password (returns JWT)
- Protected route `GET /auth/me` (user profile from JWT)
- Admin-only route `GET /auth/admin` (role-based access)

### Wallet Service

- Create wallet: `POST /wallet/:userId`
- Get wallet: `GET /wallet/:userId`
- Deposit: `POST /wallet/:userId/deposit`
- Withdraw: `POST /wallet/:userId/withdraw`
- Chargeback: `POST /wallet/:userId/chargeback`
- Transfer: `POST /wallet/transfer` (between two users)

### Ledger Service

- Create transaction: `POST /ledger/transaction` (called by other services for audit trail)

### Payment Service

- Create payment: `POST /payment` (type: `pix`, `boleto`, `credit_card`)
- Confirm PIX/webhook: `POST /payment/webhook`
- Capture (credit card): `POST /payment/capture`
- Refund: `POST /payment/refund`
- Chargeback: `POST /payment/chargeback`
- Reissue Boleto: `POST /payment/reissue` (with penalty calculation: fine + interest)

---

## API Documentation (Swagger)

The platform provides interactive API documentation for each microservice using OpenAPI (Swagger). You can explore the endpoints, view request/response schemas, and test the APIs directly from your browser. Make sure to use the **Authorize** button to provide your `Bearer` token for protected routes.

Live documentation for the deployed services:

- **Auth Service**: [https://auth-service-b8yr.onrender.com/api/docs](https://auth-service-b8yr.onrender.com/api/docs)
- **Ledger Service**: [https://nestjs-fintech-microservices.onrender.com/api/docs](https://nestjs-fintech-microservices.onrender.com/api/docs)
- **Payment Service**: [https://payment-service-in9s.onrender.com/api/docs](https://payment-service-in9s.onrender.com/api/docs)
- **Wallet Service**: [https://wallet-service-ebzl.onrender.com/api/docs](https://wallet-service-ebzl.onrender.com/api/docs)

*(Note: When running locally, you can access the Swagger UI by appending `/api/docs` to the respective service's base URL, e.g., `http://localhost:3001/api/docs`)*

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- MongoDB (local or Docker)

### 1. Start MongoDB (Docker)

```bash
cd auth-service
docker-compose up -d
```

### 2. Install Dependencies & Run Services

Each service runs independently. In separate terminals:

```bash
# Auth Service (port 3001)
cd auth-service && npm install && npm run start:dev

# Ledger Service (port 3002)
cd ledger-service && npm install && npm run start:dev

# Payment Service (port 3003)
cd payment-service && npm install && npm run start:dev

# Wallet Service (port 3004)
cd wallet-service && npm install && npm run start:dev
```

### 3. Environment Variables

Create `.env` in each service directory. Example for **auth-service**:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/fintech-auth
JWT_SECRET=your-secret-key
SERVICES={"wallet":"http://localhost:3004","ledger":"http://localhost:3002","payment":"http://localhost:3003"}
```

Example for **wallet-service**:

```env
PORT=3004
MONGO_URI=mongodb://localhost:27017/fintech-wallet
SERVICES={"ledger":"http://localhost:3002"}
```

Example for **ledger-service**:

```env
PORT=3002
MONGO_URI=mongodb://localhost:27017/fintech-ledger
```

Example for **payment-service**:

```env
PORT=3003
MONGO_URI=mongodb://localhost:27017/fintech-payment
SERVICES={"wallet":"http://localhost:3004"}
```

---

## Project Structure

```
nestjs-fintech-microservices/
├── auth-service/          # JWT auth, users, roles
│   └── src/
│       ├── auth/          # login, register, guards, JWT strategy
│       ├── users/         # user schema, UsersService
│       └── common/        # serviceCall util, clients
├── wallet-service/        # wallet operations
│   └── src/
│       └── wallet/        # controller, service, schemas, DTOs
├── ledger-service/        # transaction ledger
│   └── src/
│       └── ledger/        # create transaction
├── payment-service/       # payments
│   └── src/
│       └── payment/
│           ├── strategies/   # PIX, Boleto, CreditCard
│           ├── schemas/
│           └── payment.service.ts
└── README.md
```

---

## What This Project Demonstrates

- **Microservices**: Decoupled services, clear boundaries, HTTP-based communication
- **NestJS**: Modules, dependency injection, guards, decorators
- **Security**: Password hashing (bcrypt), JWT, role-based access
- **Design patterns**: Strategy pattern (payments), DTOs, service abstraction
- **Domain modeling**: User, Wallet, Transaction, Payment entities
- **Inter-service integration**: Auth → Wallet on register; Wallet → Ledger on ops; Payment → Wallet on confirm/refund
- **Fintech concepts**: Boleto reissue with fine/interest, chargeback flow, ledger audit trail

---

## Author

**Juan Gallardo**

- GitHub: [@gallardojpsistemas](https://github.com/gallardojpsistemas)

Portfolio project — built to showcase backend development and system design skills.

---

## License

UNLICENSED (Portfolio / Educational use)
