# Flask API backing HaaS: auth, projects (with leader/member roles) and
# hardware checkout. Data lives in three MongoDB databases -- see db.py.

import sys

from flask import Flask, jsonify
from flask_cors import CORS
from pymongo.errors import PyMongoError

import db
from routes import auth, hardware, projects
from routes.helpers import register_error_handler


def create_app(mongo_client=None):
    """`mongo_client` lets tests run against an in-memory MongoDB."""
    app = Flask(__name__)
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

    return app


if __name__ == "__main__":
    try:
        application = create_app()
    except PyMongoError as exc:
        sys.exit(
            "Could not connect to MongoDB. Is it running, and is MONGO_URI correct?\n"
            f"({exc.__class__.__name__}: {exc})"
        )
    application.run(debug=True, port=5000)
