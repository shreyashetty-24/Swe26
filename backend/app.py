# Very basic Flask API backing the whole HaaS app: login/signup, projects,
# and hardware checkout/check-in.
#
# Deliberately minimal: no ORM, no real database, no sessions/tokens. Just
# plain routes the React frontend can call so the app is backed by a real
# (if tiny) server instead of in-memory React state. Everything is
# persisted locally via user_store.py / project_store.py / hardware_store.py.

from flask import Flask, jsonify, request
from flask_cors import CORS

import hardware_store
import project_store
import user_store

app = Flask(__name__)
CORS(app)  # Allow the Vite dev server (different port) to call this API.


def user_payload(username):
    # No real "user id" concept yet -- derive a stable one from the
    # username so the rest of the frontend (project membership, etc.)
    # has something unique to key off of.
    return {"id": f"u-{username}", "username": username}


@app.post("/api/signup")
def signup():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify(ok=False, error="Username and password are required."), 400

    if " " in username or " " in password:
        return jsonify(ok=False, error="Username and password cannot contain spaces."), 400

    if user_store.username_exists(username):
        return jsonify(ok=False, error="That username is already taken."), 409

    if not user_store.create_user(username, password):
        return (
            jsonify(ok=False, error="Username/password contains unsupported characters."),
            400,
        )

    return jsonify(ok=True, user=user_payload(username))


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify(ok=False, error="Username and password are required."), 400

    if not user_store.verify_credentials(username, password):
        return jsonify(ok=False, error="Invalid username or password."), 401

    return jsonify(ok=True, user=user_payload(username))


# --- Projects & hardware ----------------------------------------------------
# These follow the same basic style as HW6/app.py: plain @app.route(...)
# functions that read query-string args with request.args.get(...) and
# return a small jsonify(...) payload with a human-readable "message".
# Persistence is handled by project_store.py / hardware_store.py (simple
# local JSON files, no real database).

@app.route('/api/projects', methods=['GET'])
def getProjects():
    return jsonify(project_store.list_projects())


@app.route('/api/hardware', methods=['GET'])
def getHardware():
    return jsonify(hardware_store.list_hardware())


@app.route('/api/createProject', methods=['GET'])
def createProject():
    name = request.args.get('name')
    startDate = request.args.get('startDate')
    endDate = request.args.get('endDate')
    userId = request.args.get('userId')

    if not name or not startDate or not endDate or not userId:
        return jsonify({'message': 'name, startDate, endDate, and userId are all required'}), 400
    if endDate < startDate:
        return jsonify({'message': 'End date cannot be before the start date'}), 400

    project = project_store.create_project(name, startDate, endDate, userId)
    return jsonify({
        'project': project,
        'message': f'Created {project["id"]}',
    })


@app.route('/api/joinProject', methods=['GET'])
def joinProject():
    projectId = request.args.get('projectId')
    userId = request.args.get('userId')

    project, error = project_store.join_project(projectId, userId)

    if error == 'not_found':
        return jsonify({'projectId': projectId, 'message': f'No project found with id {projectId}'}), 404
    if error == 'already_member':
        return jsonify({'projectId': projectId, 'message': f'Already a member of {projectId}'}), 409

    return jsonify({
        'projectId': projectId,
        'project': project,
        'message': f'Joined {projectId}',
    })


@app.route('/api/leaveProject', methods=['GET'])
def leaveProject():
    projectId = request.args.get('projectId')
    userId = request.args.get('userId')

    project = project_store.leave_project(projectId, userId)
    if not project:
        return jsonify({'projectId': projectId, 'message': f'No project found with id {projectId}'}), 404

    return jsonify({
        'projectId': projectId,
        'project': project,
        'message': f'Left {projectId}',
    })


@app.route('/api/checkOutHardware', methods=['GET'])
def checkOut_hardware():
    projectId = request.args.get('projectId')
    hardwareId = request.args.get('hardwareId')
    qty = request.args.get('qty')

    try:
        qty = int(qty)
    except (TypeError, ValueError):
        return jsonify({'projectId': projectId, 'message': 'qty must be a whole number'}), 400
    if qty <= 0:
        return jsonify({'projectId': projectId, 'message': 'qty must be at least 1'}), 400

    hardware = hardware_store.find(hardwareId)
    if not hardware:
        return jsonify({'projectId': projectId, 'message': f'No hardware set found with id {hardwareId}'}), 404
    if hardware['available'] < qty:
        return jsonify({
            'projectId': projectId,
            'message': f'Only {hardware["available"]} unit(s) of {hardware["name"]} left in the global pool',
        }), 409

    checkout = project_store.add_checkout(projectId, hardwareId, qty)
    if not checkout:
        return jsonify({'projectId': projectId, 'message': f'No project found with id {projectId}'}), 404

    hardware_store.adjust_availability(hardwareId, -qty)

    return jsonify({
        'projectId': projectId,
        'qty': qty,
        'checkout': checkout,
        'message': f'{qty} hardware checked out',
    })


@app.route('/api/checkInHardware', methods=['GET'])
def checkIn_hardware():
    projectId = request.args.get('projectId')
    checkoutId = request.args.get('checkoutId')

    checkout = project_store.remove_checkout(projectId, checkoutId)
    if not checkout:
        return jsonify({'projectId': projectId, 'message': 'Matching checkout not found'}), 404

    hardware_store.adjust_availability(checkout['hardwareId'], checkout['quantity'])

    return jsonify({
        'projectId': projectId,
        'qty': checkout['quantity'],
        'message': f'{checkout["quantity"]} hardware checked in',
    })


@app.get("/api/health")
def health():
    return jsonify(status="ok")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
