# HaaS backend (very basic)

A minimal Flask API that backs the Login / Sign up pages only. There is no
real database -- user credentials are encrypted (see `cipher.py`, adapted
from the course HW2 cipher) and appended to a local text file at
`data/users.txt`, created automatically on first run.

## Run it

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The server listens on `http://127.0.0.1:5000`. The frontend's Vite dev
server proxies `/api/*` requests to it (see `frontend/vite.config.js`), so
just run `npm run dev` in `frontend/` in a separate terminal and the two
will talk to each other.

## Endpoints

- `POST /api/signup` — body `{ "username": "...", "password": "..." }`
  → `{ "ok": true, "user": { "id": "...", "username": "..." } }` or
  `{ "ok": false, "error": "..." }`.
- `POST /api/login` — same request/response shape as signup.
- `GET /api/health` — basic liveness check.

## Notes / limitations (by design, for a first basic version)

- Storage is a flat text file, not a real database.
- No password hashing beyond the simple reversible cipher (not meant to be
  secure, just a basic obfuscation layer per the assignment).
- No sessions/JWTs — the frontend just remembers the logged-in user in
  memory after a successful call.
