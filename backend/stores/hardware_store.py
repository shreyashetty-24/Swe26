# Global hardware capacity, stored in the `haas_hardware` database.
#
# reserve()/release() are single atomic MongoDB updates, so two projects
# racing for the last unit can never both get it.

import db
from errors import StoreError


def serialize(doc):
    return {
        "id": doc["_id"],
        "name": doc["name"],
        "totalCapacity": doc["totalCapacity"],
        "available": doc["available"],
    }


def list_all():
    return [serialize(d) for d in db.hardware_sets().find().sort("_id", 1)]


def get(hardware_id):
    doc = db.hardware_sets().find_one({"_id": hardware_id})
    if doc is None:
        raise StoreError("Selected hardware set could not be found.", 404)
    return doc


def reserve(hardware_id, quantity):
    """Atomically take `quantity` units out of the global pool."""
    doc = db.hardware_sets().find_one_and_update(
        {"_id": hardware_id, "available": {"$gte": quantity}},
        {"$inc": {"available": -quantity}},
    )
    if doc is not None:
        return

    current = get(hardware_id)  # raises 404 if the set doesn't exist
    left = current["available"]
    raise StoreError(
        f"Not enough available. Only {left} unit{'' if left == 1 else 's'} "
        f"of {current['name']} left in the global pool.",
        409,
    )


def release(hardware_id, quantity):
    """Atomically return `quantity` units to the global pool."""
    db.hardware_sets().update_one({"_id": hardware_id}, {"$inc": {"available": quantity}})
