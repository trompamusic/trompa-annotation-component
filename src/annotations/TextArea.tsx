import React, {ChangeEvent} from 'react';

type TextAreaProps = {
    content?: string;
    handleTextChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    type: 'input' | 'textarea';
    name: string;
    label: string;
}
export default function TextArea(props: TextAreaProps) {

    const {handleTextChange, content, label, name, type} = props;
    return (<div className="form-group">
        <label htmlFor={name}>{label}</label>
        {
            type === "input" &&
            <input type="text" id={name} className="form-control" name={name} value={content || ''}
                   onChange={handleTextChange}/>
        }
        {
            type === "textarea" &&
            <textarea id={name} className="form-control" rows={3} name={name} value={content || ''}
                      onChange={handleTextChange}/>
        }
    </div>);
}
