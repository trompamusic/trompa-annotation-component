import React, {FunctionComponent, useState} from 'react';
import {Button, Col, FormControl, InputGroup, ListGroup, Row} from 'react-bootstrap-v5';
import {useMutation, useQuery} from "@apollo/client";
import {useLDflexValue} from "@solid/react";
import {
	ADDITIONAL_TYPE_TAG_COLLECTION, ADDITIONAL_TYPE_TAG_COLLECTION_ELEMENT,
	CreateDefinedTerm,
	CreateDefinedTermSet, DefinedTermFragment, DefinedTermSetFragment,
	DeleteDefinedTerm,
	DeleteDefinedTermSet, MergeDefinedTermSetHasDefinedTerm,
	QueryDefinedTermSetForUser
} from "../API/CEAPI";

type DefinedTermSetEditorProps = {}

const DefinedTermSetEditor: FunctionComponent<DefinedTermSetEditorProps> = () => {
	const userId = useLDflexValue("user");
	const {loading, error, data} = useQuery(QueryDefinedTermSetForUser, {
		variables: {
			creator: userId?.toString(),
			additionalType: "https://vocab.trompamusic.eu/vocab#TagCollection"
		},
		skip: !userId
	});
	const [createDefinedTerm] = useMutation(CreateDefinedTerm);
	const [deleteDefinedTerm] = useMutation(DeleteDefinedTerm, {
		update(cache, {data: {DeleteDefinedTerm}}) {
			cache.modify({
				fields: {
					DefinedTermSet(existingDt = []) {
					}
				}
			});
		}
	});
	const [createDefinedTermSet] = useMutation(CreateDefinedTermSet, {
			update(cache, {data: {CreateDefinedTermSet: foo}}) {
				cache.modify({
					fields: {
						DefinedTermSet(existingDts = []) {
							const newTodoRef = cache.writeFragment({
								data: foo,
								fragment: DefinedTermSetFragment,
								fragmentName: "DefinedTermSetFragment"
							});
							return [...existingDts, newTodoRef];
						}
					}
				});
			}
		});
	const [deleteDefinedTermSet] = useMutation(DeleteDefinedTermSet, {
		update(cache, {data: {DeleteDefinedTermSet}}) {
			cache.modify({
				fields: {
					DefinedTermSet(existingDts = []) {

					}
				}
			});
		}
	});
	const [addDefinedTermToDefinedTermSet] = useMutation(MergeDefinedTermSetHasDefinedTerm, );
	const [selectedDts, setSelectedDts] = useState<number>();
	const [newDts, setNewDts] = useState<string>('');
	const [newDt, setNewDt] = useState<string>('');

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error :(</p>;
	if (!data) return <p>no data</p>;
	return <Row><Col lg={5}><ListGroup> {
		data.DefinedTermSet.map((definedTermSet: TrompaAnnotationComponents.DefinedTermSet, index: number) => {
			return <ListGroup.Item action
								   active={selectedDts === index}
								   onClick={() => setSelectedDts(index)}
			>
				<Row>
					<Col>
						{definedTermSet.name}
					</Col>
					<Col xs={3}>
						<Button variant="outline-danger"
								size="sm" onClick={(e) =>
						{
							deleteDefinedTermSet({variables: {identifier: definedTermSet.identifier}});
							setSelectedDts(undefined)
							e.stopPropagation();
						}}>Delete</Button>
					</Col>
				</Row>
			</ListGroup.Item>
		})
	}
		<ListGroup.Item action>
			<InputGroup>
				<FormControl
					placeholder="New Category"
					aria-label="New Category"
					type="text" value={newDts}
					onChange={(e) => setNewDts(e.target.value)}
				/>
				<Button variant="outline-success"
					onClick={()=> {
						createDefinedTermSet({
							variables: {
								creator: userId?.toString(),
								name: newDts,
								additionalType: ADDITIONAL_TYPE_TAG_COLLECTION
							}})
						setNewDts('')
					}}>
					Create
				</Button>
			</InputGroup>
		</ListGroup.Item>
	</ListGroup>
	</Col>
		<Col>
			{selectedDts !== undefined && data.DefinedTermSet[selectedDts] && <>
				<h4>DefinedTerms</h4>
				<ListGroup>
					{data.DefinedTermSet[selectedDts].hasDefinedTerm?.map((definedTerm: TrompaAnnotationComponents.DefinedTerm) => {
						return (
							<ListGroup.Item action>
								<Row>
									<Col>
										{definedTerm.termCode}
									</Col>
									<Col xs={3}>
										<Button variant="outline-danger"
												size="sm" onClick={() => deleteDefinedTerm({variables: {identifier: definedTerm.identifier}})}>Delete</Button>
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
								type="text" value={newDt}
                                onChange={(e)=>setNewDt(e.target.value)}
							/>
							<Button variant="outline-success"
								onClick={
									()=> {
										createDefinedTerm({variables: {
												creator: userId?.toString(),
												termCode: newDt,
												additionalType: ADDITIONAL_TYPE_TAG_COLLECTION_ELEMENT
											}}).then((d) => {
												addDefinedTermToDefinedTermSet({variables: {
													fromId: data.DefinedTermSet[selectedDts].identifier,
														toId: d.data.CreateDefinedTerm.identifier
														}}
												)
											})
									}
								}>
								Create
							</Button>
						</InputGroup>
					</ListGroup.Item>
				</ListGroup>
			</>
			}
		</Col>
	</Row>


}
export default DefinedTermSetEditor;