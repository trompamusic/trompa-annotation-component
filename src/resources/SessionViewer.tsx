import {Row, Col, Card, ListGroup} from 'react-bootstrap-v5';
import Annotation, {AnnotationTarget} from "../annotations/Annotation";
import "./SessionViewer.css"
import {extractNameFromCreatorURI} from '../utils';

export type SessionViewerProps = {
    annotations: Annotation[];
    selectedAnnotationId?: string;
    onSelectAnnotation?: (annotation: Annotation) => void;
    onSaveSession?: () => void;
    onCreateNewAnnotation?: () => void;
}

function getURLFromTarget(target: TrompaAnnotationComponents.AnnotationCETarget | AnnotationTarget) {
    if (!target) {
        return null
    }
    if (target instanceof AnnotationTarget) {
        return target.id;
    } else {
        // AnnotationCETarget
        return target.url;
    }
}

function SessionViewer(props: SessionViewerProps) {
    const {
        annotations, selectedAnnotationId,
        onSelectAnnotation, onSaveSession, onCreateNewAnnotation
    } = props;
    return (
        <Card className="session-viewer">
            <Card.Header>Annotations for this session</Card.Header>
            <ListGroup>
                {annotations.map(annotation => {
                    return (
                        <ListGroup.Item action key={annotation.identifier}
                                        active={annotation.identifier === selectedAnnotationId}
                                        onClick={() => {
                                            typeof onSelectAnnotation === "function" && onSelectAnnotation(annotation)
                                        }}
                        >
                            <Row>
                                <Col md="auto">
                                    url: {getURLFromTarget(annotation.target?.[0])}
                                </Col>
                                {!isNaN(Number(annotation.start)) &&
                                <Col md="auto">
                                    time:&nbsp;
                                    {annotation.start} - {annotation.end}
                                </Col>
                                }
                            </Row>
                            <Row>
                                <Col md="auto">
                                    <small>id: {annotation.identifier}</small>
                                </Col>
                                <Col xs>
                                    <a href={annotation.creator}>
                                        {extractNameFromCreatorURI(annotation.creator)}
                                    </a>
                                </Col>
                            </Row>
                        </ListGroup.Item>)
                })}
                {onCreateNewAnnotation &&
                <ListGroup.Item variant="primary" action onClick={onCreateNewAnnotation}>
                    + Create new annotation
                </ListGroup.Item>
                }
                {onSaveSession &&
                <ListGroup.Item variant="success" action onClick={onSaveSession}>
                    Save session
                </ListGroup.Item>
                }
            </ListGroup>
        </Card>)
}

export default SessionViewer;