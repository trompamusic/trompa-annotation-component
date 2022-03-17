import React from 'react';
import {ListGroup} from 'react-bootstrap-v5';

type TagsProps = {
    selected?: string[];
    handleSelectionChange: (selectedTags: string[]) => void;
    options: TrompaAnnotationComponents.DefinedTerm[];
    multiple?: boolean;
    name: string;
    label: string;
}
export default function Tags(props: TagsProps) {
    const {handleSelectionChange, label, name, multiple, selected, options} = props;

    function handleTagClick(definedTerm: TrompaAnnotationComponents.DefinedTerm, isOptionSelected: boolean) {
        console.log("handleTagClick called with tag:", definedTerm);
        let newSelection: string[];
        const {termCode} = definedTerm;
        if (multiple) {
            if (isOptionSelected) {
                // filter out select
                newSelection = (selected ?? []).filter(existingTags => existingTags !== termCode);
            } else {
                //add to selected
                newSelection = (selected ?? []).concat(termCode);
            }
        } else if (!isOptionSelected) {
            newSelection = [termCode];
        } else {
            newSelection = [];
        }
        handleSelectionChange(newSelection);
    }

    return (<div className="form-group">
        <label htmlFor={name}>{label}</label>
        <ListGroup>
            {options.map(option => {
                const {termCode, image} = option;
                const isOptionSelected = Array.isArray(selected) && selected.includes(termCode);
                return <ListGroup.Item key={termCode} action active={isOptionSelected}
                                       onClick={handleTagClick.bind(null, option, isOptionSelected)}>
                    {image && <img className="me-2" src={image} alt={termCode} />}
                    {termCode}
                </ListGroup.Item>
            })}
        </ListGroup>
    </div>);
}
