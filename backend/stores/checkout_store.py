# Checking hardware out of / back into the global pool on behalf of a
# project. This is the one place that touches two databases at once:
#
#   haas_hardware  -> hardware_sets : global `available` count
#   haas_projects  -> checkouts     : units each project currently holds
#
# MongoDB can't run a transaction across separate databases/servers, so
# each step is a single atomic, guarded update and a failed second step
# undoes the first (see the try/except blocks).
#
# A project holds ONE row per hardware set (not one per checkout), so
# "check in 2 of the 5 I have" is a simple decrement.

from datetime import datetime, timezone

from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

import db
from errors import StoreError
from stores import hardware_store, project_store


def _parse_quantity(raw):
    # bool is a subclass of int in Python; don't let `true` through as 1.
    if isinstance(raw, bool) or not isinstance(raw, int) or raw < 1:
        raise StoreError("Quantity must be a whole number of at least 1.", 400)
    return raw


def _now():
    return datetime.now(timezone.utc)


def _add_to_checkout(project_key, hardware_id, quantity):
    flt = {"projectId": project_key, "hardwareId": hardware_id}
    update = {"$inc": {"quantity": quantity}, "$set": {"updatedAt": _now()}}
    try:
        db.checkouts().update_one(flt, update, upsert=True)
    except DuplicateKeyError:
        # Two concurrent first-time upserts for the same (project, hardware):
        # the loser retries and now takes the plain-update path.
        db.checkouts().update_one(flt, update, upsert=True)


def check_out(user_id, project_id, hardware_id, quantity):
    project = project_store.require_member(user_id, project_id)
    quantity = _parse_quantity(quantity)

    hardware_store.reserve(hardware_id, quantity)  # 404 / 409 if it can't
    try:
        _add_to_checkout(project["_id"], hardware_id, quantity)
    except Exception:
        hardware_store.release(hardware_id, quantity)
        raise


def check_in(user_id, project_id, hardware_id, quantity):
    """Return `quantity` units (any amount up to what the project holds)."""
    project = project_store.require_member(user_id, project_id)
    quantity = _parse_quantity(quantity)

    flt = {"projectId": project["_id"], "hardwareId": hardware_id}
    after = db.checkouts().find_one_and_update(
        {**flt, "quantity": {"$gte": quantity}},
        {"$inc": {"quantity": -quantity}, "$set": {"updatedAt": _now()}},
        return_document=ReturnDocument.AFTER,
    )
    if after is None:
        held = db.checkouts().find_one(flt)
        if held is None:
            raise StoreError("This project has none of that hardware checked out.", 404)
        raise StoreError(
            f"You can't check in {quantity}: this project only has {held['quantity']} checked out.",
            400,
        )

    try:
        hardware_store.release(hardware_id, quantity)
    except Exception:
        _add_to_checkout(project["_id"], hardware_id, quantity)  # undo
        raise

    if after["quantity"] == 0:
        # Only delete if nobody checked more out in the meantime.
        db.checkouts().delete_one({"_id": after["_id"], "quantity": 0})
