# HaaS backend

Flask API backed by **three MongoDB databases**, each owning one concern:

| Database        | Collections             | Holds                                              |
| --------------- | ----------------------- | -------------------------------------------------- |
| `haas_users`    | `users`                 | accounts (credentials obscured with `cipher.py`)   |
| `haas_projects` | `projects`, `checkouts` | projects, leader/members, units each project holds |
| `haas_hardware` | `hardware_sets`         | global capacity and availability                   |

Databases reference each other only by plain ids, so each can be moved to its
own server (see config below).

## Run it

You need a MongoDB server (e.g. `docker run -p 27017:27017 mongo`, or a free Atlas cluster).

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Listens on `http://127.0.0.1:5000`; the Vite dev server proxies `/api/*` to it.
Indexes and the two seed hardware sets are created automatically on startup.

### Configuration (environment variables)

- `MONGO_URI` (default `mongodb://localhost:27017`)
- `USERS_DB_NAME`, `PROJECTS_DB_NAME`, `HARDWARE_DB_NAME`
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
- `POST /api/projects` — `{ id, name, startDate, endDate }`; **`id` is chosen by the user**
  (3–32 chars, letters/digits/`-`/`_`, unique case-insensitively). Creator becomes the **leader**.
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
