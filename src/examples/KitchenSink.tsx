import {Row, Col, Container, Card} from 'react-bootstrap-v5';
import TextArea from '../annotations/TextArea';
import Tags from '../annotations/Tags';
import Rating from '../annotations/Rating';

export default function KitchenSink() {

    const noop = () => {
    };
    const definedTermSetDefaults = {
        additionalType: "",
        creator: "",
        identifier: "",
        type: "DefinedTerm" as "DefinedTerm"
    };
    const definedTermSetItems = [{termCode: "happy", ...definedTermSetDefaults}, {termCode: "sad", ...definedTermSetDefaults}, {termCode: "energetic", ...definedTermSetDefaults}, {termCode: "relaxing", ...definedTermSetDefaults}];
    return <Container>
        <Row className='mt-4'>
            <Col md="6" className='mb-4'>
                <Card>
                    <Card.Header>Annotation</Card.Header>
                    <Card.Body>
                        <Row>
                            <TextArea
                                content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vulputate, neque sed ultricies hendrerit, mauris orci porttitor turpis, vitae pharetra ex nunc ut arcu. Maecenas condimentum vulputate ex, nec auctor nunc fermentum a. Pellentesque lorem erat, congue id dignissim id, hendrerit in metus."
                                name="comment" label="Comment" type="textarea" handleTextChange={noop}/>
                        </Row>
                    </Card.Body>
                </Card>
            </Col>
            <Col md="6" className='mb-4'>
                <Card>
                    <Card.Header>Annotation</Card.Header>
                    <Card.Body>
                        <Row>
                            <TextArea content="Good"
                                      name="comment" label="Tagging" type="input" handleTextChange={noop}/>
                        </Row>
                    </Card.Body>
                </Card>
            </Col>
            <Col md="6" className='mb-4'>
                <Card>
                    <Card.Header>Annotation</Card.Header>
                    <Card.Body>
                        <Row>
                            <Rating
                                ratingValue={7}
                                bestRating={10}
                                worstRating={1}
                                onRatingChange={noop}
                                label="Rating (range)"
                            />
                        </Row>
                    </Card.Body>
                </Card>
            </Col>
            <Col md="6" className='mb-4'>
                <Card>
                    <Card.Header>Annotation</Card.Header>
                    <Card.Body>
                        <Row>
                            <Rating
                                type="stars"
                                ratingValue={4}
                                bestRating={5}
                                worstRating={0}
                                onRatingChange={noop}
                                label="Rating (stars)"
                            />
                        </Row>
                    </Card.Body>
                </Card>
            </Col>
            <Col md="6" className='mb-4'>
                <Card>
                    <Card.Header>Annotation</Card.Header>
                    <Card.Body>
                        <Row>
                            <Tags handleSelectionChange={noop}
                                  name="Tag" label="DefinedTermSet" options={definedTermSetItems}
                                  selected={["energetic"]}/>
                        </Row>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    </Container>
}
