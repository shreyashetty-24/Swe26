# Very small stand-in "database" for the HaaS PoC.
#
# There is no real database here. User credentials are appended as plain
# lines of the form "<encrypted-username> <encrypted-password>" to a local
# text file (data/users.txt). Usernames/passwords are encrypted with the
# course cipher (see cipher.py) before they are ever written to disk, and
# decrypted in memory when we need to check them. This is intentionally
# minimal, per the project's "very basic backend" requirement -- swapping
# this module out for a real database later should not require changing
# app.py's calls into it.

import os
import threading

import cipher

# Cipher parameters used for every entry. Must stay the same for every call
# to encrypt/decrypt so that data written earlier can still be read back.
CIPHER_N = 3
CIPHER_D = 1

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
USERS_FILE = os.path.join(DATA_DIR, "users.txt")

# Guards writes to the file since Flask's dev server can handle requests
# on multiple threads.
_lock = threading.Lock()


def _ensure_data_file():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(USERS_FILE):
        open(USERS_FILE, "w", encoding="utf-8").close()


def _read_all_users():
    """Returns a list of (username, password) plaintext tuples, decrypted
    from disk. Skips any malformed/corrupt lines instead of blowing up."""
    _ensure_data_file()
    users = []
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or " " not in line:
                continue
            enc_user, enc_pass = line.split(" ", 1)
            username = cipher.decrypt(enc_user, CIPHER_N, CIPHER_D)
            password = cipher.decrypt(enc_pass, CIPHER_N, CIPHER_D)
            users.append((username, password))
    return users


def username_exists(username):
    return any(u == username for u, _ in _read_all_users())


def verify_credentials(username, password):
    return any(u == username and p == password for u, p in _read_all_users())


def create_user(username, password):
    """Encrypts and appends a new user line. Returns False if the given
    username/password contain characters the cipher can't encode."""
    enc_user = cipher.encrypt(username, CIPHER_N, CIPHER_D)
    enc_pass = cipher.encrypt(password, CIPHER_N, CIPHER_D)
    if enc_user == "Invalid input" or enc_pass == "Invalid input":
        return False

    with _lock:
        _ensure_data_file()
        with open(USERS_FILE, "a", encoding="utf-8") as f:
            f.write(f"{enc_user} {enc_pass}\n")
    return True
