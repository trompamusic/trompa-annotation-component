import {useState} from 'react';
import {Col, Row} from "react-bootstrap-v5";
import {useLDflexValue} from "@solid/react";
import MultiModalComponent, { SearchConfig, searchTypes } from 'trompa-multimodal-component';

import Annotator from './Annotator';
import {AudioSelector, AudioObject} from "../index";
import {CE_URL} from "./Config";
import TrompaClient from "../API/CEAPI";

const searchConfig = new SearchConfig({
    searchTypes: [searchTypes.DigitalDocument, AudioObject],
});


function SessionExample(props: {trompaClient: TrompaClient}) {
    const userId = useLDflexValue("user");
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
                                    trompaClient={props.trompaClient}
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
