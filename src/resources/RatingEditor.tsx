import React, {Component, useState} from "react";
import TrompaClient from "../API/CEAPI";
import {Button, Col, FormControl, FormGroup, ListGroup, Row} from "react-bootstrap-v5";
import {useSession} from "@inrupt/solid-ui-react";

type RatingEditorWithUserProps = {
    trompaClient: TrompaClient;
}

/**
 * A wrapper that ensures that we always give a logged in user to DefinedTermSetEditor
 * @param trompaClient
 * @constructor
 */
const RatingEditorWithUser = ({trompaClient}: RatingEditorWithUserProps) => {
    const {session} = useSession();

    return <div>
        {session.info.webId && <RatingEditor trompaClient={trompaClient} webId={session.info.webId}/>}
        {!session.info.webId && <p>You need to log in to use the editor</p>}
    </div>
}

type RatingEditorProps = {
    trompaClient: TrompaClient
    webId: string
}

type NewRating = {
    name: string
    worstRating: string
    bestRating: string
    description?: string
}

const NewRatingInput = ({onSubmit}: {onSubmit: (rating: NewRating) => void}) => {
    const [name, setName] = useState("");
    const [worstRating, setWorstRating] = useState('');
    const [bestRating, setBestRating] = useState('');
    const [description, setDescription] = useState('');
    const [nameInvalid, setNameInvalid] = useState(false);
    const [worstRatingInvalid, setWorstRatingInvalid] = useState(false);
    const [bestRatingInvalid, setBestRatingInvalid] = useState(false);

    const submit = () => {
        console.debug("trying debug")
        if (name === '' || worstRating === '' || bestRating === '') {
            console.debug("is invalid")
            setNameInvalid(name === '');
            setWorstRatingInvalid(worstRating === '');
            setBestRatingInvalid(bestRating === '');
        } else {
            console.debug("sending")
            onSubmit({name, worstRating, bestRating, description})
            setName('');
            setDescription('');
            setBestRating('');
            setWorstRating('')
        }
    }

    return <ListGroup.Item action as={"a"}>
        <FormGroup>
            <FormControl
                placeholder="New Rating"
                aria-label="New Rating"
                type="text" value={name}
                isInvalid={nameInvalid}
                onChange={e => {setName(e.target.value); setNameInvalid(false)}}
            />
        </FormGroup>
        <FormGroup>
            <Row>
                <Col>
                    <FormControl
                        placeholder="Worst Rating"
                        aria-label="Worst Rating"
                        type="number" value={worstRating}
                        isInvalid={worstRatingInvalid}
                        onChange={e => {setWorstRating(e.target.value); setWorstRatingInvalid(false)}}
                    />
                </Col> -
                <Col>
                    <FormControl
                        placeholder="Best Rating"
                        aria-label="Best Rating"
                        type="number" value={bestRating}
                        isInvalid={bestRatingInvalid}
                        onChange={e => {setBestRating(e.target.value); setBestRatingInvalid(false)}}
                    />
                </Col>
            </Row>
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
            <Button variant="outline-success" onClick={submit}>
                Create
            </Button>
        </FormGroup>
    </ListGroup.Item>
}

type RatingEditorState = {
    data: Array<TrompaAnnotationComponents.RatingDefinition>
    error: boolean
}

export class RatingEditor extends Component<RatingEditorProps, RatingEditorState> {

    constructor(props: RatingEditorProps) {
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

    deleteRating = async (ratingId: string, index: number) => {
        try {
            await this.props.trompaClient.deleteRating(ratingId);
            const existingData = this.state.data.slice();
            existingData.splice(index, 1);
            this.setState({data: existingData});
        } catch (e) {
            console.debug("error while deleting a Rating definition")
            console.error(e);
        }
    }

    createRating = async (rating: NewRating) => {
        console.debug("Got a new rating to save")
        console.debug(rating)
        const newRating: TrompaAnnotationComponents.RatingDefinition = {
            name: rating.name,
            description: rating.description,
            bestRating: parseInt(rating.bestRating, 10),
            worstRating: parseInt(rating.worstRating, 10),
            creator: this.props.webId,
            type: 'RatingDefinition'
        }
        let existingData: TrompaAnnotationComponents.RatingDefinition[] = [];
        if (this.state.data !== undefined) {
            existingData = this.state.data.slice();
        }
        try {
            const response = await this.props.trompaClient.createRatingDefinition(newRating)
            const newData: TrompaAnnotationComponents.RatingDefinition[] = [...existingData, response.data.CreateRating]
            this.setState({data: newData})
        } catch (e) {
            console.debug("error while creating a Rating definition")
            console.error(e);
        }
    }

    render() {
        return <Row><Col lg={6}><ListGroup> {this.state.data &&
        this.state.data.map((rating, index: number) => {
            return <ListGroup.Item action as={"a"} key={rating.identifier}>
                <Row>
                    <Col>
                        {rating.name} ({rating.worstRating}&ndash;{rating.bestRating})<br/>
                        {rating.description && <><small>{rating.description}</small><br/></>}
                        <small>id: {rating.identifier}</small>
                    </Col>
                    <Col xs={3}>
                        <Button variant="outline-danger"
                                size="sm" onClick={(e) => {
                            this.deleteRating(rating.identifier!, index);
                            e.stopPropagation();
                        }}>Delete</Button>
                    </Col>
                </Row>
            </ListGroup.Item>
        })}
            <NewRatingInput onSubmit={this.createRating}/>
        </ListGroup></Col></Row>
    }
}

export default RatingEditorWithUser;