import React, {ChangeEvent, Component, FormEvent} from 'react';
import {Form, Row, Col, Container, Button, Card} from 'react-bootstrap-v5';
import {LDflexValue} from "@solid/react";

// Annotation content components
import {
    TextArea, Rating, Waveform, Annotation,
    AnnotationMotivation, TimeSelection, TimeFragmentType,
    SessionViewer, TrompaClient, SolidClient, utilities
} from '../index';

import fakeAnnotationToolkit from '../API/testdata/fake-annotation-toolkit.json';
import {CE_URL} from "./Config";
import {startAndEndFromAnnotation} from "../utils";
import {AnnotationExternalWebResource, AnnotationTarget, AnnotationTextualBody} from "../annotations/Annotation";

const {timeToPrecision, annotationToWaveSurferRegion, extractNameFromCreatorURI, contentUrlOrSource} = utilities;

type AnnotatorProps = {
    user: LDflexValue | undefined;
    trompaClient: TrompaClient;
    solidClient: any;
    container: any;
    solidSession: any; //FIXME replace with @inrupt session type
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
            /*
            annotation.target[0].fragmentStart = formattedStart;
            annotation.target[0].fragmentEnd = formattedEnd;

             */
            this.setState({annotations: newAnnotations});
        }
    }

    createRegion = (region: TrompaAnnotationComponents.RegionInterchangeFormat) => {
        const {annotations, motivation} = this.state;
        console.debug("Creating new annotation from region", region);
        const target : TrompaAnnotationComponents.AnnotationCETarget = {
            identifier: "",
            type: 'AnnotationTarget',
            nodeId: this.props.resource.identifier,
            fieldName: "contentUrl",
            start: region.start,
            end: region.end
        }
        const newAnnotation = new Annotation(
            {identifier: region.id, target: [target], creator: this.props.user?.toString(),
            created: new Date().toISOString(), motivation: motivation}
        );
        // TODO: need an AnnotationTarget object for this
        /*
        newAnnotation.start = region.start;
        newAnnotation.end = region.end;
         */

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
        const [start, end] = startAndEndFromAnnotation(annotation);
        const region: TrompaAnnotationComponents.RegionInterchangeFormat = {
            id: selectedAnnotationId!,
            start: timeToPrecision(start),
            end: timeToPrecision(end),
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

        /*this.props.trompaClient.saveAnnotation(annotation);*/
        const solidAnnotation = annotation.toJSONLD(this.props.resource);
        this.props.solidClient.saveAnnotation(solidAnnotation, this.props.container)
            .then((resp:any) => {
                this.props.solidClient.fetchAnnotations(new URL(new URL(this.props.solidSession.info!.webId!).origin + this.props.container), {})
                    .then((annos:any[]) => {
                        console.debug("Fetched annotations: ", annos)
                        annos.forEach(a => {
                            let annoUri = a["@id"];
                            const publicAccess = this.props.solidClient.isPublicReadable(annoUri);
                            publicAccess.then((pubAcc:boolean) => {
                                console.log("Public access for annotation ", annoUri, " is ", pubAcc);
                                const userControl = this.props.solidClient.userControlsAccess(annoUri);
                                userControl.then((usrCtrl:boolean) => {
                                    console.log("User control for annotation ", annoUri, " is ", usrCtrl);
                                    // if the user is able to, toggle the public readable state of the resource
                                    if(usrCtrl) {
                                        if(pubAcc) {
                                            this.props.solidClient.revokePublicReadable(annoUri);
                                        } else {
                                            this.props.solidClient.grantPublicReadable(annoUri);
                                        }
                                    }

                                })
                            })
                        })
                    })
                    // TODO do something with them!

            });
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
        const target = selectedAnnotation.target[0];
        // TODO: We should have only 1 type of target at this point
        if (target instanceof AnnotationTarget) {
            switch (event.target.name) {
                case "start":
                    target.fragmentStart = timeToPrecision(event.target.value);
                    break;
                case "end":
                    target.fragmentEnd = timeToPrecision(event.target.value);
                    break;
            }
        } else {
            switch (event.target.name) {
                case "start":
                    target.start = timeToPrecision(event.target.value);
                    break;
                case "end":
                    target.end = timeToPrecision(event.target.value);
                    break;
            }
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
        const body: TrompaAnnotationComponents.TextualBody = (annotation.body?.[0] as TrompaAnnotationComponents.TextualBody) ?? {type: "TextualBody"};
        body.value = event.target.value;
        annotation.body = [body];
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
        annotation.body = [body];
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
        let content;
        if (!annotation || !annotation.body) {
            return;
        }
        const body = annotation.body[0];
        if (body instanceof AnnotationTextualBody) {
            content = body.value;
        } else if (body instanceof AnnotationExternalWebResource) {
        } else if (body.type === 'TextualBody') {
            content = body.value;
        }

        switch (motivation) {
            case AnnotationMotivation.COMMENTING:
                return <TextArea content={content}
                                 handleTextChange={this.handleTextChange}
                                 name="comment" label={annotation.motivation || selectedAnnotationType?.name}
                                 type="textarea"/>

            case AnnotationMotivation.DESCRIBING:
                return <TextArea content={content}
                                 handleTextChange={this.handleTextChange}
                                 name="description" label={annotation.motivation || selectedAnnotationType?.name}
                                 type="textarea"/>

            case AnnotationMotivation.TAGGING:
                return <TextArea content={content}
                                 handleTextChange={this.handleTextChange}
                                 name="tag" label={annotation.motivation || selectedAnnotationType?.name} type="input"/>

            // const {name, hasDefinedTerm} = selectedAnnotationType;
            // case AnnotationMotivation.DefinedTermSet:
            //   return <Tags handleSelectionChange={this.handleTagsChange}
            //     name="tag" label={name} options={hasDefinedTerm}
            //     selected={[]}/>

            case AnnotationMotivation.ASSESSING:
                return <Rating
                    ratingValue={(annotation?.body[0] as TrompaAnnotationComponents.RatingType)?.ratingValue}
                    bestRating={(annotation?.body[0] as TrompaAnnotationComponents.RatingType)?.bestRating ?? selectedAnnotationType?.item?.[0]?.bestRating}
                    worstRating={(annotation?.body[0] as TrompaAnnotationComponents.RatingType)?.worstRating ?? selectedAnnotationType?.item?.[0]?.worstRating}
                    onRatingChange={this.handleRatingChange}
                    label={(annotation?.body[0] as TrompaAnnotationComponents.RatingType)?.name ?? selectedAnnotationType?.name}
                />
            default:
                break;
        }
    }

    render(): JSX.Element {
        const {resource} = this.props;
        const {annotations, selectedAnnotationId} = this.state;
        const selectedAnnotation = this.getSelectedAnnotation();
        let start, end;
        if (selectedAnnotation) {
            [start, end] = startAndEndFromAnnotation(selectedAnnotation);
        }
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
                                                            <option value={index} key={index}>{annotationToolkitItem.name}</option>
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
                                                   startValue={start}
                                                   endValue={end}
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
