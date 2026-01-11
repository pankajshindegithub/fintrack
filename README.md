# FinTrack

FinTrack is a full-stack personal finance tracker that helps you manage income and expenses, visualize spending, set goals, and view insights (including optional AI-powered recommendations).

## Features

- Authentication (JWT)
- Add / edit / delete transactions (income & expense)
- Dashboard with real-time charts
  - Income vs Expenses over time
  - Expenses by category
- Insights page
  - Compare months
  - Monthly summary
  - Set budgets per category & month
- Goals (create, update, delete, add funds)
- Optional AI assistant for insights (OpenAI / Gemini)

## Tech Stack

- Client: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- Server: Node.js + Express + MongoDB (Mongoose) + JWT

## Project Structure

```
smart-fintrack-main/
  client/      # React app (Vite)
  server/      # Express API
  README.md
```

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)

## Setup

### 1) Clone & install dependencies

Client:

```bash
cd client
npm install
```

Server:

```bash
cd server
npm install
```

### 2) Environment variables

Create `server/.env` (do NOT commit it) and add:

```bash
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Optional AI (use either/both)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=
```

### 3) Run locally

Terminal 1 (server):

```bash
cd server
npm run dev
```

Terminal 2 (client):

```bash
cd client
npm run dev
```

- Client: http://localhost:8080
- API: http://localhost:5000/api/v1

## API Routes (high level)

- Auth: `/api/v1/auth`
- Transactions: `/api/v1/transactions`
- Goals: `/api/v1/goals`
- Insights: `/api/v1/insights`
- Budgets: `/api/v1/budgets`

## Notes

- If AI keys are not configured (or quota is exceeded), the app will fall back to a non-AI response.
- Never commit `.env` or any secret keys.
