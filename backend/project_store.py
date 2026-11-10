# Very small stand-in "database" for projects, mirroring user_store.py /
# hardware_store.py. Projects (and their checkouts) live in a local JSON
# file at data/projects.json -- no real database involved.

import json
import os
import threading
import uuid
from datetime import datetime, timezone

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")

DEFAULT_PROJECTS = [
    {
        "id": "PRJ-1001",
        "name": "Project Alpha",
        "startDate": "2026-10-01",
        "endDate": "2026-10-05",
        "memberIds": [],
        "checkouts": [],
    },
    {
        "id": "PRJ-1002",
        "name": "Project Beta",
        "startDate": "2026-10-03",
        "endDate": "2026-10-04",
        "memberIds": [],
        "checkouts": [],
    },
]

_lock = threading.Lock()


def _write(projects):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
        json.dump(projects, f, indent=2)


def _ensure_file():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(PROJECTS_FILE):
        _write(DEFAULT_PROJECTS)


def _read():
    _ensure_file()
    with open(PROJECTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _find(projects, project_id):
    if not project_id:
        return None
    return next((p for p in projects if p["id"].upper() == project_id.upper()), None)


def _next_project_id(projects):
    nums = []
    for p in projects:
        try:
            nums.append(int(p["id"].replace("PRJ-", "")))
        except ValueError:
            pass
    return f"PRJ-{max(nums + [1000]) + 1}"


def list_projects():
    return _read()


def find(project_id):
    return _find(_read(), project_id)


def create_project(name, start_date, end_date, user_id):
    with _lock:
        projects = _read()
        new_project = {
            "id": _next_project_id(projects),
            "name": name,
            "startDate": start_date,
            "endDate": end_date,
            "memberIds": [user_id],
            "checkouts": [],
        }
        projects.append(new_project)
        _write(projects)
        return new_project


def join_project(project_id, user_id):
    """Returns (project, error) where error is one of
    None / "not_found" / "already_member"."""
    with _lock:
        projects = _read()
        project = _find(projects, project_id)
        if not project:
            return None, "not_found"
        if user_id in project["memberIds"]:
            return project, "already_member"
        project["memberIds"].append(user_id)
        _write(projects)
        return project, None


def leave_project(project_id, user_id):
    with _lock:
        projects = _read()
        project = _find(projects, project_id)
        if not project:
            return None
        project["memberIds"] = [m for m in project["memberIds"] if m != user_id]
        _write(projects)
        return project


def add_checkout(project_id, hardware_id, quantity):
    with _lock:
        projects = _read()
        project = _find(projects, project_id)
        if not project:
            return None
        checkout = {
            "id": f"c-{uuid.uuid4()}",
            "hardwareId": hardware_id,
            "quantity": quantity,
            "checkedOutAt": datetime.now(timezone.utc).isoformat(),
        }
        project["checkouts"].append(checkout)
        _write(projects)
        return checkout


def remove_checkout(project_id, checkout_id):
    """Removes and returns the checkout record, or None if not found."""
    with _lock:
        projects = _read()
        project = _find(projects, project_id)
        if not project:
            return None
        checkout = next((c for c in project["checkouts"] if c["id"] == checkout_id), None)
        if not checkout:
            return None
        project["checkouts"] = [c for c in project["checkouts"] if c["id"] != checkout_id]
        _write(projects)
        return checkout
