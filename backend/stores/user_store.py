# Accounts, stored in the `haas_users` database.
#
# Credentials are still obscured with the course cipher (cipher.py) before
# they are written, same as the old text-file store. The cipher is
# deterministic, so we can look a user up by their *encrypted* username
# without decrypting anything.

import hmac

from pymongo.errors import DuplicateKeyError

import cipher
import db
from errors import StoreError

CIPHER_N = 3
CIPHER_D = 1


def user_id_for(username):
    # Stable id derived from the username, used as the key everywhere else
    # (project membership, leader, ...).
    return f"u-{username}"


def _encrypt(value):
    out = cipher.encrypt(value, CIPHER_N, CIPHER_D)
    return None if out == "Invalid input" else out


def create_user(username, password):
    enc_user, enc_pass = _encrypt(username), _encrypt(password)
    if enc_user is None or enc_pass is None:
        raise StoreError("Username/password contains unsupported characters.", 400)

    try:
        db.users().insert_one(
            {
                "userId": user_id_for(username),
                "usernameEnc": enc_user,
                "passwordEnc": enc_pass,
            }
        )
    except DuplicateKeyError:
        raise StoreError("That username is already taken.", 409)

    return {"id": user_id_for(username), "username": username}


def verify_credentials(username, password):
    """Returns the public user dict, or raises StoreError(401)."""
    enc_user, enc_pass = _encrypt(username), _encrypt(password)
    doc = db.users().find_one({"usernameEnc": enc_user}) if enc_user else None

    if doc is None or enc_pass is None or not hmac.compare_digest(doc["passwordEnc"], enc_pass):
        raise StoreError("Invalid username or password.", 401)

    return {"id": doc["userId"], "username": username}


def user_exists(user_id):
    return db.users().count_documents({"userId": user_id}, limit=1) > 0
