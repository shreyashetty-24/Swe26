# Very basic Flask API backing the HaaS login / signup pages.
#
# Deliberately minimal: no ORM, no real database, no sessions/tokens. Just
# two endpoints the React frontend can call so the auth flow is backed by a
# real (if tiny) server instead of in-memory React state. Credentials are
# persisted locally via user_store.py.

from flask import Flask, jsonify, request
from flask_cors import CORS

import user_store

app = Flask(__name__)
CORS(app)  # Allow the Vite dev server (different port) to call this API.


def user_payload(username):
    # No real "user id" concept yet -- derive a stable one from the
    # username so the rest of the frontend (project membership, etc.)
    # has something unique to key off of.
    return {"id": f"u-{username}", "username": username}


@app.post("/api/signup")
def signup():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify(ok=False, error="Username and password are required."), 400

    if " " in username or " " in password:
        return jsonify(ok=False, error="Username and password cannot contain spaces."), 400

    if user_store.username_exists(username):
        return jsonify(ok=False, error="That username is already taken."), 409

    if not user_store.create_user(username, password):
        return (
            jsonify(ok=False, error="Username/password contains unsupported characters."),
            400,
        )

    return jsonify(ok=True, user=user_payload(username))


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify(ok=False, error="Username and password are required."), 400

    if not user_store.verify_credentials(username, password):
        return jsonify(ok=False, error="Invalid username or password."), 401

    return jsonify(ok=True, user=user_payload(username))


@app.get("/api/health")
def health():
    return jsonify(status="ok")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
