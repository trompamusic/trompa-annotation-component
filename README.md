# Trompa Annotation Framework

This project contains javascript tools for performing annotations on audio files within the context of
the TROMPA project

## Development

### Setup

The demo included in this project requires a copy of the 
[TROMPA Contributor Environment](https://github.com/trompamusic/ce-api/) (CE).

To install, clone and start it using docker:

    git clone https://github.com/trompamusic/ce-api.git
    cd ce-api
    docker-compose build
    docker-compose up

The CE runs at http://localhost:4000

We provide a small test dataset for loading some demo audio items to the CE. Use the provided importer:

    cd ce-auth-proxy
    python -m venv env
    . env/bin/activate
    pip install -r requirements.txt

    FLASK_APP=authproxy.py flask import-test-data ../sample_audio_nodes.graphql

### Annotation component setup

Edit the file `src/index.tsx` and uncomment the line

    import "./examples/App";

Install node dependencies and start the development server:

    npm install
    npm start

### Token auth server

Write requests to the CE require [authentication](https://github.com/trompamusic/ce-api/blob/staging/docs/authentication.md).
In order to keep the user secrets out of public js files, we have a small app which will give you a JWT token.

Use the same authproxy app as above:

    FLASK_APP=authproxy.py flask run

perform a `GET` request to `http://localhost:5000/get_token` and you will get back a dictionary with a single
field, `token`. This is your JWT for use in write operations.
