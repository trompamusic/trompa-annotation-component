# Trompa Annotation Framework

This project contains javascript tools for performing annotations on audio files within the context of
the TROMPA project

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.


## Development

### Test data

For development purposes, you will need a copy of the [Contributor Environment](https://github.com/trompamusic/ce-api) 
installed.

To install, clone and start it using docker:

    git clone https://github.com/trompamusic/ce-api.git
    cd ce-api
    docker-compose build
    docker-compose up

The CE runs at http://localhost:4000

We provide a small test dataset for loading audio. Use the provided importer:

    cd ce-auth-proxy
    python -m venv env
    . env/bin/activate
    pip install -r requirements.txt

    FLASK_APP=authproxy.py flask import-test-data ../sample_audio_nodes.graphql

### Token auth server

Write requests to the CE require [authentication](https://github.com/trompamusic/ce-api/blob/staging/docs/authentication.md).
In order to keep the user secrets out of public js files, we have a small app which will give you a JWT token.

Use the same authproxy app as above:

    FLASK_APP=authproxy.py flask run

perform a `GET` request to `http://localhost:5000/get_token` and you will get back a dictionary with a single
field, `token`. This is your JWT for use in write operations.
