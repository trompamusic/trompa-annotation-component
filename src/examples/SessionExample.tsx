import {useState} from 'react';
import {Col, Row} from "react-bootstrap-v5";
import {ApolloClient, createHttpLink, InMemoryCache} from '@apollo/client';
import {setContext} from "@apollo/client/link/context";
import {useSession} from "@inrupt/solid-ui-react";
import MultiModalComponent, {SearchConfig, searchTypes} from 'trompa-multimodal-component';

import Annotator from './Annotator';
import {AudioObject, AudioSelector, SolidClient, TrompaClient} from "../index";
import {AUTH_PROXY_URL, CE_URL} from "./Config";

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
const solidClient = new SolidClient();

const containerInSolidPod = "/public/" // TODO make user configurable

function SessionExample(props: {trompaClient: TrompaClient}) {
    const {session} = useSession();
    const userId = session.info.webId;
    const [resource, setResource] = useState<TrompaAnnotationComponents.Resource>();
    const [showSearch, setShowSearch] = useState(true);

    return (
      <div>
            { userId ?
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
                                        trompaClient={props.trompaClient}
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
                                    solidClient={solidClient}
                                    container={containerInSolidPod}
                                    solidSession={session}
                                    resource={resource}/>
                                    : "Please first search for and select a resource to annotate"
                                }
                            </div>
                            </div>
                        </div>
                    </div>
                : "You must be logged in to use the session annotator example"
            }
      </div>
    )
}

export default SessionExample;
