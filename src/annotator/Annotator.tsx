
import React, { ChangeEvent, Component, FormEvent } from 'react';
import {Form, Row, Col, Container, Button, Card, ListGroup} from 'react-bootstrap-v5';

// Annotation content components
import TextArea from './TextArea';
import Waveform from './WaveForm';
import Annotation, {DefaultAnnotationMotivation} from "./Annotation";
import {annotationToWaveSurferRegion, extractNameFromCreatorURI, contentUrlOrSource} from './utils';
import fakeAnnotationToolkit from './fake-annotation-toolkit.json';
import Rating from './Rating';
import TrompaClient from "../CEAPI";
import {LDflexValue} from "@solid/react";

type AnnotatorProps ={
  user: LDflexValue | undefined;
  trompaClient: TrompaClient;
  resource: Resource;
}
type AnnotatorState = {
  annotations:Annotation[];
  motivation?:DefaultAnnotationMotivation;
  selectedAnnotationId?:string;
  selectedAnnotationType?:any;
  isPunctual?:boolean;
  data:Record<string,any>;
  selectedCategoryId?:string;
  categories?:AnnotationCategory[];
}

class Annotator extends Component<AnnotatorProps, AnnotatorState> {
  
  private waveform = React.createRef<Waveform>();
  
  constructor(props:AnnotatorProps){
    super(props);
    this.state = {
      data:{},
      annotations: [],
      // annotations: fakeAnnotations.map(fakeAnno => Annotation.fromCE(fakeAnno)),
      motivation: DefaultAnnotationMotivation.TAGGING
    };
  }
  
  componentDidMount = async () => {
    const {trompaClient, user} = this.props;
    if(!user){
      return;
    }
    const annotationsForUser = await trompaClient.getAnnotationsForUser(user.toString())
    console.debug(annotationsForUser.data.Annotation);
    const annotations = annotationsForUser.data.Annotation.map((ann: any) => {
      return Annotation.fromCE(ann);
    })
    this.setState({annotations})
  };

  selectAnnotation = (annotation:Annotation)=> {
    console.log("Select annotation called with",annotation);
    this.setState({
      selectedAnnotationId:annotation.identifier,
      motivation: annotation.motivation
    });
    this.waveform.current?.selectRegionInWaveSurfer(annotation.identifier);
  }
  
  selectRegion = (region:RegionInterchangeFormat)=> {
    console.log("Select region called with",region);
    this.setState({selectedAnnotationId: region.id});
  }

  deselectRegion = ()=> {
    this.setState({selectedAnnotationId: undefined,});
  }

  updateRegion = (region:RegionInterchangeFormat)=> {
    const {selectedAnnotationId, annotations}= this.state;
    if(selectedAnnotationId === region.id){
      console.log("Updating selected region",region);
      const {start,end} = region;
      const formattedStart = Number(start.toFixed(2));
      const formattedEnd = Number(end.toFixed(2));
      const annotation = this.getSelectedAnnotation();
      if(!annotation){
        return;
      }
      annotation.start = formattedStart;
      annotation.end = formattedEnd;
      const newAnnotations = annotations.slice();
      this.setState({annotations:newAnnotations});
    }
  }

  createRegion = (region:RegionInterchangeFormat)=> {
    const {annotations, motivation} = this.state;
    console.log("Creating new annotation from region",region);
    const newAnnotation = new Annotation(
      region.id,
      {
        identifier: "",
        type: 'AnnotationTarget',
        nodeId: this.props.resource.identifier,
        fieldName: "contentUrl",
        start:region.start,
        end: region.end
      }
      , this.props.user?.toString(),
      Date.now().toString(),
      motivation
    );
    newAnnotation.start = region.start;
    newAnnotation.end = region.end;
    
    this.setState({annotations: [...annotations, newAnnotation], selectedAnnotationId: newAnnotation.identifier})
    this.selectRegion(region);

  }
  
  getSelectedAnnotation = (annotationsArray?:Annotation[]):Annotation | undefined => {
    const {annotations, selectedAnnotationId} = this.state;
    if(!selectedAnnotationId){
      console.error("No selected ID");
      return;
    }
    const selectedAnnotation = (annotationsArray ?? annotations).find(({identifier})=> identifier === selectedAnnotationId);
    if(!selectedAnnotation){
      console.error("No annotation selected with that ID");
      return;
    }
    return selectedAnnotation;
  }
  
  updateRegionDisplay = () => {
    const {annotations, selectedAnnotationId} = this.state
    // TODO: This won't work if annotation starts at 0
    if(!selectedAnnotationId){
      console.error("An annotation must be selected");
      return;
    }
    const annotation = this.getSelectedAnnotation();
    if(!annotation){
      return;
    }
    const region:RegionInterchangeFormat = {
      id: selectedAnnotationId,
      start: Number(annotation.start),
      end: Number(annotation.end),
    }
    this.waveform.current?.updateRegionInWaveSurfer(region);
  }

  saveAnnotation = (e:FormEvent) => {
    e.preventDefault();
    const {resource, user} = this.props;
    const {selectedAnnotationId} = this.state
    if(!selectedAnnotationId){
      console.error("No annotation selected to save");
      return;
    }
    const annotation = this.getSelectedAnnotation();
    if(!annotation){
      return;
    }

    console.log("Save this annotation to CE:", annotation);
    this.props.trompaClient.saveAnnotation(annotation);
  }

  deleteRegion = () => {
    const {selectedAnnotationId} = this.state
    if (selectedAnnotationId) {
      console.log("delete region #", selectedAnnotationId);
      this.waveform.current?.deleteRegionInWaveSurfer(selectedAnnotationId);
      this.deselectRegion();
      // Call the appropriate API method to delete
    }
  }
  
  createNewAnnotation = () => {
    this.waveform.current?.createNewRegion();
  }
  

  handleRegionStartEndChange = (event:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {annotations, selectedAnnotationId} = this.state;
    const selectedAnnotation = this.getSelectedAnnotation();
    if(!selectedAnnotation){
      return;
    }
    switch (event.target.name){
      case "start":
        selectedAnnotation.start = Number(event.target.value);
        break;
      case "end":
        selectedAnnotation.end = Number(event.target.value);
        break;
    }
    this.setState({annotations},this.updateRegionDisplay);
    // const name = event.target.name;
    // // @ts-ignore
    // this.setState({[name]:event.target.value},this.updateRegionDisplay);
  }
  
  handleIsPunctualChange = (event:ChangeEvent<HTMLInputElement>) => {
    const {annotations} = this.state;
    const newAnnotations = annotations.slice();
    const annotation = this.getSelectedAnnotation(newAnnotations);
    if(!annotation){
      return;
    }
    const isPunctual = event.target?.checked ?? !this.state.isPunctual;
    annotation.end = isPunctual ? annotation.start : (annotation.start ?? 0) + 1;
    // If the annotation should have no time length, set end equal to start and update the wavesurfer region
    this.setState({annotations: newAnnotations},this.updateRegionDisplay);
  }
  
  handleTextChange = (event:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {annotations, selectedAnnotationId} = this.state;
    const newAnnotations = annotations.slice();
    const annotation = this.getSelectedAnnotation(newAnnotations);
    if(!annotation){
      console.debug("No annotation with id",selectedAnnotationId);
      return;
    }
    const body:TextualBody = (annotation.body as TextualBody) ?? {type: "TextualBody"};
    body.value = event.target.value;
    annotation.body = body;
    this.setState({annotations: newAnnotations}); // ,this.updateRegionDisplay);
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

  handleRatingChange = (newRating:number) => {
    // const {annotations, selectedAnnotationId} = this.state;
    // const annotation = this.getSelectedAnnotation();
    // if(!annotation){
    //   return;
    // }
    
    // this.setState({annotations});
    const {annotations} = this.state;
    const newAnnotations = annotations.slice();
    const annotation = this.getSelectedAnnotation(newAnnotations);
    if(!annotation){
      return;
    }
    let body = (annotation.body ?? {}) as RatingType;
    body.ratingValue = newRating;
    annotation.body = body;
    this.setState({annotations: newAnnotations},this.updateRegionDisplay);

  }

  getAvailableAnnotationTypes = () => {
    return fakeAnnotationToolkit.data?.ItemList?.[0]?.itemListElement ?? [];
  }

  changeCurrentAnnotationType = (event: ChangeEvent<any>) => {
    const {annotations, selectedAnnotationId} = this.state;
    const index:number = Number(event.target.value);
    const selectedType = fakeAnnotationToolkit.data?.ItemList?.[0]?.itemListElement?.[index];
    // const annotation = this.getSelectedAnnotation();
    // if(!annotation){
    //   return;
    // }
    // annotation.motivation = selectedType.item.motivation;
    // this.setState({selectedAnnotationType: selectedType, annotations});
    this.setState({
      selectedAnnotationType: selectedType,
      motivation:this.getAnnotationTypeFromToolkitItem(selectedType)
    });
  }
  
  render(): JSX.Element {
    const {resource} = this.props;
    const {annotations, selectedAnnotationId, isPunctual, selectedAnnotationType} = this.state;
    const selectedAnnotation = this.getSelectedAnnotation();
    const parsedRegions = annotations
      .map(annotationToWaveSurferRegion)
      .filter(element => typeof element !== "undefined") as RegionInterchangeFormat[];

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
            <Card>
                <Card.Header>Annotations for this session</Card.Header>
                <ListGroup>
                  {(annotations as Annotation[]).map(annotation => {
                    return (<ListGroup.Item action active={annotation.identifier === selectedAnnotationId}
                      onClick={this.selectAnnotation.bind(this,annotation)}
                      >
                      <Row>
                        <Col md="auto">
                        {(annotation.target as AnnotationCETarget)?.url}
                        </Col>
                        { !isNaN(Number(annotation.start)) &&
                          <Col md="auto">
                            {annotation.start} - {annotation.end}
                          </Col>
                        }
                      </Row>
                      <Row>
                        <Col>
                          <small>{annotation.identifier}</small>
                        </Col>
                      </Row>
                    </ListGroup.Item>)
                  })}
                </ListGroup>
            </Card>
          </Col>
          <Col md={7}>
            <Card>
              <Card.Header>{fakeAnnotationToolkit.data?.ItemList?.[0]?.name ?? "Annotation"}</Card.Header>
              <Card.Body>
                <Form onSubmit={this.saveAnnotation}>
                  { (!selectedAnnotation || selectedAnnotation.isNew) &&
                  <Form.Group as={Row} controlId="annotationMotivation">
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
                  { selectedAnnotation &&
                    <Row className="mb-3">
                      <Col>
                        <Form.Group controlId="start">
                          <Form.Label>Start</Form.Label>
                          <Form.Control type="number" name="start"
                            value={selectedAnnotation.start || ''} step="0.5"
                            onChange={this.handleRegionStartEndChange}
                          />
                        </Form.Group>
                      </Col>
                      {
                        !isPunctual &&
                        <Col>
                          <Form.Group controlId="end">
                            <Form.Label>End</Form.Label>
                            <Form.Control type="number" name="end"
                              value={selectedAnnotation.end || ''} step="0.5"
                              onChange={this.handleRegionStartEndChange}
                            />
                          </Form.Group>
                        </Col>
                      }
                      <Col style={{alignSelf:"flex-end"}}>
                        <Form.Group controlId="isPunctual">
                          <Form.Check type="checkbox" label="Point annotation"
                            name="isPunctual"
                            checked={isPunctual}
                            onChange={this.handleIsPunctualChange}
                          />
                        </Form.Group>
                      </Col>
                  </Row>
                  }
                  {selectedAnnotation &&
                    <Row className="mb-3">
                      <Row>
                        <Col>
                          <Form.Group as={Row} controlId="annotationId">
                            <Form.Label column sm="4">
                            Annotation ID
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control plaintext readOnly value={selectedAnnotationId} />
                            </Col>
                          </Form.Group>
                          
                          <Form.Group as={Row} controlId="creator">
                            <Form.Label column sm="4">
                            Creator
                            </Form.Label>
                            <Col sm="8" style={{alignSelf: "center"}}>
                              <a href={selectedAnnotation.creator}>
                                {extractNameFromCreatorURI(selectedAnnotation.creator)}
                              </a>
                            </Col>
                          </Form.Group>

                          <Form.Group as={Row} controlId="creation">
                            <Form.Label column sm="4">
                            Creation date
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control plaintext readOnly defaultValue={selectedAnnotation.created}
                              placeholder="-" />
                            </Col>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row className="mb-3">
                      {
                        this.getAnnotationComponent()
                      }
                      </Row>
                    </Row>
                  }
                  { selectedAnnotation ?
                  <Row>
                    <Button variant="success" type="submit" disabled={!selectedAnnotationId}>
                      Save
                    </Button>
                    <Button variant="danger" onClick={this.deleteRegion} disabled={!selectedAnnotationId}>
                      Delete
                    </Button>
                  </Row> :
                  <Row>
                     <Button variant="primary" onClick={this.createNewAnnotation}>
                      Create new annotation
                    </Button>
                  </Row>
                  }
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          {/* <DefinedTermSetEditor/> */}
        </Row>
      </Container>
      
      );
    }
  // TODO: proper typing for annotationType structure
  private getAnnotationTypeFromToolkitItem = (annotationType:any):DefaultAnnotationMotivation | undefined => {
    let motivation;
    if(Array.isArray(annotationType?.itemUrl) && annotationType?.itemUrl.length){
      motivation = annotationType.itemUrl[0].split("www.w3.org/ns/oa#")[1];
    } else {
      motivation = annotationType.item[0].__typename
    }
    return motivation;
  }
  
  private getAnnotationComponent = () =>
  {
    // TODO: Figure out how to get the annotation type from an annotation loaded from the DB
    // We should have a toolkit at that poitn, and be able to reconstruct the available types and assign each annotation to one
    
    const { selectedAnnotationId, annotations, selectedAnnotationType, data, motivation } = this.state;
    const annotation = this.getSelectedAnnotation();
    if(!annotation){
      return;
    }
    // const motivation = this.getAnnotationTypeFromToolkitItem(selectedAnnotationType);
    switch (motivation) {
      case DefaultAnnotationMotivation.COMMENTING:
        return <TextArea content={(annotation.body as TextualBody)?.value} handleTextChange={this.handleTextChange}
          name="comment" label={annotation.motivation || selectedAnnotationType?.name} type="textarea"/>
          
      case DefaultAnnotationMotivation.DESCRIBING:
        return <TextArea content={(annotation.body as TextualBody)?.value} handleTextChange={this.handleTextChange}
        name="description" label={annotation.motivation || selectedAnnotationType?.name} type="textarea"/>
            
      case DefaultAnnotationMotivation.TAGGING:
        return <TextArea content={(annotation.body as TextualBody)?.value} handleTextChange={this.handleTextChange}
        name="tag" label={annotation.motivation || selectedAnnotationType?.name} type="input"/>
        
      // const {name, hasDefinedTerm} = selectedAnnotationType;
      // case DefaultAnnotationMotivation.DefinedTermSet:
      //   return <Tags handleSelectionChange={this.handleTagsChange}
      //     name="tag" label={name} options={hasDefinedTerm}
      //     selected={[]}/>

      case DefaultAnnotationMotivation.ASSESSING:
        return <Rating
          ratingValue={(data as RatingType)?.ratingValue}
          bestRating={(annotation?.body as RatingType)?.bestRating ?? selectedAnnotationType?.item?.[0]?.bestRating}
          worstRating={(annotation?.body as RatingType)?.worstRating ?? selectedAnnotationType?.item?.[0]?.worstRating}
          onRatingChange={this.handleRatingChange}
          label={(annotation?.body as RatingType)?.name ?? selectedAnnotationType?.name}
        />
      default:
        break;
    }
  }
  
  // private getDefinedTermSetComponent = (definedTermSet:DefinedTermSet) =>
  // {
  //   const {name, hasDefinedTerm}= definedTermSet;
  //   return <Tags handleSelectionChange={this.handleTagsChange}
  //     name="tag" label={name} options={hasDefinedTerm}
  //     selected={[]}/>
  // }
  
};
  
  export default Annotator;