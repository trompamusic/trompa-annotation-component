import Annotation, {DefaultAnnotationMotivation} from "./Annotation";

export function randomColor(alpha:number) {
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
export function contentUrlOrSource(resource: Resource) {
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
export function nameOfContentUrlOrSource(resource: Resource) {
    if (resource.contentUrl !== undefined) {
        return "contentUrl"
    }
    return "source"
}


export function formatBodyForSolid(start:number, end:number, resource:Resource, motivation:DefaultAnnotationMotivation, creator?:string, id?:string, body?: TextualBody | TextualBody[] | RatingTemplate | string ){

    let fragment: string;
    if (start === end) {
        fragment = `t=${start}`;
    } else {
        fragment = `t=${start},${end}`;
    }
        return {
            id: id ?? "",
            creator,
            motivation: motivation,
            body: body as string,
            target: {
                nodeId: resource.identifier,
                fieldName: nameOfContentUrlOrSource(resource),
                fragment: fragment
            }
        }
}

export function annotationToWaveSurferRegion(annotation:Annotation): RegionInterchangeFormat | undefined {
    const {identifier, start, end} = annotation;
    if(isNaN(Number(start))){
        // No start time to display a region
        return;
    }
    // const start = Number((Math.random() *10).toFixed(2));
    // const end = Number((start + Math.random() *3).toFixed(2));
    return {
        id: identifier,
        color:randomColor(0.1),
        start: Number(start),
        end: Number(end),
    }
}

export function extractNameFromCreatorURI(uri?:string):string{
    if(!uri){
        return "-";
    }
    const regex = /\w+(?=.trompa-solid.upf.edu)/gm;
    const matches = regex.exec(uri)
    if(matches?.length){
        return matches[0];
    }
    return uri
}