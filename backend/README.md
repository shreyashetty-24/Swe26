# Project Hardware Checkout — backend

Flask API backed by **three MongoDB databases**, each owning one concern:

| Database      | Collections             | Holds                                              |
| ------------- | ----------------------- | -------------------------------------------------- |
| `Users`       | `users`                 | accounts (credentials obscured with `cipher.py`)   |
| `Projects`    | `projects`, `checkouts` | projects, leader/members, units each project holds |
| `HardwareSet` | `hardware_sets`         | global capacity and availability                   |

Databases reference each other only by plain ids, so each can be moved to its
own server (see config below).

## Run it

You need a MongoDB server: your own free **MongoDB Atlas** cluster (recommended),
or a local one (`docker compose up -d`, see `docker-compose.yml`).

**Atlas setup (once):**
1. Create a database user (Database Access) and note the password.
2. Allow your IP under Network Access (`0.0.0.0/0` is fine for development).
3. Copy the connection string from Connect -> Drivers.
4. `copy .env.example .env` and set `MONGO_URI` in `.env` (one line; URL-encode special
   characters in the password). `.env` is git-ignored -- never commit it.

Don't point this app at the read-only HW6 class cluster; use your own.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Then open `http://127.0.0.1:5000/api/health`; it should return `{"status": "ok"}`.

Listens on `http://127.0.0.1:5000`; the Vite dev server proxies `/api/*` to it.
Indexes and the two seed hardware sets are created automatically on startup.

### Configuration (environment variables)

Read from the environment or from `backend/.env`:

- `MONGO_URI` (default `mongodb://localhost:27017`) -- use your Atlas `mongodb+srv://...` string
- `USERS_DB_NAME`, `PROJECTS_DB_NAME`, `HARDWARE_DB_NAME` (defaults `Users`, `Projects`, `HardwareSet`)
- `USERS_MONGO_URI`, `PROJECTS_MONGO_URI`, `HARDWARE_MONGO_URI` — optional per-database server override

## Tests

```bash
pip install -r requirements-dev.txt
python -m pytest
```
Tests run against an in-memory MongoDB (`mongomock`), no server needed.

## Endpoints

Requests other than signup/login carry the acting user's id as `userId`
(JSON body, or query string for GETs). All responses are `{ ok, ... }`.

- `POST /api/signup`, `POST /api/login` — `{ username, password }`
- `GET  /api/projects` — projects the user belongs to
- `POST /api/projects` — `{ id, name, description, startDate, endDate }`; **`id` is chosen by the user**
  (3–32 chars, letters/digits/`-`/`_`, unique case-insensitively). `description` is required
  (max 500 chars). Creator becomes the **leader**. Stored in MongoDB as `ID`, `Name`, `Description`.
- `POST /api/projects/join` — `{ id }`
- `POST /api/projects/<id>/leave` — members only; **403 for the leader**
- `POST /api/projects/<id>/checkout` — `{ hardwareId, quantity }`
- `POST /api/projects/<id>/checkin` — `{ hardwareId, quantity }`; **any amount** up to what the project holds
- `GET  /api/hardware`, `GET /api/health`

## Notes / limitations

- No sessions/JWTs: the server trusts the `userId` the client sends (it only checks the account exists), so this is not real access control.
- The cipher is reversible obfuscation, not password hashing.
- Check-out/check-in touch two databases, and MongoDB can't transact across them. Each step is a single guarded atomic update, and a failure in the second step undoes the first (`stores/checkout_store.py`).
- Accounts from the old `data/users.txt` are not migrated.
