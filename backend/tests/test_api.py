import threading

import mongomock

import db
from app import create_app


def mk_project(api, uid, pid="Robotics-2026"):
    r = api.post("/projects", uid, id=pid, name="Robotics", startDate="2026-10-01", endDate="2026-10-05")
    assert r.status_code == 201, r.get_json()
    return r.get_json()["project"]


# ---- auth ------------------------------------------------------------------

def test_signup_login_roundtrip(client):
    r = client.post("/api/signup", json={"username": "ann", "password": "pw123"})
    assert r.get_json() == {"ok": True, "user": {"id": "u-ann", "username": "ann"}}
    assert client.post("/api/signup", json={"username": "ann", "password": "x"}).status_code == 409
    assert client.post("/api/login", json={"username": "ann", "password": "pw123"}).status_code == 200
    assert client.post("/api/login", json={"username": "ann", "password": "nope"}).status_code == 401
    assert client.post("/api/login", json={"username": "ghost", "password": "pw123"}).status_code == 401


def test_password_is_not_stored_in_plaintext(client):
    client.post("/api/signup", json={"username": "ann", "password": "pw123"})
    doc = db.users().find_one({})
    assert "pw123" not in str(doc) and "ann" not in doc["usernameEnc"]


def test_requests_need_a_real_user(api):
    assert api.get("/projects", "u-nobody").status_code == 401


# ---- multiple databases ----------------------------------------------------

def test_data_is_split_across_three_databases(api):
    uid = api.signup("ann")
    mk_project(api, uid)
    api.post("/projects/robotics-2026/checkout", uid, hardwareId="hw1", quantity=2)
    assert db.users_db().list_collection_names() == ["users"]
    assert sorted(db.projects_db().list_collection_names()) == ["checkouts", "projects"]
    assert db.hardware_db().list_collection_names() == ["hardware_sets"]
    assert len({db.users_db().name, db.projects_db().name, db.hardware_db().name}) == 3


# ---- custom project ids ----------------------------------------------------

def test_custom_project_id_is_kept_as_typed(api):
    uid = api.signup("ann")
    assert mk_project(api, uid, "Robotics-2026")["id"] == "Robotics-2026"


def test_project_ids_unique_case_insensitively(api):
    ann, bob = api.signup("ann"), api.signup("bob")
    mk_project(api, ann, "Robotics-2026")
    r = api.post("/projects", bob, id="ROBOTICS-2026", name="x", startDate="2026-10-01", endDate="2026-10-02")
    assert r.status_code == 409


def test_invalid_project_ids_rejected(api):
    uid = api.signup("ann")
    for bad in ["", "ab", "has space", "bad/slash", "-lead", "x" * 33, "emoji😀id"]:
        r = api.post("/projects", uid, id=bad, name="x", startDate="2026-10-01", endDate="2026-10-02")
        assert r.status_code == 400, bad


def test_join_by_custom_id_any_case(api):
    ann, bob = api.signup("ann"), api.signup("bob")
    mk_project(api, ann, "Robotics-2026")
    r = api.post("/projects/join", bob, id="  robotics-2026 ")
    assert r.status_code == 200
    assert r.get_json()["project"]["id"] == "Robotics-2026"
    assert api.post("/projects/join", bob, id="robotics-2026").status_code == 409
    assert api.post("/projects/join", bob, id="nope-123").status_code == 404


def test_end_before_start_rejected(api):
    uid = api.signup("ann")
    r = api.post("/projects", uid, id="abc", name="x", startDate="2026-10-05", endDate="2026-10-01")
    assert r.status_code == 400


# ---- leader vs member ------------------------------------------------------

def test_creator_is_leader_and_cannot_leave(api):
    ann = api.signup("ann")
    p = mk_project(api, ann)
    assert p["leaderId"] == ann and p["memberIds"] == [ann]
    r = api.post("/projects/robotics-2026/leave", ann)
    assert r.status_code == 403
    assert [x["id"] for x in api.get("/projects", ann).get_json()["projects"]] == ["Robotics-2026"]


def test_member_can_leave_and_rejoin(api):
    ann, bob = api.signup("ann"), api.signup("bob")
    mk_project(api, ann)
    api.post("/projects/join", bob, id="robotics-2026")
    assert api.post("/projects/robotics-2026/leave", bob).status_code == 200
    assert api.get("/projects", bob).get_json()["projects"] == []
    proj = api.get("/projects", ann).get_json()["projects"][0]
    assert proj["memberIds"] == [ann]
    assert api.post("/projects/join", bob, id="robotics-2026").status_code == 200


def test_non_member_cannot_leave(api):
    ann, bob = api.signup("ann"), api.signup("bob")
    mk_project(api, ann)
    assert api.post("/projects/robotics-2026/leave", bob).status_code == 403


# ---- hardware: checkout + partial check-in ---------------------------------

def hw(api, uid):
    return {h["id"]: h for h in api.get("/hardware", uid).get_json()["hardwareSets"]}


def test_checkout_and_partial_checkin(api):
    uid = api.signup("ann")
    mk_project(api, uid)

    r = api.post("/projects/robotics-2026/checkout", uid, hardwareId="hw1", quantity=5)
    assert r.status_code == 200
    assert r.get_json()["hardwareSets"][0]["available"] == 5
    assert r.get_json()["project"]["checkouts"][0]["quantity"] == 5

    # a second checkout of the same set merges into one row
    r = api.post("/projects/robotics-2026/checkout", uid, hardwareId="hw1", quantity=2)
    assert r.get_json()["project"]["checkouts"][0]["quantity"] == 7
    assert len(r.get_json()["project"]["checkouts"]) == 1

    # check in only 3 of the 7
    r = api.post("/projects/robotics-2026/checkin", uid, hardwareId="hw1", quantity=3)
    assert r.status_code == 200
    assert r.get_json()["project"]["checkouts"][0]["quantity"] == 4
    assert hw(api, uid)["hw1"]["available"] == 6

    # the rest; row disappears at zero
    r = api.post("/projects/robotics-2026/checkin", uid, hardwareId="hw1", quantity=4)
    assert r.get_json()["project"]["checkouts"] == []
    assert hw(api, uid)["hw1"]["available"] == 10


def test_cannot_check_in_more_than_held(api):
    uid = api.signup("ann")
    mk_project(api, uid)
    api.post("/projects/robotics-2026/checkout", uid, hardwareId="hw1", quantity=2)
    r = api.post("/projects/robotics-2026/checkin", uid, hardwareId="hw1", quantity=3)
    assert r.status_code == 400 and "only has 2" in r.get_json()["error"]
    assert hw(api, uid)["hw1"]["available"] == 8  # untouched
    assert api.post("/projects/robotics-2026/checkin", uid, hardwareId="hw2", quantity=1).status_code == 404


def test_one_project_cannot_check_in_anothers_hardware(api):
    ann, bob = api.signup("ann"), api.signup("bob")
    mk_project(api, ann, "proj-a")
    mk_project(api, bob, "proj-b")
    api.post("/projects/proj-a/checkout", ann, hardwareId="hw1", quantity=3)
    assert api.post("/projects/proj-b/checkin", bob, hardwareId="hw1", quantity=1).status_code == 404
    assert api.post("/projects/proj-a/checkin", bob, hardwareId="hw1", quantity=1).status_code == 403


def test_bad_quantities_rejected(api):
    uid = api.signup("ann")
    mk_project(api, uid)
    for q in [0, -1, 1.5, "2", True, None]:
        assert api.post("/projects/robotics-2026/checkout", uid, hardwareId="hw1", quantity=q).status_code == 400, q
    assert hw(api, uid)["hw1"]["available"] == 10


def test_checkout_limited_by_global_pool(api):
    ann, bob = api.signup("ann"), api.signup("bob")
    mk_project(api, ann, "proj-a")
    mk_project(api, bob, "proj-b")
    assert api.post("/projects/proj-a/checkout", ann, hardwareId="hw2", quantity=4).status_code == 200
    r = api.post("/projects/proj-b/checkout", bob, hardwareId="hw2", quantity=2)
    assert r.status_code == 409 and "Only 1 unit of Hardware Set 2" in r.get_json()["error"]
    assert api.post("/projects/proj-b/checkout", bob, hardwareId="nope", quantity=1).status_code == 404


def test_non_member_cannot_check_out(api):
    ann, bob = api.signup("ann"), api.signup("bob")
    mk_project(api, ann)
    assert api.post("/projects/robotics-2026/checkout", bob, hardwareId="hw1", quantity=1).status_code == 403


def test_members_share_the_projects_checkouts(api):
    ann, bob = api.signup("ann"), api.signup("bob")
    mk_project(api, ann)
    api.post("/projects/join", bob, id="robotics-2026")
    api.post("/projects/robotics-2026/checkout", ann, hardwareId="hw1", quantity=4)
    r = api.post("/projects/robotics-2026/checkin", bob, hardwareId="hw1", quantity=1)
    assert r.get_json()["project"]["checkouts"][0]["quantity"] == 3


def test_concurrent_checkouts_never_oversell(api):
    ann = api.signup("ann")
    mk_project(api, ann)
    results = []

    def grab():
        r = api.post("/projects/robotics-2026/checkout", ann, hardwareId="hw2", quantity=1)
        results.append(r.status_code)

    threads = [threading.Thread(target=grab) for _ in range(12)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert results.count(200) == 5 and results.count(409) == 7
    assert hw(api, ann)["hw2"]["available"] == 0


def test_failed_checkout_write_returns_units_to_pool(api, monkeypatch):
    from stores import checkout_store
    uid = api.signup("ann")
    mk_project(api, uid)

    def boom(*a, **k):
        raise RuntimeError("db down")

    monkeypatch.setattr(checkout_store, "_add_to_checkout", boom)
    try:
        api.post("/projects/robotics-2026/checkout", uid, hardwareId="hw1", quantity=3)
    except RuntimeError:
        pass
    assert hw(api, uid)["hw1"]["available"] == 10


def test_seed_is_idempotent_and_keeps_availability(api):
    uid = api.signup("ann")
    mk_project(api, uid)
    api.post("/projects/robotics-2026/checkout", uid, hardwareId="hw1", quantity=3)
    db.init(db._injected_client)  # simulate a server restart
    assert hw(api, uid)["hw1"]["available"] == 7


def test_health(client):
    assert client.get("/api/health").get_json() == {"status": "ok"}
