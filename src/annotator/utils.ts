import type { W3CAnnotation, RegionStub,TextualBody, RatingTemplate } from '../types';
import {AnnotationMotivation} from './Annotator';

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


// export function getAnnotationMotivationFromDefinition(definition:any){
// 	switch (definition.myKey) {
// 		case "xyz":
// 			return AnnotationMotivation.ASSESSING;
// 		default:
// 			return AnnotationMotivation.COMMENTING;
// 	}
// }


export function formatBodyForSolid(start:number, end:number, resource:{identifier:string, contentURL: string}, motivation:AnnotationMotivation, creator?:string, id?:string, body?: TextualBody | TextualBody[] | RatingTemplate | string ):W3CAnnotation {
    // if (data.type === AnnotationMotivation.DESCRIBING){
    let fragment: string;
    if (start === end) {
        fragment = `t=${start}`;
    } else {
        fragment = `t=${start}-${end}`;
    }
        return {
            id: id ?? "",
            creator,
            // type: "Annotation",
            motivation: motivation,
            body: body as string,
            target: {
                type:"AnnotationTarget",
                nodeId: resource.identifier,
                fragment: fragment
            }
        }
    // }
}

export function annotationToWaveSurferRegion(annotation:W3CAnnotation): RegionStub {
    const {id, body} = annotation;
    const start = Number((Math.random() *10).toFixed(2));
    const end = Number((start + Math.random() *3).toFixed(2));
    return {
        id,
        data:body,
        color:randomColor(0.1),
        start,
        end,
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