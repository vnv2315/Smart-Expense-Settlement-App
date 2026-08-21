# Smart Expense Settlement App

A Splitwise-style app for creating groups, recording equally split expenses,
viewing net balances, and generating a compact debt-settlement plan.

Live app: [smart-expense-settlement-app.vercel.app](https://smart-expense-settlement-app.vercel.app) · API: [smart-expense-settlement-api.onrender.com](https://smart-expense-settlement-api.onrender.com)

## Features

- JWT signup and login
- Protected group creation, membership management, and group listing
- Equal expense splitting using integer paise—no floating-point currency errors
- Net balance calculation with an exact minimum-transaction settlement plan
- Persistent settlement records with race-safe status updates
- Validation, authorization, and centralized API errors
- Responsive React/Vite dashboard for group, member, expense, and settlement management

## Tech stack

- Node.js, Express, MongoDB, and Mongoose
- JWT, bcrypt, cors, morgan, and express-validator
- React, Vite, and Tailwind CSS
- Render for the API and Vercel for the client

## Project structure

```text
server/                 Express API
client/                 React/Vite frontend
postman/                Importable API collection
render.yaml             Render deployment blueprint
```

## Local development

1. Install backend dependencies and create `.env` from `.env.example`.

   ```bash
   npm install
   npm run dev
   ```

2. Install frontend dependencies and create `client/.env` from
   `client/.env.example`.

   ```bash
   cd client
   npm install
   npm run dev
   ```

Local environment values:

```env
# .env
PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# client/.env
VITE_API_URL=http://localhost:5000/api/v1
```

## API endpoints

All group routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/signup` | Create an account |
| POST | `/api/v1/auth/login` | Log in and receive a JWT |
| POST / GET | `/api/v1/groups` | Create or list groups |
| POST | `/api/v1/groups/:groupId/members` | Add a member |
| DELETE | `/api/v1/groups/:groupId/members/:userId` | Remove a member |
| POST | `/api/v1/groups/:groupId/expenses` | Add an equally split expense |
| GET | `/api/v1/groups/:groupId/settlement` | Get balances and persistent settlement records |
| PATCH | `/api/v1/groups/:groupId/settlements/:settlementId/settle` | Mark one settlement as paid |

Import [Smart-Expense-Settlement-App.postman_collection.json](postman/Smart-Expense-Settlement-App.postman_collection.json)
into Postman. Run **Log in** first; it saves the JWT in the collection
variable. Getting the settlement plan saves its first settlement ID for the
mark-settled request. Set `memberUserId` and `payerUserId` before requests that
need them.

## Deployment

### Render API

Create a Render Web Service from this repository, using the repository root:

- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and
  `CLIENT_URL`

The included `render.yaml` supplies the non-secret service configuration.
Enter your actual MongoDB URL only in Render's environment-variable dashboard.

### Vercel frontend

Import the same repository into Vercel and set **Root Directory** to `client`.
Set this Vercel environment variable before deploying:

```env
VITE_API_URL=https://your-render-service.onrender.com/api/v1
```

After Vercel gives you its production URL, set Render's `CLIENT_URL` to that
exact origin, for example `https://smart-expense-settlement.vercel.app`, and
redeploy the Render service.

## CORS and environment separation

In local development, the React app runs at `http://localhost:5173` and the
API allows that exact origin through `CLIENT_URL`. In production, Render uses
the deployed Vercel origin in `CLIENT_URL`; the browser can then call the API,
but other origins are not granted CORS access.

The API's secrets stay only in `.env` locally and Render environment variables
in production. `VITE_API_URL` is intentionally a frontend build-time setting:
it contains the public API address, never a secret. Neither real `.env` file
is committed.
