import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import Navigation from "./Navigation";
import {AUTH_PROXY_URL, CE_URL} from "./Config";

import {Container} from "react-bootstrap-v5";
import {
    BrowserRouter as Router,
    Routes,
    Route
} from "react-router-dom";
import {ApolloClient, ApolloProvider, createHttpLink, InMemoryCache} from '@apollo/client';
import {SessionProvider} from "@inrupt/solid-ui-react";
import {setContext} from "@apollo/client/link/context";

import SessionExample from "./SessionExample";
import KitchenSink from './KitchenSink';

import DefinedTermSetEditorWithUser from "../resources/DefinedTermSetEditor";
import {TrompaClient} from "../index";
import RatingEditorWithUser from "../resources/RatingEditor";
import ToolkitEditorWithUser from "../resources/ToolkitEditor";
import MotivationEditorWithUser from "../resources/MotivationEditor";

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
                <SessionProvider>
                    <Navigation/>
                    <Container fluid="lg">
                        <Routes>
                            <Route path="/" element={<SessionExample trompaClient={trompaClient} />} />
                            <Route path="/kitchensink" element={<KitchenSink/>}/>
                            <Route path="/editors/vocabulary" element={<DefinedTermSetEditorWithUser trompaClient={trompaClient}/>} />
                            <Route path="/editors/rating" element={<RatingEditorWithUser trompaClient={trompaClient}/>}/>
                            <Route path="/editors/toolkit/*" element={<ToolkitEditorWithUser trompaClient={trompaClient}/>}/>
                            <Route path="/editors/motivation" element={<MotivationEditorWithUser trompaClient={trompaClient}/>}/>
                        </Routes>
                    </Container>
                </SessionProvider>
            </ApolloProvider>
        </Router>
    )
}

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
