import React, {useState} from 'react';
import MultiModalComponent, { SearchConfig, searchTypes } from 'trompa-multimodal-component'
import './App.css';
import Navigation from "./Navigation";
import {Col, Container, Row} from "react-bootstrap-v5";
import Annotator from './annotator/Annotator';
import {ApolloClient, ApolloProvider, createHttpLink, InMemoryCache} from '@apollo/client';
import {AudioSelector} from "./AudioSelector";
import TrompaClient from "./CEAPI";
import {setContext} from "@apollo/client/link/context";
import {useLDflexValue} from "@solid/react";
import AudioObject from "./Multimodal";
import {CE_URL, AUTH_PROXY_URL} from "./Config";

const searchConfig = new SearchConfig({
    searchTypes: [searchTypes.DigitalDocument, AudioObject],
});

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
    cache: new InMemoryCache()
});

const trompaClient = new TrompaClient(AUTH_PROXY_URL, client);

function App() {
    const userId = useLDflexValue("user");
    const [resource, setResource] = useState<Resource>();
    const [showSearch, setShowSearch] = useState(true);

    return (
      <div>
        <ApolloProvider client={client}>
            <Navigation />
            { userId ?
                <Container fluid="lg">
                    <div className="accordion" id="accordion">
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="headingOne">
                            <button className={`accordion-button ${!showSearch ? 'collapsed': ''}`} type="button" onClick={() => setShowSearch(!showSearch)} aria-expanded="true" aria-controls="collapseOne">
                                Select a resource to annotate
                            </button>
                            </h2>
                            <div id="collapseOne" className={`accordion-collapse collapse ${showSearch ? 'show':''}`} aria-labelledby="headingOne" data-bs-parent="#accordion">
                            <div className="accordion-body">
                                <Row>
                                    <Col>
                                    If you know the ID of the resource:
                                    <AudioSelector
                                        apolloClient={client}
                                        onSelect={(node: any) => {console.log('User loaded resource:', node); setResource(node); setShowSearch(false);}}
                                    />
                                    </Col>
                                </Row>
                                <hr/>
                                <Row>
                                    <Col>
                                    Or search for a resource:
                                    <MultiModalComponent
                                        config={searchConfig}
                                        uri={CE_URL}
                                        placeholderText="Search for an audio item..."
                                        onResultClick={(node: any) => {console.log('User has clicked on:', node); setResource(node); setShowSearch(false);}}
                                    />
                                    </Col>
                                </Row>
                            </div>
                            </div>
                        </div>
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="headingTwo">
                            <button className={`accordion-button ${showSearch ? 'collapsed': ''}`} type="button" onClick={() => setShowSearch(!showSearch)} aria-expanded="false" aria-controls="collapseTwo">
                                Annotate a resource
                            </button>
                            </h2>
                            <div id="collapseTwo" className={`accordion-collapse collapse  ${!showSearch ? 'show':''}`} aria-labelledby="headingTwo" data-bs-parent="#accordion">
                            <div className="accordion-body">
                                {resource ?
                                    <Annotator
                                    user={userId}
                                    trompaClient={trompaClient}
                                    resource={resource}/>
                                    : "Please first search for and select a resource to annotate"
                                }
                            </div>
                            </div>
                        </div>
                    </div>
                    {/* Accordion module does not seem to be ready to be used yet in react-bootstrap v5 alpha version, using straight bootsrap instead */}
                    {/* <Accordion defaultActiveKey="0" activeKey={showSearch ? "0" : "1"}>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Search for a resource</Accordion.Header>
                            <Accordion.Body>
                                <Row>
                                    <MultiModalComponent
                                        config={searchConfig}
                                        uri={MM_COMPONENT_CE_URL}
                                        placeholderText="Search for an audio item..."
                                        onResultClick={(node: any) => {console.log('User has clicked on:', node); setResource(node); setShowSearch(false);}}
                                    />
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                            <Accordion.Header>Annotate</Accordion.Header>
                            <Accordion.Body>
                                {resource ?
                                    <Annotator
                                    user={userId}
                                    trompaClient={trompaClient}
                                    resourceURL={resource?.source}/>
                                    : "Please search for and select a resource to annotate"
                                }
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion> */}
                    
                </Container>
                : "You must be logged in to use the annotator"
            }
        </ApolloProvider>
      </div>
    )
}

export default App;
