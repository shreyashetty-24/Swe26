from flask import Blueprint, jsonify

from errors import StoreError
from routes.helpers import json_body
from stores import user_store

bp = Blueprint("auth", __name__)


def _credentials():
    data = json_body()
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    if not username or not password:
        raise StoreError("Username and password are required.", 400)
    return username, password


@bp.post("/signup")
def signup():
    username, password = _credentials()
    if " " in username or " " in password:
        raise StoreError("Username and password cannot contain spaces.", 400)
    return jsonify(ok=True, user=user_store.create_user(username, password))


@bp.post("/login")
def login():
    username, password = _credentials()
    return jsonify(ok=True, user=user_store.verify_credentials(username, password))
