import React, {Component} from "react";
import TrompaClient from "../API/CEAPI";
import {Route, Routes} from "react-router-dom";
import {useSession} from "@inrupt/solid-ui-react";

type ToolkitEditorWithUserProps = {
    trompaClient: TrompaClient;
}

/**
 * A wrapper that ensures that we always give a logged in user to DefinedTermSetEditor
 * @param trompaClient
 * @constructor
 */
const ToolkitEditorWithUser = ({trompaClient}: ToolkitEditorWithUserProps) => {
    const {session} = useSession();

    if (!session.info.webId) {
        return <p>You need to log in to use the editor</p>
    }
    return <Routes>
        <Route path={`/new`} element={<ToolkitEditor trompaClient={trompaClient} webId={session.info.webId}/>}/>
        <Route path={`$:toolkitId`} element={<ToolkitView />}/>
        <Route path={`/`} element={<ToolkitList />} />
    </Routes>
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