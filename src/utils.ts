import Annotation, {AnnotationMotivation, AnnotationTarget} from "./annotations/Annotation";

export function randomColor(alpha: number) {
    return (
        'rgba(' +
        [
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            alpha || 1
        ] +
        ')'
    );
}

/**
 * If contentUrl exists on resource, return the value of it, otherwise
 * return source
 * @param resource
 */
export function contentUrlOrSource(resource: TrompaAnnotationComponents.Resource) {
    if (resource.contentUrl !== undefined) {
        return resource.contentUrl;
    }
    return resource.source;
}

/**
 * If contentUrl exists on resource, return "contentUrl" (the name
 * of the field) otherwise return "source"
 * @param resource
 */
export function nameOfContentUrlOrSource(resource: TrompaAnnotationComponents.Resource) {
    if (resource.contentUrl !== undefined) {
        return "contentUrl"
    }
    return "source"
}

export function startAndEndFromAnnotation(annotation: Annotation): [number?, number?] {
    let start;
    let end;
    if (annotation.target[0] instanceof AnnotationTarget) {
        start = annotation.target[0].fragmentStart;
        end = annotation.target[0].fragmentEnd;
    } else {
        start = annotation.target[0].start;
        end = annotation.target[0].end;
    }
    return [start, end];
}

export function annotationToWaveSurferRegion(annotation: Annotation): TrompaAnnotationComponents.RegionInterchangeFormat | undefined {
    const {identifier} = annotation;
    const [start, end] = startAndEndFromAnnotation(annotation);
    if (isNaN(Number(start))) {
        // No start time to display a region
        return;
    }
    return {
        id: identifier,
        color: randomColor(0.1),
        start: Number(start),
        end: Number(end),
    }
}

export function extractNameFromCreatorURI(uri?: string): string {
    if (!uri) {
        return "-";
    }
    const regex = /\w+(?=.trompa-solid.upf.edu)/gm;
    const matches = regex.exec(uri)
    if (matches?.length) {
        return matches[0];
    }
    return uri
}

export function timeToPrecision(time: number | string | undefined): number {
    if (typeof time === "undefined" || time === null) {
        return NaN
    }
    return Number(Number(time).toFixed(2))
}