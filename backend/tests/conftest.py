import os
import sys

import mongomock
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402


@pytest.fixture()
def client():
    app = create_app(mongo_client=mongomock.MongoClient())
    return app.test_client()


class Api:
    """Tiny helper: signs users up and calls the API as them."""

    def __init__(self, client):
        self.c = client

    def signup(self, name, pw="pw123"):
        r = self.c.post("/api/signup", json={"username": name, "password": pw})
        assert r.status_code == 200, r.get_json()
        return r.get_json()["user"]["id"]

    def post(self, path, uid, **body):
        return self.c.post(f"/api{path}", json={"userId": uid, **body})

    def get(self, path, uid):
        return self.c.get(f"/api{path}?userId={uid}")


@pytest.fixture()
def api(client):
    return Api(client)
