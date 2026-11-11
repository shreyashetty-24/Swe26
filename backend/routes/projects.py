from flask import Blueprint, jsonify

from routes.helpers import acting_user_id, json_body
from stores import checkout_store, hardware_store, project_store

bp = Blueprint("projects", __name__)


def _project_and_hardware(project_id):
    # Checkout/check-in change both the project and the global pool, so the
    # frontend gets both back and doesn't need a second round trip.
    return jsonify(
        ok=True,
        project=project_store.serialize(project_store.get_doc(project_id)),
        hardwareSets=hardware_store.list_all(),
    )


@bp.get("/projects")
def list_projects():
    user_id = acting_user_id()
    return jsonify(ok=True, projects=project_store.list_for_user(user_id))


@bp.post("/projects")
def create_project():
    data = json_body()
    user_id = acting_user_id(data)
    project = project_store.create_project(
        user_id,
        data.get("id"),
        data.get("name"),
        data.get("startDate"),
        data.get("endDate"),
    )
    return jsonify(ok=True, project=project), 201


@bp.post("/projects/join")
def join_project():
    data = json_body()
    user_id = acting_user_id(data)
    return jsonify(ok=True, project=project_store.join_project(user_id, data.get("id")))


@bp.post("/projects/<project_id>/leave")
def leave_project(project_id):
    user_id = acting_user_id()
    project_store.leave_project(user_id, project_id)
    return jsonify(ok=True)


@bp.post("/projects/<project_id>/checkout")
def check_out(project_id):
    data = json_body()
    user_id = acting_user_id(data)
    checkout_store.check_out(user_id, project_id, data.get("hardwareId"), data.get("quantity"))
    return _project_and_hardware(project_id)


@bp.post("/projects/<project_id>/checkin")
def check_in(project_id):
    data = json_body()
    user_id = acting_user_id(data)
    checkout_store.check_in(user_id, project_id, data.get("hardwareId"), data.get("quantity"))
    return _project_and_hardware(project_id)
