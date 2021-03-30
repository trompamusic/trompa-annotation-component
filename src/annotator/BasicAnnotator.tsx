
import React, { ChangeEvent, Component, FormEvent } from 'react';
import {Form, Row, Col, Container, Button, Card, ListGroup} from 'react-bootstrap-v5';

// Annotation content components
import TextArea from './TextArea';
import Tags from './Tags';
import Waveform from './WaveForm';
import type { RatingTemplate, Region, Annotation, W3CAnnotation, AnnotationCategory, TextualBody, DefinedTermSet } from '../types';
import {formatBodyForSolid, annotationToWaveSurferRegion, extractNameFromCreatorURI} from './utils';
import fakeAnnotationToolkit from './fake-annotation-toolkit.json';
import fakeAnnotations from './fake-annotations.json';
import Rating from './Rating';
import TrompaClient from "../CEAPI";
import {LDflexValue} from "@solid/react";

export enum AnnotationMotivation {
	COMMENTING = "commenting", // freeform long text
	DESCRIBING = "describing", // freeform long text
	TAGGING = "tagging", // freeform short text
	CLASSIFYING = "classifying", // closed vocabulary
	ASSESSING = "assessing", // ratings
}

type AnnotatorProps ={
  user: LDflexValue | undefined;
  trompaClient: TrompaClient;
  resourceURL: string;
}
type AnnotatorState = {
  annotations:W3CAnnotation[];
  selectedAnnotationId?:string;
  selectedAnnotationType?:any;
  start?:number;
  end?:number;
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
      annotations: []
    };
  }
  
  // componentDidMount = () => {
    // Probably gonna want to initialize some stuff here, do some API calls and such
  // };

  selectAnnotation = (annotation:W3CAnnotation)=> {
    console.log("Select annotation called with",annotation);
    this.setState({
      selectedAnnotationId:annotation.id
    });
    this.waveform.current?.selectRegionInWaveSurfer(annotation.id);
  }
  
  selectRegion = (region:Region)=> {
    console.log("Select region called with",region);
    this.setState({
      selectedAnnotationId:region.id,
      start:region?.start,
      end:region?.end,
      data:region?.data,
    });
  }

  deselectRegion = ()=> {
    this.setState({
      selectedAnnotationId: "",
      start:undefined,
      end:undefined,
      data: {},
    });
  }

  updateRegion = (region:Region)=> {
    const {selectedAnnotationId}= this.state;
    if(selectedAnnotationId === region.id){
      console.log("Updating selected region",region);
      const {start,end,data} = region;
      const formattedStart = Number(start.toFixed(2));
      const formattedEnd = Number(end.toFixed(2));
      this.setState({
        start:formattedStart,
        end:formattedEnd,
        data,
      });
    }
  }

  createRegion = (region:Region)=> {
    const {annotations} = this.state;
    console.log("Creating new annotation from region",region);
    const newAnnotation = {
      id:region.id,
      creator: this.props.user?.toString(),
      motivation:AnnotationMotivation.COMMENTING,
      type:'Annotation'
    }
    
    this.setState({annotations: [...annotations, newAnnotation]})
    this.selectRegion(region);

  }

  saveRegionToAPI = (annotation:W3CAnnotation) => {
    console.log("Save this region to the API:", annotation);
    this.props.trompaClient.saveAnnotation(annotation);
  }
  
  saveRegion = (e:FormEvent) => {
    e.preventDefault();
    const {resourceURL, user} = this.props;
    const {annotations, selectedAnnotationId,start,end} = this.state
    if(!selectedAnnotationId){
      console.error("No annotation selected to save");
      return;
    }
    
    // TODO: This won't work if annotation starts at 0
    if(!start || !end){
      console.error("Start and end times must be numbers");
      return;
    }
    const annotation = annotations.find(annotation => annotation.id === selectedAnnotationId)

    const formattedBody = formatBodyForSolid(
      start, end, {identifier:"7c338222-6c68-45ce-a1aa-f2a41a261520",contentURL:resourceURL},
      annotation?.motivation, user?.toString(), annotation?.id, annotation?.body
      );
    const region:Annotation = {
      id: selectedAnnotationId,
      start: Number(start),
      end: Number(end),
      //TODO: fix this type issue by creating a utility
      // that will validate and transform the data object into the appropriate annotation body
      body: annotation?.body as any
    }
    this.waveform.current?.updateRegionInWaveSurfer(region);
    this.saveRegionToAPI(formattedBody);
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
  

  handleRegionStartEndChange = (event:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const name = event.target.name;
    // @ts-ignore
    this.setState({[name]:event.target.value});
  }
  
  handleTextChange = (event:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {annotations, selectedAnnotationId} = this.state;
    const annotation = annotations.find(annotation => annotation.id === selectedAnnotationId)
    if(!annotation){
      return;
    }
    annotation.body = event.target.value
    this.setState({annotations});
  }
  
  // handleTagsChange = (selectedTags:string[]) => {
  //   const {annotations, selectedAnnotationId} = this.state;
  //   const annotation = annotations.find(annotation => annotation.id === selectedAnnotationId)
  //   if(!annotation){
  //     return;
  //   }
  //   (annotation.body as TextualBody[]) = selectedTags.map(tag=> ({type:"TextualBody", value:tag})) ?? [];
  //   this.setState({annotations});
  // }

  // handleRatingChange = (newRating:number) => {
  //   const {annotations, selectedAnnotationId} = this.state;
  //   const annotation = annotations.find(annotation => annotation.id === selectedAnnotationId)
  //   if(!annotation){
  //     return;
  //   }
  //   (annotation.body as RatingTemplate).ratingValue = newRating;
  //   this.setState({annotations});
  // }

  // getAvailableAnnotationTypes = () => {
  //   // const motivations:string[] = [];
  //   return fakeAnnotationToolkit.itemListElement.map(listItem => {
  //     const {item} = listItem;
  //     return item
  //   })
  //   // return motivations;
  // }

  // changeCurrentAnnotationType = (event: ChangeEvent<any>) => {
  //   const {annotations, selectedAnnotationId} = this.state;
  //   const index:number = Number(event.target.value);
  //   const selectedType = fakeAnnotationToolkit.itemListElement[index];
  //   const annotation = annotations.find(annotation => annotation.id === selectedAnnotationId)
  //   if(!annotation){
  //     return;
  //   }
  //   annotation.motivation = selectedType.item.motivation;
  //   this.setState({selectedAnnotationType: selectedType, annotations});
  // }
  
  render(): JSX.Element {
    const {resourceURL} = this.props;
    const {annotations, selectedAnnotationId, start, end, selectedAnnotationType} = this.state;
    const selectedAnnotation = annotations.find(annotation => annotation.id === selectedAnnotationId)
    return (
      <Container id="annotator">
        <Row className="mb-4">
          <Waveform ref={this.waveform}
            resourceURL={resourceURL}
            createRegion={this.createRegion}
            updateRegion={this.updateRegion}
            selectRegion={this.selectRegion}
            deleteRegion={this.deleteRegion}
            initialRegions={annotations.map(annotationToWaveSurferRegion)}
          />
        </Row>
        <Row>
          {/* <Col md={4}>
            <Card>
                <Card.Header>Annotations for this resource</Card.Header>
                <ListGroup>
                  {annotations.map(annotation => {
                    return (<ListGroup.Item action active={annotation.id === selectedAnnotationId}
                      onClick={this.selectAnnotation.bind(this,annotation)}
                      >
                      {annotation.id}
                    </ListGroup.Item>)
                  })}
                </ListGroup>
            </Card>
          </Col> */}
          <Col md={8}>
            <Card>
              {/* <Card.Header>{fakeAnnotationToolkit.name}</Card.Header> */}
              <Card.Body>
                <Form onSubmit={this.saveRegion}>
                  <Row className="mb-3">
                    <Col sm={3}>
                      <Row>
                        <Form.Group controlId="start">
                          <Form.Label>Start</Form.Label>
                          <Form.Control type="number" name="start"
                            value={start || ''} step="0.5"
                            onChange={this.handleRegionStartEndChange}
                          />
                        </Form.Group>
                      </Row>
                      <Row>
                        <Form.Group controlId="end">
                          <Form.Label>End</Form.Label>
                          <Form.Control type="number" name="end"
                            value={end || ''} step="0.5"
                            onChange={this.handleRegionStartEndChange}
                          />
                        </Form.Group>
                      </Row>
                    </Col>
                    {selectedAnnotation && <Col as={Card}>
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
                        
                        {/* <Form.Group as={Row} controlId="annotationMotivation">
                          <Form.Label column sm="4">
                          Annotation motivation
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
                        </Form.Group> */}
                      </Col>
                    }
                  </Row>
                  {/* <Row className="mb-3">
                  {
                    this.getAnnotationComponent()
                  }
                  </Row> */}

                  <Row className="mb-3">
                    <TextArea content={selectedAnnotation?.body} handleTextChange={this.handleTextChange}
                      name="comment" label="Comment" type="textarea"/>
                  </Row>
                  <Button variant="success" type="submit" disabled={!selectedAnnotationId}>
                    Save
                  </Button>
                  <Button variant="danger" onClick={this.deleteRegion} disabled={!selectedAnnotationId}>
                    Delete
                  </Button>
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

  // private getAnnotationComponent = () =>
  // {
  //   const { selectedAnnotationId, annotations, selectedAnnotationType } = this.state;
  //   const annotation = annotations.find(annotation => annotation.id === selectedAnnotationId)
  //   switch (annotation?.motivation) {
  //     case AnnotationMotivation.COMMENTING:
  //       return <TextArea content={(annotation?.body as TextualBody).value} handleTextChange={this.handleTextChange}
  //         name="comment" label="Comment" type="textarea"/>
      
  //     case AnnotationMotivation.DESCRIBING:
  //       return <TextArea content={(annotation?.body as TextualBody).value} handleTextChange={this.handleTextChange}
  //         name="description" label="Description" type="textarea"/>
      
  //     case AnnotationMotivation.TAGGING:
  //       const {name, hasDefinedTerm} = selectedAnnotationType;
  //       return <Tags handleSelectionChange={this.handleTagsChange}
  //         name="tag" label={name} options={hasDefinedTerm}
  //         selected={[]}/>

  //     case AnnotationMotivation.ASSESSING:
  //       return <Rating rating={(annotation.body as RatingTemplate)} handleRatingChange={this.handleRatingChange}/>
  //     default:
  //       break;
  //   }
  // }
  
  // private getDefinedTermSetComponent = (definedTermSet:DefinedTermSet) =>
  // {
  //   const {name, hasDefinedTerm}= definedTermSet;
  //   return <Tags handleSelectionChange={this.handleTagsChange}
  //     name="tag" label={name} options={hasDefinedTerm}
  //     selected={[]}/>
  // }
  
};
  
  export default Annotator;