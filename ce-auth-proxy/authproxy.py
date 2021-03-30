import click
from flask import Flask, jsonify
import trompace
import trompace.connection


app = Flask(__name__)


@app.route("/get_token")
def get_token():
    trompace.config.config.load('trompace.ini')

    response = jsonify({"token": trompace.config.config.jwt_token})
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.cli.command()
@click.argument("filename")
def import_test_data(filename):
    """Load some sample data into the CE for the annotation component"""
    trompace.config.config.load('trompace.ini')
    with open(filename, "r") as fp:
        query = fp.read()
        trompace.connection.submit_query(query, auth_required=True)
