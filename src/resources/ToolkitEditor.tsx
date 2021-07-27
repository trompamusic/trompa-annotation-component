import React, {Component, useState} from "react";
import {useWebId} from "@solid/react";
import TrompaClient from "../API/CEAPI";
import {Route, Switch, useRouteMatch } from "react-router-dom";
import {Button, Col, FormControl, InputGroup, ListGroup, Row} from "react-bootstrap-v5";

type ToolkitEditorWithUserProps = {
    trompaClient: TrompaClient;
}

/**
 * A wrapper that ensures that we always give a logged in user to DefinedTermSetEditor
 * @param trompaClient
 * @constructor
 */
const ToolkitEditorWithUser = ({trompaClient}: ToolkitEditorWithUserProps) => {
    const webId = useWebId();
    let match = useRouteMatch();

    if (!webId) {
        return <p>You need to log in to use the editor</p>
    }
    return <Switch>
        <Route path={`${match.path}/new`}>
            <ToolkitEditor trompaClient={trompaClient} webId={webId}/>
        </Route>
        <Route path={`${match.path}/:toolkitId`}>
            <ToolkitView />
        </Route>
        <Route path={match.path}>
            <ToolkitList />
        </Route>
    </Switch>
}

// TODO: This is duplicated in MotivationEditor
const motivations = [
    'assessing',
    'bookmarking',
    'classifying',
    'commenting',
    'describing',
    'editing',
    'highlighting',
    'identifying',
    'linking',
    'moderating',
    'questioning',
    'replying',
    'tagging'
]

type ToolkitEditorProps = {
    trompaClient: TrompaClient
    webId: string
}

type ToolkitEditorState = {
    existingRatings: Array<TrompaAnnotationComponents.RatingDefinition>
    existingMotivations: Array<TrompaAnnotationComponents.AnnotationCEMotivation>
    existingTags: Array<TrompaAnnotationComponents.DefinedTermSet>
    toolkitName: string
    toolkitDescription?: string
    toolkitContents: Array<TrompaAnnotationComponents.RatingDefinition | TrompaAnnotationComponents.AnnotationCEMotivation |
        TrompaAnnotationComponents.DefinedTermSet>
    error: boolean
}

const ToolkitView = () => {
    return <p>view</p>
}

const ToolkitList = () => {
    return <p>list</p>
}

export class ToolkitEditor extends Component<ToolkitEditorProps, ToolkitEditorState> {

    constructor(props: ToolkitEditorProps) {
        super(props);
        this.state = {
            toolkitContents: [],
            existingMotivations: [],
            existingRatings: [],
            existingTags: [],
            toolkitName: '',
            toolkitDescription: '',
            error: false
        }
    }

    async componentDidMount() {
        try {
            const ratings = await this.props.trompaClient.getRatingDefinitionsForUser(this.props.webId);
            const tags = await this.props.trompaClient.getDefinedTermSetsForUser(
                this.props.webId,
                'https://vocab.trompamusic.eu/vocab#TagCollection'
            );
            const motivations = await this.props.trompaClient.getMotivationsForUser(this.props.webId);
            this.setState({
                existingTags: tags.data.DefinedTermSet,
                existingRatings: ratings.data.Rating,
                existingMotivations: motivations.data.AnnotationCEMotivation
            })
        } catch (e) {
            this.setState({error: true});
        }
    }


    // TODO: The cards for each item in this list also exist in the other editors, could abstracted
    // TODO: DefinedTermSet cards could also show the terms in it
    render() {
        return <Row><Col lg={6}>
            <h3>Standard Motivations</h3>
            <ListGroup>
            {motivations.map(m => {
                return <ListGroup.Item action key={m} as={"a"}>
                    <Row>
                        <Col>
                            oa:{m}
                        </Col>
                        <Col xs={3}>
                            <Button variant="outline-primary"
                                    size="sm"
                            >Add</Button>
                        </Col>
                    </Row>
                </ListGroup.Item>
            })}
            </ListGroup>
            <h3>Custom Motivations</h3>
            <ListGroup>
            {this.state.existingMotivations && this.state.existingMotivations.map(motivation => {
                return (
                    <ListGroup.Item action key={motivation.identifier} as={"a"}>
                        <Row>
                            <Col>
                                {motivation.title}
                            </Col>
                            <Col xs={3}>
                                <Button variant="outline-primary"
                                        size="sm"
                                >Add</Button>
                            </Col>
                        </Row>
                    </ListGroup.Item>
                )
            })}
            </ListGroup>
            <h3>Fixed Vocabularies</h3>
            <ListGroup>
                {this.state.existingTags && this.state.existingTags.map(tag => {
                    return (
                        <ListGroup.Item action key={tag.identifier} as={"a"}>
                            <Row>
                                <Col>
                                    {tag.name}
                                </Col>
                                <Col xs={3}>
                                    <Button variant="outline-primary"
                                            size="sm"
                                    >Add</Button>
                                </Col>
                            </Row>
                        </ListGroup.Item>
                    )
                })}
            </ListGroup>
            <h3>Rating Definitions</h3>
            <ListGroup>
                {this.state.existingRatings && this.state.existingRatings.map(rating => {
                    return (
                        <ListGroup.Item action key={rating.identifier} as={"a"}>
                            <Row>
                                <Col>
                                    {rating.name} ({rating.worstRating}&ndash;{rating.bestRating})
                                </Col>
                                <Col xs={3}>
                                    <Button variant="outline-primary"
                                            size="sm"
                                    >Add</Button>
                                </Col>
                            </Row>
                        </ListGroup.Item>
                    )
                })}
            </ListGroup>
        </Col>
        <Col>
            <h4>Create</h4>
            <ListGroup>
                <ListGroup.Item action as={"a"}>
                    <InputGroup>
                        {/*<FormControl*/}
                        {/*    placeholder="New Category"*/}
                        {/*    aria-label="New Category"*/}
                        {/*    type="text" value={this.state.newDtsName}*/}
                        {/*    onChange={this.updateNewDtsName}*/}
                        {/*/>*/}
                        {/*<Button variant="outline-success"*/}
                        {/*        onClick={this.createDefinedTermSet}>*/}
                        {/*    Create*/}
                        {/*</Button>*/}
                    </InputGroup>
                </ListGroup.Item>
            </ListGroup>
        </Col>
    </Row>
    }
}

export default ToolkitEditorWithUser;