import React, {ChangeEvent, Component, FunctionComponent} from 'react';
import {Button, Col, FormControl, InputGroup, ListGroup, Row} from 'react-bootstrap-v5';
import {useWebId} from "@solid/react";
import {
    ADDITIONAL_TYPE_TAG_COLLECTION, ADDITIONAL_TYPE_TAG_COLLECTION_ELEMENT,
    CreateDefinedTermSet,
    QueryDefinedTermSetForUser
} from "../API/CEAPI";
import {TrompaClient} from "../index";

/**
 * Editor for:
 *   - Fixed Vocabulary Defined Term Sets
 *       - terms are just a single word
 *
 *   - Fixed collection of Motivations
 *       - terms have word, image
 *       - defined term set has optional image or broader motivation
 */


type DefinedTermSetEditorProps = {
    trompaClient: TrompaClient;
    webId: string
}

type DefinedTermSetEditorState = {
    data: Array<TrompaAnnotationComponents.DefinedTermSet>
    selectedDts?: number
    newDtsName: string
    newDtName: string
    error: boolean
}

type DefinedTermSetEditorWithUserProps = {
    trompaClient: TrompaClient;
}

/**
 * A wrapper that ensures that we always give a logged in user to DefinedTermSetEditor
 * @param trompaClient
 * @constructor
 */
const DefinedTermSetEditorWithUser = ({trompaClient}: DefinedTermSetEditorWithUserProps) => {
    const webId = useWebId();

    return <div>
        {webId && <DefinedTermSetEditor trompaClient={trompaClient} webId={webId}/>}
        {!webId && <p>You need to log in to use the editor</p>}
    </div>
}

export class DefinedTermSetEditor extends Component<DefinedTermSetEditorProps, DefinedTermSetEditorState> {

    constructor(props: DefinedTermSetEditorProps) {
        super(props);
        this.state = {
            data: [],
            selectedDts: undefined,
            newDtsName: '',
            newDtName: '',
            error: false
        }
    }

    async componentDidMount() {
        try {
            const response = await this.props.trompaClient.getDefinedTermSetsForUser(
                this.props.webId,
                'https://vocab.trompamusic.eu/vocab#TagCollection'
            )
            this.setState({data: response.data.DefinedTermSet})
        } catch (e) {
            this.setState({error: true});
        }
    }

    createDefinedTermSet = async () => {
        const dts : TrompaAnnotationComponents.DefinedTermSet = {
            type: 'DefinedTermSet',
            creator: this.props.webId,
            additionalType: ADDITIONAL_TYPE_TAG_COLLECTION,
            name: this.state.newDtsName,
            hasDefinedTerm: []
        }
        try {
            const response = await this.props.trompaClient.createOrUpdateDefinedTermSet(dts)
            let existingData: TrompaAnnotationComponents.DefinedTermSet[] = [];
            if (this.state.data !== undefined) {
                existingData = this.state.data.slice();
            }
            const newData: TrompaAnnotationComponents.DefinedTermSet[] = [...existingData, response.data.CreateDefinedTermSet]
            this.setState({data: newData, newDtsName: ''})
        } catch {

        }
    }

    createDefinedTerm = async () => {
        if (this.state.selectedDts === undefined) {
            return
        }
        // New copy of data + DefinedTermSet so that we can modify it
        const newData = [...this.state.data];
        const selectedDts = {...newData[this.state.selectedDts]};
        const dtsIdentifier = selectedDts.identifier!;
        const dt : TrompaAnnotationComponents.DefinedTerm = {
            type: 'DefinedTerm',
            creator: this.props.webId,
            additionalType: ADDITIONAL_TYPE_TAG_COLLECTION_ELEMENT,
            termCode: this.state.newDtName,
        }
        try {
            const response = await this.props.trompaClient.createOrUpdateDefinedTerm(dtsIdentifier, dt)
            let existingData: TrompaAnnotationComponents.DefinedTerm[] = [];
            if (selectedDts.hasDefinedTerm.length) {
                existingData = selectedDts.hasDefinedTerm.slice();
            }
            selectedDts.hasDefinedTerm = [...existingData, response.data];
            newData[this.state.selectedDts] = selectedDts
            this.setState({data: newData, newDtName: ''})
        } catch (e) {
            console.error("Error when creating DefinedTerm")
            console.error(e)
        }
    }

    deleteDefinedTermSet = async (identifier: string, index: number) => {
        try {
            await this.props.trompaClient.deleteDefinedTermSet(identifier);
            const existingData = this.state.data.slice();
            existingData.splice(index, 1);
            this.setState({data: existingData});
        } catch (e) {
            console.debug("error while deleting a DTS")
            console.error(e);
        }
    }

    deleteDefinedTerm = async (dtIdentifier: string, dtIndex: number) => {
        if (this.state.selectedDts === undefined) {
            return
        }
        // New copy of data + DefinedTermSet so that we can modify it
        const newData = [...this.state.data];
        const selectedDts = {...newData[this.state.selectedDts]};
        try {
            await this.props.trompaClient.deleteDefinedTerm(selectedDts.identifier!, dtIdentifier);
            const existingDefinedTerms = selectedDts.hasDefinedTerm.slice();
            existingDefinedTerms.splice(dtIndex, 1);
            selectedDts.hasDefinedTerm = existingDefinedTerms;
            newData[this.state.selectedDts] = selectedDts;
            this.setState({data: newData})
        } catch (e) {
            console.error("Error deleting DefinedTerm");
            console.error(e);
        }
    }

    setSelectedDts = (selected?: number) => {
        this.setState({selectedDts: selected})
    }

    updateNewDtsName = (event: ChangeEvent<HTMLInputElement>) => {
        this.setState({newDtsName: event.target.value})
    }

    updateNewDtName = (event: ChangeEvent<HTMLInputElement>) => {
        this.setState({newDtName: event.target.value})
    }

    render() {
        return <Row><Col lg={6}><ListGroup> {this.state.data &&
        this.state.data.map((definedTermSet, index: number) => {
            return <ListGroup.Item action as={"a"} key={definedTermSet.identifier}
                                   active={this.state.selectedDts === index}
                                   onClick={() => this.setSelectedDts(index)}
            >
                <Row>
                    <Col>
                        {definedTermSet.name}<br/>
                        <small>id: {definedTermSet.identifier}</small>
                    </Col>
                    <Col xs={3}>
                        <Button variant="outline-danger"
                                size="sm" onClick={(e) => {
                            this.deleteDefinedTermSet(definedTermSet.identifier!, index);
                            this.setSelectedDts(undefined)
                            e.stopPropagation();
                        }}>Delete</Button>
                    </Col>
                </Row>
            </ListGroup.Item>
        })
        }
            <ListGroup.Item action as={"a"}>
                <InputGroup>
                    <FormControl
                        placeholder="New Category"
                        aria-label="New Category"
                        type="text" value={this.state.newDtsName}
                        onChange={this.updateNewDtsName}
                    />
                    <Button variant="outline-success"
                            onClick={this.createDefinedTermSet}>
                        Create
                    </Button>
                </InputGroup>
            </ListGroup.Item>
        </ListGroup></Col>

            <Col>
                {this.state.selectedDts !== undefined && this.state.data && this.state.data[this.state.selectedDts] && <>
                    <h4>DefinedTerms</h4>
                    <ListGroup>
                        {this.state.data[this.state.selectedDts].hasDefinedTerm?.map((definedTerm, dtIndex) => {
                            return (
                                <ListGroup.Item action key={definedTerm.identifier} as={"a"}>
                                    <Row>
                                        <Col>
                                            {definedTerm.termCode}
                                        </Col>
                                        <Col xs={3}>
                                            <Button variant="outline-danger"
                                                    size="sm" onClick={() => {
                                                this.deleteDefinedTerm(definedTerm.identifier!, dtIndex)
                                            }}
                                            >Delete</Button>
                                        </Col>
                                    </Row>
                                </ListGroup.Item>
                            )
                        })}
                        <ListGroup.Item action as={"a"}>
                            <InputGroup>
                                <FormControl
                                    placeholder="New Category"
                                    aria-label="New Category"
                                    type="text" value={this.state.newDtName}
                                    onChange={this.updateNewDtName}
                                />
                                <Button variant="outline-success"
                                        onClick={this.createDefinedTerm}>
                                    Create
                                </Button>
                            </InputGroup>
                        </ListGroup.Item>
                    </ListGroup>
                </>
                }
            </Col>
        </Row>
    }
}

export default DefinedTermSetEditorWithUser;