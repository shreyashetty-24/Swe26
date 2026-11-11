from flask import jsonify, request

import db
from errors import StoreError
from stores import user_store


def json_body():
    return request.get_json(silent=True) or {}


def acting_user_id(data=None):
    """The id of the user making the request.

    There are no sessions/tokens in this app (see README), so the frontend
    sends its logged-in user's id with each request. We at least check it
    belongs to a real account.
    """
    if data is None:
        data = json_body()
    user_id = data.get("userId") or request.args.get("userId")
    if not isinstance(user_id, str) or not user_id or not user_store.user_exists(user_id):
        raise StoreError("You must be logged in.", 401)
    return user_id


def register_error_handler(app):
    @app.errorhandler(StoreError)
    def _handle(err):
        return jsonify(ok=False, error=err.message), err.status
