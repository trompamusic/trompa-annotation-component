import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Navigation from "./Navigation";
import {AUTH_PROXY_URL, CE_URL} from "./Config";

import {Container} from "react-bootstrap-v5";
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import {ApolloClient, ApolloProvider, createHttpLink, InMemoryCache} from '@apollo/client';
import {setContext} from "@apollo/client/link/context";

import SessionExample from "./SessionExample";
import KitchenSink from './KitchenSink';

import DefinedTermSetEditorWithUser from "../resources/DefinedTermSetEditor";
import {TrompaClient} from "../index";

const httpLink = createHttpLink({
    uri: CE_URL,
});

const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = localStorage.getItem('CEAuthToken');
    // return the headers to the context so httpLink can read them
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    }
});

const client = new ApolloClient({
    uri: CE_URL,
    link: authLink.concat(httpLink),
    // Apollo cache expects that items have an id field called `id`, but ours is `identifier`.
    // tell it globally that it should use identifier.
    cache: new InMemoryCache({
        dataIdFromObject(responseObject) {
            return `${responseObject.__typename}:${responseObject.identifier}`
        }
    })
});

const trompaClient = new TrompaClient(AUTH_PROXY_URL, client);

function App() {
    return (
        <Router>
            <ApolloProvider client={client}>
                <Navigation/>
                <Container fluid="lg">
                    <Switch>
                        <Route exact path="/">
                            <SessionExample trompaClient={trompaClient}/>
                        </Route>
                        <Route path="/kitchensink">
                            <KitchenSink/>
                        </Route>
                        <Route path="/editors/vocabulary">
                            <DefinedTermSetEditorWithUser trompaClient={trompaClient}/>
                        </Route>
                    </Switch>
                </Container>
            </ApolloProvider>
        </Router>
    )
}

ReactDOM.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>,
    document.getElementById('root')
);
