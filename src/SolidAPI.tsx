import { AnnotationMotivation } from "./annotator/Annotator";
import { Annotation } from "./types";


export function saveAnnotation(annotation:Annotation) {
	const {id, start, end, body} = annotation;
	if(!annotation.id){
		// Create new annotation
	} else{
		// Update existing annotation
	}
}

export function deleteAnnotation(annotation:Annotation) {
	const {id, start, end, body} = annotation;
	if(!annotation.id){
		// Throw error, can't delete an annotation without an ID
	} else{
		// Delete existing annotation
	}
}

export function fetchAnnotations():Annotation[] {
	// Fetch annotations and format as {id, start, end, data}
	return [];
}

export function fetchAnnotationTypes():AnnotationMotivation[] {
	// Fetch annotation types
	return [];
}