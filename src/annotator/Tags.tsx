import {ListGroup} from 'react-bootstrap-v5';
import type {DefinedTerm} from '../types';

type TagsProps = {
	selected?:string[];
	handleSelectionChange:(selectedTags:string[])=>void;
	options:DefinedTerm[];
	multiple?:boolean;
	name: string;
	label: string;
}
export default function Tags(props:TagsProps){
	const {handleSelectionChange, label, name, multiple, selected, options} = props;
		
	function handleTagClick(definedTerm:DefinedTerm, isOptionSelected:boolean){
		console.log("handleTagClick called with tag:",definedTerm);
		let newSelection:string[];
		const {termcode} = definedTerm;
		if(multiple){
			if(isOptionSelected){
				// filter out select
				newSelection = (selected ??[]).filter(existingTags => existingTags !== termcode);
			} else {
				//add to selected
				newSelection = (selected ??[]).concat(termcode);
			}
		} else if (!isOptionSelected){
			newSelection = [termcode];
		}
		else {
			newSelection = [];
		}
		handleSelectionChange(newSelection);
	}

	return (<div className="form-group">
		<label htmlFor={name}>{label}</label>
		<ListGroup>
			{options.map(option=>{
				const {termcode, image}=option;
				const isOptionSelected = Array.isArray(selected) && selected.includes(termcode);
				return <ListGroup.Item action active={isOptionSelected}
				onClick={handleTagClick.bind(null,option, isOptionSelected)}>
					{image && <img className="me-2" src={image} alt={termcode}></img>}
					{termcode}
				</ListGroup.Item>
			})}
		</ListGroup>
		</div>);
}