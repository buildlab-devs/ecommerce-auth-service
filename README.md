# ecommerce-auth-service

Authentication microservice — register, login, JWT tokens, refresh, logout.

## Setup

```bash
npm install
cp .env.example .env
# Set DATABASE_URL to your PostgreSQL instance
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Runs on **port 4001** locally.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh tokens |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET | `/api/auth/verify` | Verify access token |

## Vercel Deployment

1. Push this repo to GitHub
2. Import as a new Vercel project (root = repo root)
3. Set environment variables:
   - `DATABASE_URL` — PostgreSQL connection string
   - `JWT_ACCESS_SECRET` — strong random secret
   - `JWT_REFRESH_SECRET` — strong random secret
4. Deploy

After deploy, note the URL and set `AUTH_SERVICE_URL` in the gateway and other services.
