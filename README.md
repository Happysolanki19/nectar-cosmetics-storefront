# Nectar Cosmetics

## Run the storefront and backend

Requires Node.js 24 or newer and a MongoDB server or Atlas connection string. Install dependencies and configure the environment:

```powershell
npm.cmd install
Copy-Item .env.example .env
```

Set `DB_URI` in `.env` to your MongoDB connection string. For a local MongoDB server, the example URI is ready to use. Keep `.env` private and never commit database credentials. Then start the app:

```powershell
npm.cmd start
```

Open [http://localhost:3000](http://localhost:3000). Use this server URL rather than opening the HTML files directly: the frontend calls the same-origin `/api` routes. `PORT` and `NODE_ENV` can also be configured in `.env`.

The homepage storefront includes live product search, category/price/rating filters, sorting, a browser-saved wishlist, and a persistent cart that continues through the demo checkout.

Mongoose creates MongoDB collections and indexes for products, users, sessions, and Beauty Advisor history. Seed products are inserted at startup; sample-offer entries are refreshed from the storefront catalog and existing custom products are preserved.

### Import data from the previous SQLite backend

The old `data/nectar.sqlite` file is not deleted. Configure `DB_URI`, then run this one-time, repeatable import before starting the app:

```powershell
npm.cmd run migrate:sqlite
```

To import a different SQLite file, pass its path:

```powershell
npm.cmd run migrate:sqlite -- "C:\path\to\nectar.sqlite"
```

The migration copies products, password hashes, accounts, unexpired and expired session records, and advisor history. Existing sessions remain valid when their expiry is still in the future. The importer upserts records to allow safe retries; keep a backup of both databases before migration.

## API routes

- `GET /api/health` — server and MongoDB connection status
- `GET /api/products` — product catalog
- `POST /api/auth/register` — create an account and sign in
- `POST /api/auth/login` — sign in
- `GET /api/auth/me` — current account, or `null` when signed out
- `POST /api/auth/logout` — sign out
- `POST /api/advisor/ask` — recommend from the catalog and save the question/response for the signed-in account
- `GET /api/advisor/history` — recent history for the signed-in account

Passwords are hashed with bcrypt. Authentication uses an HTTP-only, same-site session cookie; only a hash of the random session token is stored in MongoDB, and expired sessions are removed using a TTL index. The advisor uses local keyword matching against catalog data; it is not connected to an external generative AI service. Checkout/payment selection remains a demo and does not create a persisted order or process payments.
