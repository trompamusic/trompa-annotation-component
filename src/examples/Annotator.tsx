import React, {ChangeEvent, Component, FormEvent} from 'react';
import {Form, Row, Col, Container, Button, Card} from 'react-bootstrap-v5';
import {LDflexValue} from "@solid/react";

// Annotation content components
import {
    TextArea, Rating, Waveform, Annotation,
    AnnotationMotivation, TimeSelection, TimeFragmentType,
    SessionViewer, TrompaClient, utilities
} from '../index';

import fakeAnnotationToolkit from '../API/testdata/fake-annotation-toolkit.json';
import {CE_URL} from "./Config";

const {timeToPrecision, annotationToWaveSurferRegion, extractNameFromCreatorURI, contentUrlOrSource} = utilities;

type AnnotatorProps = {
    user: LDflexValue | undefined;
    trompaClient: TrompaClient;
    resource: TrompaAnnotationComponents.Resource;
}
type AnnotatorState = {
    annotations: Annotation[];
    motivation?: AnnotationMotivation;
    selectedAnnotationId?: string;
    selectedAnnotationType?: any;
    selectedCategoryId?: string;
}

class Annotator extends Component<AnnotatorProps, AnnotatorState> {

    private waveform = React.createRef<Waveform>();

    constructor(props: AnnotatorProps) {
        super(props);
        this.state = {
            annotations: [],
            motivation: AnnotationMotivation.TAGGING
        };
    }

    componentDidMount = async () => {
        const {trompaClient, user} = this.props;
        if (!user) {
            return;
        }
        const annotationsForUser = await trompaClient.getAnnotationsForUser(user.toString())
        console.debug(annotationsForUser.data.Annotation);
        const annotations = annotationsForUser.data.Annotation.map((ann: any) => {
            return TrompaClient.annotationFromCE(ann, CE_URL);
        })
        this.setState({annotations})
    };

    selectAnnotation = (annotation: Annotation) => {
        this.setState({
            selectedAnnotationId: annotation.identifier,
            motivation: annotation.motivation
        });
        this.waveform.current?.selectRegionInWaveSurfer(annotation.identifier);
    }

    selectRegion = (region: TrompaAnnotationComponents.RegionInterchangeFormat) => {
        this.setState({selectedAnnotationId: region.id});
    }

    deselectRegion = () => {
        this.setState({selectedAnnotationId: undefined,});
    }

    updateRegion = (region: TrompaAnnotationComponents.RegionInterchangeFormat) => {
        const {selectedAnnotationId, annotations} = this.state;
        if (selectedAnnotationId === region.id) {
            const {start, end} = region;
            const formattedStart = timeToPrecision(start);
            const formattedEnd = timeToPrecision(end);
            const newAnnotations = annotations.slice();
            const annotation = this.getSelectedAnnotation(newAnnotations);
            if (!annotation) {
                return;
            }
            annotation.start = formattedStart;
            annotation.end = formattedEnd;
            this.setState({annotations: newAnnotations});
        }
    }

    createRegion = (region: TrompaAnnotationComponents.RegionInterchangeFormat) => {
        const {annotations, motivation} = this.state;
        console.debug("Creating new annotation from region", region);
        const newAnnotation = new Annotation(
            region.id,
            {
                identifier: "",
                type: 'AnnotationTarget',
                nodeId: this.props.resource.identifier,
                fieldName: "contentUrl",
                start: region.start,
                end: region.end
            }
            , this.props.user?.toString(),
            new Date().toISOString(),
            motivation
        );
        newAnnotation.start = region.start;
        newAnnotation.end = region.end;

        this.setState({annotations: [...annotations, newAnnotation], selectedAnnotationId: newAnnotation.identifier})
        this.selectRegion(region);

    }

    getSelectedAnnotation = (annotationsArray?: Annotation[]): Annotation | undefined => {
        const {annotations, selectedAnnotationId} = this.state;
        if (!selectedAnnotationId) {
            console.error("No selected ID");
            return;
        }
        const selectedAnnotation = (annotationsArray ?? annotations).find(({identifier}) => identifier === selectedAnnotationId);
        if (!selectedAnnotation) {
            console.error("No annotation selected with that ID");
            return;
        }
        return selectedAnnotation;
    }

    updateRegionDisplay = () => {
        const {selectedAnnotationId} = this.state
        const annotation = this.getSelectedAnnotation();
        if (!annotation) {
            return;
        }
        const region: TrompaAnnotationComponents.RegionInterchangeFormat = {
            id: selectedAnnotationId!,
            start: timeToPrecision(annotation.start),
            end: timeToPrecision(annotation.end),
        }
        this.waveform.current?.updateRegionInWaveSurfer(region);
    }

    saveAnnotation = (e: FormEvent) => {
        e.preventDefault();
        const {selectedAnnotationId} = this.state
        if (!selectedAnnotationId) {
            console.error("No annotation selected to save");
            return;
        }
        const annotation = this.getSelectedAnnotation();
        if (!annotation) {
            return;
        }

        this.props.trompaClient.saveAnnotation(annotation);
    }

    deleteRegion = () => {
        const {selectedAnnotationId} = this.state
        if (selectedAnnotationId) {
            console.debug("Delete region #", selectedAnnotationId);
            this.waveform.current?.deleteRegionInWaveSurfer(selectedAnnotationId);
            this.deselectRegion();
            this.props.trompaClient.deleteAnnotation(selectedAnnotationId)
        }
    }

    createNewAnnotation = () => {
        this.waveform.current?.createNewRegion();
    }


    handleAnnotationStartEndChange = (event: ChangeEvent<HTMLInputElement>) => {
        const {annotations} = this.state;
        const newAnnotations = annotations.slice();
        const selectedAnnotation = this.getSelectedAnnotation(newAnnotations);
        if (!selectedAnnotation) {
            return;
        }
        switch (event.target.name) {
            case "start":
                selectedAnnotation.start = timeToPrecision(event.target.value);
                break;
            case "end":
                selectedAnnotation.end = timeToPrecision(event.target.value);
                break;
        }
        this.setState({annotations: newAnnotations}, this.updateRegionDisplay);
    }
    handleAnnotationFragmentTypeChange = (annotationPeriod: TimeFragmentType) => {
        const {annotations} = this.state;
        const newAnnotations = annotations.slice();
        const selectedAnnotation = this.getSelectedAnnotation(newAnnotations);
        if (!selectedAnnotation) {
            return;
        }
        selectedAnnotation.timeFragmentType = annotationPeriod;
        this.setState({annotations: newAnnotations}, this.updateRegionDisplay);
    }

    handleTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {annotations, selectedAnnotationId} = this.state;
        const newAnnotations = annotations.slice();
        const annotation = this.getSelectedAnnotation(newAnnotations);
        if (!annotation) {
            console.debug("No annotation with id", selectedAnnotationId);
            return;
        }
        const body: TrompaAnnotationComponents.TextualBody = (annotation.body as TrompaAnnotationComponents.TextualBody) ?? {type: "TextualBody"};
        body.value = event.target.value;
        annotation.body = body;
        this.setState({annotations: newAnnotations});
    }

    // handleTagsChange = (selectedTags:string[]) => {
    //   const {annotations, selectedAnnotationId} = this.state;
    //   const annotation = this.getSelectedAnnotation();
    //   if(!annotation){
    //     return;
    //   }
    //   (annotation.body as TextualBody[]) = selectedTags.map(tag=> ({type:"TextualBody", value:tag})) ?? [];
    //   this.setState({annotations});
    // }

    handleRatingChange = (newRating: number) => {
        const {annotations} = this.state;
        const newAnnotations = annotations.slice();
        const annotation = this.getSelectedAnnotation(newAnnotations);
        if (!annotation) {
            return;
        }
        let body = (annotation.body ?? {}) as TrompaAnnotationComponents.RatingType;
        body.ratingValue = newRating;
        annotation.body = body;
        this.setState({annotations: newAnnotations}, this.updateRegionDisplay);

    }

    getAvailableAnnotationTypes = () => {
        return fakeAnnotationToolkit.data?.ItemList?.[0]?.itemListElement ?? [];
    }

    changeCurrentAnnotationType = (event: ChangeEvent<any>) => {
        const index: number = Number(event.target.value);
        const selectedType = fakeAnnotationToolkit.data?.ItemList?.[0]?.itemListElement?.[index];
        this.setState({
            selectedAnnotationType: selectedType,
            motivation: this.getAnnotationTypeFromToolkitItem(selectedType)
        });
    }

    // TODO: proper typing for annotationType structure
    private getAnnotationTypeFromToolkitItem = (annotationType: any): AnnotationMotivation | undefined => {
        let motivation;
        if (Array.isArray(annotationType?.itemUrl) && annotationType?.itemUrl.length) {
            motivation = annotationType.itemUrl[0].split("www.w3.org/ns/oa#")[1];
        } else {
            motivation = annotationType.item[0].__typename
        }
        return motivation;
    }

    private getAnnotationComponent = () => {
        const {selectedAnnotationType, motivation} = this.state;
        const annotation = this.getSelectedAnnotation();
        if (!annotation) {
            return;
        }
        switch (motivation) {
            case AnnotationMotivation.COMMENTING:
                return <TextArea content={(annotation.body as TrompaAnnotationComponents.TextualBody)?.value}
                                 handleTextChange={this.handleTextChange}
                                 name="comment" label={annotation.motivation || selectedAnnotationType?.name}
                                 type="textarea"/>

            case AnnotationMotivation.DESCRIBING:
                return <TextArea content={(annotation.body as TrompaAnnotationComponents.TextualBody)?.value}
                                 handleTextChange={this.handleTextChange}
                                 name="description" label={annotation.motivation || selectedAnnotationType?.name}
                                 type="textarea"/>

            case AnnotationMotivation.TAGGING:
                return <TextArea content={(annotation.body as TrompaAnnotationComponents.TextualBody)?.value}
                                 handleTextChange={this.handleTextChange}
                                 name="tag" label={annotation.motivation || selectedAnnotationType?.name} type="input"/>

            // const {name, hasDefinedTerm} = selectedAnnotationType;
            // case AnnotationMotivation.DefinedTermSet:
            //   return <Tags handleSelectionChange={this.handleTagsChange}
            //     name="tag" label={name} options={hasDefinedTerm}
            //     selected={[]}/>

            case AnnotationMotivation.ASSESSING:
                return <Rating
                    ratingValue={(annotation?.body as TrompaAnnotationComponents.RatingType)?.ratingValue}
                    bestRating={(annotation?.body as TrompaAnnotationComponents.RatingType)?.bestRating ?? selectedAnnotationType?.item?.[0]?.bestRating}
                    worstRating={(annotation?.body as TrompaAnnotationComponents.RatingType)?.worstRating ?? selectedAnnotationType?.item?.[0]?.worstRating}
                    onRatingChange={this.handleRatingChange}
                    label={(annotation?.body as TrompaAnnotationComponents.RatingType)?.name ?? selectedAnnotationType?.name}
                />
            default:
                break;
        }
    }

    render(): JSX.Element {
        const {resource} = this.props;
        const {annotations, selectedAnnotationId} = this.state;
        const selectedAnnotation = this.getSelectedAnnotation();
        const parsedRegions = annotations
            .map(annotationToWaveSurferRegion)
            .filter(element => typeof element !== "undefined") as TrompaAnnotationComponents.RegionInterchangeFormat[];

        return (
            <Container id="annotator">
                <Row className="mb-4">
                    <Waveform ref={this.waveform}
                              resourceURL={contentUrlOrSource(resource)!}
                              createRegion={this.createRegion}
                              updateRegion={this.updateRegion}
                              selectRegion={this.selectRegion}
                              deleteRegion={this.deleteRegion}
                              initialRegions={parsedRegions}
                    />
                </Row>
                <Row>
                    <Col md={5}>
                        <SessionViewer annotations={annotations} selectedAnnotationId={selectedAnnotationId}
                                       onSelectAnnotation={this.selectAnnotation}
                                       onCreateNewAnnotation={this.createNewAnnotation}
                                       onSaveSession={() => {
                                           console.debug("Click on save session !")
                                       }}
                        />
                    </Col>
                    <Col md={7}>
                        <Card>
                            <Form onSubmit={this.saveAnnotation}>
                                <Card.Header>{fakeAnnotationToolkit.data?.ItemList?.[0]?.name ?? "Annotation"}</Card.Header>
                                <Card.Body>
                                    {(!selectedAnnotation || selectedAnnotation.isNew) &&
                                    <Form.Group as={Row} controlId="annotationMotivation" className="mb-3">
                                        <Form.Label column sm="4">
                                            Annotation type
                                        </Form.Label>
                                        <Col sm="8">
                                            <Form.Control as="select" onChange={this.changeCurrentAnnotationType}>
                                                {
                                                    this.getAvailableAnnotationTypes()
                                                        .map((annotationToolkitItem, index) =>
                                                            <option value={index}>{annotationToolkitItem.name}</option>
                                                        )
                                                }
                                            </Form.Control>
                                        </Col>
                                    </Form.Group>
                                    }
                                    {selectedAnnotation &&
                                    <TimeSelection onStartEndChange={this.handleAnnotationStartEndChange}
                                                   onTimePeriodChange={this.handleAnnotationFragmentTypeChange}
                                                   fragmentType={selectedAnnotation.timeFragmentType as TimeFragmentType}
                                                   startValue={selectedAnnotation.start}
                                                   endValue={selectedAnnotation.end}
                                                   timePeriodDisabled={!selectedAnnotation.isNew}
                                    />
                                    }

                                    {selectedAnnotation &&
                                    <Row className="mb-3">
                                        {
                                            this.getAnnotationComponent()
                                        }
                                    </Row>
                                    }
                                </Card.Body>
                                <Card.Footer>
                                    {selectedAnnotation ?
                                        <Row>
                                            <Col md="auto">
                                                Created by <a href={selectedAnnotation.creator}>
                                                {extractNameFromCreatorURI(selectedAnnotation.creator)}
                                            </a> on {new Date(selectedAnnotation.created!).toLocaleString()}
                                            </Col>
                                            <Button className="col-md-2" variant="success" type="submit"
                                                    disabled={!selectedAnnotationId}>
                                                Save
                                            </Button>
                                            <Button className="col-md-2" variant="danger" onClick={this.deleteRegion}
                                                    disabled={!selectedAnnotationId}>
                                                Delete
                                            </Button>
                                        </Row> :
                                        <Row>
                                            <Button variant="primary" onClick={this.createNewAnnotation}>
                                                Create new annotation
                                            </Button>
                                        </Row>
                                    }
                                </Card.Footer>
                            </Form>
                        </Card>
                    </Col>
                </Row>
                <Row>
                </Row>
            </Container>

        );
    }


}

export default Annotator;
