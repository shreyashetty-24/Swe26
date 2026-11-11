from flask import Blueprint, jsonify

from routes.helpers import acting_user_id
from stores import hardware_store

bp = Blueprint("hardware", __name__)


@bp.get("/hardware")
def list_hardware():
    acting_user_id()
    return jsonify(ok=True, hardwareSets=hardware_store.list_all())
