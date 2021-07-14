import React, {Component, useState} from "react";
import {useWebId} from "@solid/react";
import TrompaClient from "../API/CEAPI";
import {Route, Switch, useRouteMatch } from "react-router-dom";

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

type ToolkitEditorProps = {
    trompaClient: TrompaClient
    webId: string
}

type ToolkitEditorState = {
    data: Array<TrompaAnnotationComponents.RatingDefinition>
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
            data: [],
            error: false
        }
    }

    async componentDidMount() {
        try {
            const response = await this.props.trompaClient.getRatingDefinitionsForUser(
                this.props.webId
            )
            this.setState({data: response.data.Rating})
        } catch (e) {
            this.setState({error: true});
        }
    }


    render() {
        return <p>editor</p>;
    }
}

export default ToolkitEditorWithUser;