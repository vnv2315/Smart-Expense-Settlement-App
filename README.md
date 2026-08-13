# Smart Expense Settlement App

A Splitwise-style application for creating groups, recording shared expenses,
and calculating an efficient set of transactions to settle group debts.

## Current progress

The project is being built incrementally. The current implementation includes:

- Express and MongoDB project structure
- User and group models with referenced group members
- Signup and login endpoints
- Password hashing with bcrypt
- JWT authentication middleware
- Protected group creation, membership management, and group listing
- Shared expenses with exact equal splitting in integer paise
- Net-balance calculation and greedy debt settlement plans
- Race-safe pending-to-settled debt updates
- Request validation and centralized API error responses

The React frontend will be added in a later increment.

## Tech stack

- Node.js and Express
- MongoDB and Mongoose
- JWT and bcrypt
- React with Vite (frontend scaffold)

## Project structure

```text
server/
  config/
  controllers/
  middleware/
  models/
  routes/
client/
  src/
```

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example` and provide a strong,
   private `JWT_SECRET`.

3. Start MongoDB and run the development server:

   ```bash
   npm run dev
   ```

The API is served under `/api/v1`.
