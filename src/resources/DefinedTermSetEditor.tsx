import React, {ChangeEvent, Component, FunctionComponent} from 'react';
import {Button, Col, FormControl, InputGroup, ListGroup, Row} from 'react-bootstrap-v5';
import {ApolloClient} from "@apollo/client";
import {LDflexValue, useLDflexValue, useWebId} from "@solid/react";
import {
    ADDITIONAL_TYPE_TAG_COLLECTION,
    CreateDefinedTermSet,
    QueryDefinedTermSetForUser
} from "../API/CEAPI";

/**
 * Editor for:
 *   - Fixed Vocabulary Defined Term Sets
 *       - terms are just a single word
 *
 *   - Fixed collection of Motivations
 *       - terms have word, image, and broader motivation
 */


type DefinedTermSetEditorProps = {
    apolloClient: ApolloClient<any>
    webId: string
}

type DefinedTermSetEditorState = {
    data: Array<TrompaAnnotationComponents.DefinedTermSet>
    selectedDts?: number
    newDtsName: string
    newDtName: string
}

type DefinedTermSetEditorWithUserProps = {
    apolloClient: ApolloClient<any>
}

/**
 * A wrapper that ensures that we always give a logged in user to DefinedTermSetEditor
 * @param apolloClient
 * @constructor
 */
const DefinedTermSetEditorWithUser: FunctionComponent<DefinedTermSetEditorWithUserProps> = ({apolloClient}) => {
    const userId = useLDflexValue("user");
    const webId = useWebId();

    return <div>
        {webId && <DefinedTermSetEditor apolloClient={apolloClient} webId={webId}/>}
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
            newDtName: ''
        }
    }

    async componentDidMount() {
        console.debug("user is", this.props.webId)
        const response = await this.props.apolloClient.query({
            query: QueryDefinedTermSetForUser,
            variables: {
                creator: this.props.webId,
                additionalType: "https://vocab.trompamusic.eu/vocab#TagCollection"
            }
        });
        if (response.errors) {
        } else {
            this.setState({data: response.data.DefinedTermSet})
        }
    }

    createDefinedTermSet = () => {
        // TODO: Should use the CEAPI method instead of apollo
        console.debug("gonna mutate")
        this.props.apolloClient.mutate({
            mutation: CreateDefinedTermSet,
            variables: {
                creator: this.props.webId,
                name: this.state.newDtsName,
                additionalType: ADDITIONAL_TYPE_TAG_COLLECTION
            }
        }).then((data) => {
            let existingData: TrompaAnnotationComponents.DefinedTermSet[] = [];
            if (this.state.data !== undefined) {
                existingData = this.state.data.slice();
            }
            const newData: TrompaAnnotationComponents.DefinedTermSet[] = [...existingData, data.data.CreateDefinedTermSet]
            this.setState({data: newData, newDtsName: ''})
        })
    }

    createDefinedTerm = () => {
        /*
        createDefinedTerm({variables: {
                                            creator: this.props.webId,
                                            termCode: newDt,
                                            additionalType: ADDITIONAL_TYPE_TAG_COLLECTION_ELEMENT
                                        }}).then((d) => {
                                        addDefinedTermToDefinedTermSet({variables: {
                                                fromId: data.DefinedTermSet[selectedDts].identifier,
                                                toId: d.data.CreateDefinedTerm.identifier
                                            }}
                                        )
                                    })
                                }
         */
    }

    deleteDefinedTermSet = (identifier: string, index: number) => {
        //{variables: {identifier: definedTermSet.identifier}
    }

    deleteDefinedTerm = (dtsIdentifier: string, dtsIndex: number, dtIdentifier: string, dtIndex: number) => {

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
                        {definedTermSet.name}
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
                                <ListGroup.Item action>
                                    <Row>
                                        <Col>
                                            {definedTerm.termCode}
                                        </Col>
                                        <Col xs={3}>
                                            <Button variant="outline-danger"
                                                    size="sm" onClick={() => {
                                                this.deleteDefinedTerm(this.state.data![this.state.selectedDts!].identifier!,
                                                    this.state.selectedDts!,
                                                    definedTerm.identifier!,
                                                    dtIndex)
                                            }}
                                            >Delete</Button>
                                        </Col>
                                    </Row>
                                </ListGroup.Item>
                            )
                        })}
                        <ListGroup.Item action>
                            <InputGroup>
                                <FormControl
                                    placeholder="New Category"
                                    aria-label="New Category"
                                    type="text" value={this.state.newDtName}
                                    onChange={this.updateNewDtName}
                                />
                                <Button variant="outline-success"
                                        onClick={() => this.createDefinedTerm}>
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