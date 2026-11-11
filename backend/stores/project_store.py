# Projects and membership, stored in the `haas_projects` database.
#
# Every project has exactly one *leader* (whoever created it) plus any
# number of ordinary members. `memberIds` lists everyone, leader included.
# The leader can never leave their own project.
#
# Project ids are chosen by the user. `_id` holds the lower-cased id so ids
# are unique case-insensitively (MongoDB enforces that for us); `projectId`
# keeps the capitalisation the user typed for display.

import re
from datetime import date, datetime, timezone

from pymongo.errors import DuplicateKeyError

import db
from errors import StoreError

PROJECT_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{2,31}$")
PROJECT_ID_RULES = (
    "Project ID must be 3-32 characters: letters, numbers, hyphens or "
    "underscores, starting with a letter or number."
)


def _key(project_id):
    return (project_id or "").strip().lower()


def _checkouts_by_project(project_ids):
    by_project = {pid: [] for pid in project_ids}
    for c in db.checkouts().find({"projectId": {"$in": project_ids}}).sort("hardwareId", 1):
        by_project[c["projectId"]].append(
            {
                "hardwareId": c["hardwareId"],
                "quantity": c["quantity"],
                "updatedAt": c["updatedAt"].isoformat(),
            }
        )
    return by_project


def serialize_many(docs):
    checkouts = _checkouts_by_project([d["_id"] for d in docs])
    return [
        {
            "id": d["projectId"],
            "name": d["name"],
            "startDate": d["startDate"],
            "endDate": d["endDate"],
            "leaderId": d["leaderId"],
            "memberIds": d["memberIds"],
            "checkouts": checkouts[d["_id"]],
        }
        for d in docs
    ]


def serialize(doc):
    return serialize_many([doc])[0]


def get_doc(project_id):
    doc = db.projects().find_one({"_id": _key(project_id)})
    if doc is None:
        raise StoreError("No project found with that ID.", 404)
    return doc


def require_member(user_id, project_id):
    doc = get_doc(project_id)
    if user_id not in doc["memberIds"]:
        raise StoreError("You are not a member of this project.", 403)
    return doc


def list_for_user(user_id):
    docs = db.projects().find({"memberIds": user_id}).sort("createdAt", 1)
    return serialize_many(list(docs))


def create_project(user_id, project_id, name, start_date, end_date):
    project_id = (project_id or "").strip()
    name = (name or "").strip()

    if not project_id:
        raise StoreError("Please choose a project ID.", 400)
    if not PROJECT_ID_PATTERN.match(project_id):
        raise StoreError(PROJECT_ID_RULES, 400)
    if not name or not start_date or not end_date:
        raise StoreError("Name, start date, and end date are all required.", 400)
    try:
        start, end = date.fromisoformat(start_date), date.fromisoformat(end_date)
    except (TypeError, ValueError):
        raise StoreError("Dates must be in YYYY-MM-DD format.", 400)
    if end < start:
        raise StoreError("End date cannot be before the start date.", 400)

    doc = {
        "_id": _key(project_id),
        "projectId": project_id,
        "name": name,
        "startDate": start_date,
        "endDate": end_date,
        "leaderId": user_id,
        "memberIds": [user_id],
        "createdAt": datetime.now(timezone.utc),
    }
    try:
        db.projects().insert_one(doc)
    except DuplicateKeyError:
        raise StoreError("That project ID is already taken. Please choose another.", 409)
    return serialize(doc)


def join_project(user_id, project_id):
    key = _key(project_id)
    if not key:
        raise StoreError("Please enter a project ID.", 400)

    result = db.projects().update_one(
        {"_id": key, "memberIds": {"$ne": user_id}},
        {"$push": {"memberIds": user_id}},
    )
    doc = get_doc(project_id)  # 404 if it doesn't exist
    if result.modified_count == 0:
        raise StoreError(f"You are already a member of {doc['name']}.", 409)
    return serialize(doc)


def leave_project(user_id, project_id):
    doc = require_member(user_id, project_id)
    if doc["leaderId"] == user_id:
        raise StoreError("The project leader can't leave their own project.", 403)

    # The leaderId guard is repeated in the query so the rule holds even if
    # leadership changed between the read above and this write.
    db.projects().update_one(
        {"_id": doc["_id"], "leaderId": {"$ne": user_id}},
        {"$pull": {"memberIds": user_id}},
    )
