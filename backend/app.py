# Flask API for Project Hardware Checkout: auth, projects (with leader/member
# roles) and hardware checkout. Data lives in three MongoDB databases -- see db.py.

import os
import sys

from flask import Flask, abort, jsonify, send_from_directory
from flask_cors import CORS
from pymongo.errors import PyMongoError

import db
from routes import auth, hardware, projects
from routes.helpers import register_error_handler

DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")


def create_app(mongo_client=None):
    """`mongo_client` lets tests run against an in-memory MongoDB."""
    app = Flask(__name__, static_folder=None)
    CORS(app)  # Allow the Vite dev server (different port) to call this API.

    db.init(mongo_client)

    register_error_handler(app)
    app.register_blueprint(auth.bp, url_prefix="/api")
    app.register_blueprint(projects.bp, url_prefix="/api")
    app.register_blueprint(hardware.bp, url_prefix="/api")

    @app.get("/api/health")
    def health():
        try:
            db.ping()
        except PyMongoError:
            return jsonify(status="degraded", error="MongoDB is unreachable."), 503
        return jsonify(status="ok")

    # Serve the built React app (production / Heroku).
    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path):
        if path.startswith("api/"):
            abort(404)
        if path and os.path.isfile(os.path.join(DIST, path)):
            return send_from_directory(DIST, path)
        return send_from_directory(DIST, "index.html")  # React Router fallback

    return app


if __name__ == "__main__":
    try:
        application = create_app()
    except PyMongoError as exc:
        sys.exit(
            "Could not connect to MongoDB. Check MONGO_URI in backend/.env (username, "
            "URL-encoded password), and that your IP is allowed under Atlas -> Network Access.\n"
            f"({exc.__class__.__name__}: {exc})"
        )
    application.run(debug=True, port=5000)
