import React, {Component, useState} from "react";
import TrompaClient from "../API/CEAPI";
import {Button, Col, FormControl, FormGroup, FormLabel, FormSelect, ListGroup, Row} from "react-bootstrap-v5";
import {useSession} from "@inrupt/solid-ui-react";

type MotivationEditorWithUserProps = {
    trompaClient: TrompaClient;
}

/**
 * A wrapper that ensures that we always give a logged in user to DefinedTermSetEditor
 * @param trompaClient
 * @constructor
 */
const MotivationEditorWithUser = ({trompaClient}: MotivationEditorWithUserProps) => {
    const {session} = useSession();

    return <div>
        {session.info.webId && <MotivationEditor trompaClient={trompaClient} webId={session.info.webId}/>}
        {!session.info.webId && <p>You need to log in to use the editor</p>}
    </div>
}

type NewMotivation = {
    broaderUrl: string;
    broaderMotivation: string;
    title: string;
    description: string;
}

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

const NewMotivationInput = ({onSubmit}: {onSubmit: (motivation: NewMotivation) => void}) => {
    const DEFAULT_MOTIVATION = '--';
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [broaderUrl, setBroaderUrl] = useState('');
    const [broaderMotivation, setBroaderMotivation] = useState(DEFAULT_MOTIVATION);
    const [titleInvalid, setTitleInvalid] = useState(false);
    const [motivationInvalid, setMotivationInvalid] = useState(false);

    const submit = () => {
        // Form is invalid if title is empty, both motivations are empty
        // or if both motivations are set
        if (title === '' || (broaderUrl === '' && broaderMotivation === DEFAULT_MOTIVATION)) {
            setTitleInvalid(title === '');
            setMotivationInvalid(broaderUrl === '' && broaderMotivation === DEFAULT_MOTIVATION)
        } else if (broaderUrl !== '' && broaderMotivation !== DEFAULT_MOTIVATION) {
            setMotivationInvalid(true);
        } else {
            console.debug("sending")
            onSubmit({title,
                description,
                broaderMotivation: broaderMotivation === DEFAULT_MOTIVATION ? '' : broaderMotivation,
                broaderUrl})
            setTitle('');
            setDescription('');
            setBroaderMotivation(DEFAULT_MOTIVATION);
            setBroaderUrl('');
        }
    }

    return <ListGroup.Item action as={"a"}>
        <FormGroup>
            <FormControl
                placeholder="New Motivation"
                aria-label="New Motivation"
                type="text" value={title}
                isInvalid={titleInvalid}
                onChange={e => {setTitle(e.target.value); setTitleInvalid(false)}}
            />
        </FormGroup>
        <FormGroup>
            <FormControl as="textarea" rows={3}
                         placeholder="Description (optional)"
                         aria-label="Description (optional)"
                         type="text" value={description}
                         onChange={e => setDescription(e.target.value)}
            />
        </FormGroup>
        <FormGroup>
            <FormLabel>Broader</FormLabel>
            <FormSelect isInvalid={motivationInvalid} onChange={e => {
                const value = (e.target as HTMLSelectElement).value;
                setBroaderMotivation(value)
                setMotivationInvalid(false)}}>
                <option value={DEFAULT_MOTIVATION}>{DEFAULT_MOTIVATION}</option>
                {motivations.map(m => <option key={m} value={m}>{m}</option>)}
            </FormSelect>
            <FormControl
                 placeholder="External Motivation URL"
                 aria-label="External Motivation URL"
                 type="text" value={broaderUrl}
                 isInvalid={motivationInvalid}
                 onChange={e => {setBroaderUrl(e.target.value); setMotivationInvalid(false)}}
            />
        </FormGroup>
        <FormGroup>
            <Button variant="outline-success" onClick={submit}>
                Create
            </Button>
        </FormGroup>
    </ListGroup.Item>
}

type MotivationEditorProps = {
    trompaClient: TrompaClient
    webId: string
}

type MotivationEditorState = {
    data: Array<TrompaAnnotationComponents.AnnotationCEMotivation>
    error: boolean
}

export class MotivationEditor extends Component<MotivationEditorProps, MotivationEditorState> {

    constructor(props: MotivationEditorProps) {
        super(props);
        this.state = {
            data: [],
            error: false
        }
    }

    async componentDidMount() {
        try {
            const response = await this.props.trompaClient.getMotivationsForUser(
                this.props.webId
            )
            this.setState({data: response.data.AnnotationCEMotivation})
        } catch (e) {
            this.setState({error: true});
        }
    }

    createMotivation = async (motivation: NewMotivation) => {
        console.log("Making motivation")
        console.log(motivation)
        const m: TrompaAnnotationComponents.AnnotationCEMotivation = {
            type: 'AnnotationCEMotivation',
            creator: this.props.webId,
            title: motivation.title,
            description: motivation.description,
            broaderMotivation: motivation.broaderMotivation === '' ? undefined : motivation.broaderMotivation,
            broaderUrl: motivation.broaderUrl
        }
        let existingData: TrompaAnnotationComponents.AnnotationCEMotivation[] = [];
        if (this.state.data !== undefined) {
            existingData = this.state.data.slice();
        }
        try {
            const response = await this.props.trompaClient.createMotivation(m)
            const newData: TrompaAnnotationComponents.AnnotationCEMotivation[] = [
                ...existingData, response.data.CreateAnnotationCEMotivation
            ]
            this.setState({data: newData})
        } catch (e) {
            console.error("Error saving motivation");
            console.error(e)
        }
    }

    deleteMotivation = async (motivationId: string, index: number) => {
        try {
            await this.props.trompaClient.deleteMotivation(motivationId);
            const existingData = this.state.data.slice();
            existingData.splice(index, 1);
            this.setState({data: existingData});
        } catch (e) {
            console.debug("error while deleting a Motivation")
            console.error(e);
        }
    }

    render() {
        return <Row><Col lg={6}><ListGroup>{this.state.data &&
            this.state.data.map((motivation, index: number) => {
            return <ListGroup.Item action as={"a"} key={motivation.identifier}>
            <Row>
            <Col>
        {motivation.title}<br/>
        {motivation.description && <><small>{motivation.description}</small><br/></>}
        {motivation.broaderMotivation && <><small>skos:broader oa:{motivation.broaderMotivation}</small><br/></>}
        {motivation.broaderUrl && <><small>skos:broader {motivation.broaderUrl}</small><br/></>}
            <small>id: {motivation.identifier}</small>
            </Col>
            <Col xs={3}>
            <Button variant="outline-danger"
            size="sm" onClick={(e) => {
            this.deleteMotivation(motivation.identifier!, index);
            e.stopPropagation();
        }}>Delete</Button>
            </Col>
            </Row>
            </ListGroup.Item>
        })}
            <NewMotivationInput onSubmit={this.createMotivation}/>
        </ListGroup></Col></Row>
    }
}

export default MotivationEditorWithUser;
