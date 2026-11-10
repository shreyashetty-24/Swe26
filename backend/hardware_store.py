# Very small stand-in "database" for hardware sets.
#
# Same idea as user_store.py: no real database, just a local JSON file
# (data/hardware.json) that gets created with some starting hardware sets
# the first time the server runs. JSON is used here (instead of the plain
# text format in user_store.py) only because hardware sets have a few
# fields (capacity/availability) -- it's still just a flat local file, not
# a real database.

import json
import os
import threading

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
HARDWARE_FILE = os.path.join(DATA_DIR, "hardware.json")

DEFAULT_HARDWARE = [
    {"id": "hw1", "name": "Hardware Set 1", "totalCapacity": 10, "available": 10},
    {"id": "hw2", "name": "Hardware Set 2", "totalCapacity": 5, "available": 5},
]

_lock = threading.Lock()


def _write(hardware_sets):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(HARDWARE_FILE, "w", encoding="utf-8") as f:
        json.dump(hardware_sets, f, indent=2)


def _ensure_file():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(HARDWARE_FILE):
        _write(DEFAULT_HARDWARE)


def _read():
    _ensure_file()
    with open(HARDWARE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def list_hardware():
    return _read()


def find(hardware_id):
    return next((h for h in _read() if h["id"] == hardware_id), None)


def adjust_availability(hardware_id, delta):
    """Adds `delta` (can be negative) to a hardware set's availability.
    Returns the updated hardware set, or None if it doesn't exist."""
    with _lock:
        hardware_sets = _read()
        for h in hardware_sets:
            if h["id"] == hardware_id:
                h["available"] += delta
                _write(hardware_sets)
                return h
        return None
