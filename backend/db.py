# MongoDB connection + the three databases the backend is made of:
#
#   haas_users     -> users                (accounts)
#   haas_projects  -> projects, checkouts  (projects, membership, what each
#                                           project currently has checked out)
#   haas_hardware  -> hardware_sets        (global capacity / availability)
#
# Databases only reference each other by plain ids (e.g. a project stores
# its members' user ids), never by joins, so each one could be moved to its
# own server via the *_MONGO_URI settings in config.py.

from pymongo import ASCENDING, MongoClient

import config

_clients = {}  # uri -> MongoClient (so databases on one server share a client)
_injected_client = None  # tests pass in a mongomock client


def _client_for(uri):
    if _injected_client is not None:
        return _injected_client
    if uri not in _clients:
        _clients[uri] = MongoClient(uri, serverSelectionTimeoutMS=5000)
    return _clients[uri]


def users_db():
    return _client_for(config.USERS_MONGO_URI)[config.USERS_DB_NAME]


def projects_db():
    return _client_for(config.PROJECTS_MONGO_URI)[config.PROJECTS_DB_NAME]


def hardware_db():
    return _client_for(config.HARDWARE_MONGO_URI)[config.HARDWARE_DB_NAME]


# Collection handles ---------------------------------------------------------

def users():
    return users_db()["users"]


def projects():
    return projects_db()["projects"]


def checkouts():
    return projects_db()["checkouts"]


def hardware_sets():
    return hardware_db()["hardware_sets"]


# Startup --------------------------------------------------------------------

def init(client=None):
    """Create indexes and seed hardware. Safe to call repeatedly.

    Pass `client` (e.g. mongomock.MongoClient()) to run every database on
    that one client -- used by the tests."""
    global _injected_client
    _injected_client = client

    # Encrypted username is deterministic, so a unique index on it gives us
    # race-free "username taken" detection.
    users().create_index([("usernameEnc", ASCENDING)], unique=True)
    users().create_index([("userId", ASCENDING)], unique=True)

    # projects._id is the (lower-cased) project id, so uniqueness is free.
    projects().create_index([("memberIds", ASCENDING)])

    # One row per (project, hardware set) holding the units currently out.
    checkouts().create_index(
        [("projectId", ASCENDING), ("hardwareId", ASCENDING)], unique=True
    )

    for hw_id, name, capacity in config.SEED_HARDWARE:
        hardware_sets().update_one(
            {"_id": hw_id},
            {"$setOnInsert": {"name": name, "totalCapacity": capacity, "available": capacity}},
            upsert=True,
        )


def ping():
    """Raises if any of the three databases is unreachable."""
    for database in (users_db(), projects_db(), hardware_db()):
        database.command("ping")
