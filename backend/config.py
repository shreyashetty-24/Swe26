# Runtime configuration, read from environment variables.
#
# The backend is split across three MongoDB *databases*, each owning one
# concern. They can live on the same MongoDB server (the default) or on
# different servers: set USERS_MONGO_URI / PROJECTS_MONGO_URI /
# HARDWARE_MONGO_URI to override MONGO_URI for just that database.

import os

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")

USERS_DB_NAME = os.environ.get("USERS_DB_NAME", "haas_users")
PROJECTS_DB_NAME = os.environ.get("PROJECTS_DB_NAME", "haas_projects")
HARDWARE_DB_NAME = os.environ.get("HARDWARE_DB_NAME", "haas_hardware")

USERS_MONGO_URI = os.environ.get("USERS_MONGO_URI", MONGO_URI)
PROJECTS_MONGO_URI = os.environ.get("PROJECTS_MONGO_URI", MONGO_URI)
HARDWARE_MONGO_URI = os.environ.get("HARDWARE_MONGO_URI", MONGO_URI)

# Hardware sets created on first start if the hardware database is empty.
# (id, name, total capacity)
SEED_HARDWARE = [
    ("hw1", "Hardware Set 1", 10),
    ("hw2", "Hardware Set 2", 5),
]
