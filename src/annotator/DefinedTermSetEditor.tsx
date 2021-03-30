import { Component, MouseEventHandler, ChangeEvent } from 'react';
import {Row, Col, Button, ListGroup,InputGroup, FormControl} from 'react-bootstrap-v5';
import type { DefinedTermSet, DefinedTerm } from '../types';

type DefinedTermSetEditorProps = {
	isAdmin?:boolean;
}
type DefinedTermSetEditorState = {
	// selectedCategoryId?:string;
	definedTermSet?:DefinedTermSet;
	label:string
}
export default class DefinedTermSetEditor extends Component<DefinedTermSetEditorProps, DefinedTermSetEditorState>{
	
	state = {
		label: "",
		definedTermSet: {
			creator: "https://alastair.trompa-solid.upf.edu/profile/card#me",
			identifier: "bc36b80d-c694-40dc-a9ed-37c7ba101779",
			additionalType: "https://vocab.trompamusic.eu/vocab#TagCollection",
			name: "Mood",
			hasDefinedTerm: [
				{
					creator: "https://alastair.trompa-solid.upf.edu/profile/card#me",
					identifier: "d415d9f7-bb6f-4a4a-8e5e-80d97c1cb2de",
					additionalType: "https://vocab.trompamusic.eu/vocab#TagCollectionElement",
					termcode: "Happy"
				},
				{
					creator: "https://alastair.trompa-solid.upf.edu/profile/card#me",
					identifier: "ceb5b57f-17ed-467e-9cfd-ae955fe15cc7",
					additionalType: "https://vocab.trompamusic.eu/vocab#TagCollectionElement",
					termcode: "Sad"
				}
			]
		},
	}
	
	handleLabelChange = (event:ChangeEvent<HTMLInputElement>) => {
		this.setState({label: event.target.value});
	}

	createCategory:MouseEventHandler<HTMLElement> = () => {
		const {label} = this.state;
	}
	
	deleteTerm = (term:DefinedTerm) => {

	}
	
	render(){
		const { isAdmin} = this.props;
		const {definedTermSet,label} = this.state;
		// const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
		
		return (
			<Row>
				<Col>
					<h4>DefinedTermSet</h4>
					<div>name: {definedTermSet?.name}</div>
					<div>creator: {definedTermSet?.creator}</div>
					<div>identifier: {definedTermSet?.identifier}</div>
					<div>additionalType: {definedTermSet?.additionalType}</div>
				</Col>
				<Col>
					<h4>DefinedTerms</h4>
					<ListGroup>
						{definedTermSet?.hasDefinedTerm?.map((definedTerm: DefinedTerm)=>{
							return (
								<ListGroup.Item action
									// active={selectedCategoryId === category.id}
									// onClick={this.handleSelection.bind(null,category)}
								>
									<Row>
										<Col>
											{definedTerm.termcode}
										</Col>
										<Col xs={3}>
											{isAdmin && <Button variant="outline-danger" size="sm" onClick={this.deleteTerm.bind(this,definedTerm)}>Delete</Button>}
										</Col>
									</Row>
								</ListGroup.Item>
							)
						})}
						<ListGroup.Item action>
							<InputGroup>
								<FormControl
								placeholder="New Category"
								aria-label="New Category"
								type="text" value={label}
								onChange={this.handleLabelChange}
							/>
								<Button variant="outline-success"
									onClick={this.createCategory}>
									Create
								</Button>
							</InputGroup>
						</ListGroup.Item>
					</ListGroup>
				</Col>
				{/* <Col>
				<ListGroup>
					{selectedCategory?.elements && selectedCategory.elements.map((element:string)=>{
						return <ListGroup.Item action>{element}</ListGroup.Item>
					})}
				</ListGroup>
				</Col> */}
			</Row>
			);
	}
}