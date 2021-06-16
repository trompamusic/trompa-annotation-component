import Annotation, {AnnotationMotivation} from "../annotations/Annotation";

export function saveAnnotation(annotation: Annotation) {
    const {identifier, start, end, body} = annotation;
    if (!identifier) {
        // Create new annotation
    } else {
        // Update existing annotation
    }
}

export function deleteAnnotation(annotation: Annotation) {
    const {identifier, start, end, body} = annotation;
    if (!identifier) {
        // Throw error, can't delete an annotation without an ID
    } else {
        // Delete existing annotation
    }
}

export function fetchAnnotations(): Annotation[] {
    // Fetch annotations and format as {id, start, end, data}
    return [];
}

export function fetchAnnotationTypes(): AnnotationMotivation[] {
    // Fetch annotation types
    return [];
}
