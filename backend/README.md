# HaaS backend (very basic)

A minimal Flask API that backs the whole app: login/signup, projects, and
hardware checkout/check-in. There is no real database -- everything is
persisted to small local files under `data/`, created automatically on
first run:

- `data/users.txt` — one line per user, `<encrypted-username> <encrypted-password>`.
  Encrypted with the course cipher (`cipher.py`, adapted from HW2).
- `data/projects.json` — list of projects (members, checkouts, etc).
- `data/hardware.json` — list of hardware sets (capacity/availability).

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

Auth (`POST`, JSON body):

- `POST /api/signup` — `{ "username": "...", "password": "..." }` →
  `{ "ok": true, "user": { "id": "...", "username": "..." } }` or
  `{ "ok": false, "error": "..." }`.
- `POST /api/login` — same request/response shape as signup.

Projects & hardware (`GET`, query-string args — same basic style as the
course's `HW6/app.py`):

- `GET /api/projects` — list all projects.
- `GET /api/hardware` — list all hardware sets.
- `GET /api/createProject?name=&startDate=&endDate=&userId=` — create a
  project (creator becomes the first member).
- `GET /api/joinProject?projectId=&userId=` — add a user to a project.
- `GET /api/leaveProject?projectId=&userId=` — remove a user from a project.
- `GET /api/checkOutHardware?projectId=&hardwareId=&qty=` — check hardware
  out against a project, decrementing global availability.
- `GET /api/checkInHardware?projectId=&checkoutId=` — check a specific
  checkout back in, restoring availability.
- `GET /api/health` — basic liveness check.

## Notes / limitations (by design, for a first basic version)

- Storage is flat local files, not a real database.
- No password hashing beyond the simple reversible cipher (not meant to be
  secure, just a basic obfuscation layer per the assignment).
- No sessions/JWTs — the frontend just remembers the logged-in user in
  memory after a successful call.
- Project/hardware mutations use `GET` with query-string args rather than
  proper `POST`/`PUT` verbs, matching the intentionally simple style of
  `HW6/app.py`.
