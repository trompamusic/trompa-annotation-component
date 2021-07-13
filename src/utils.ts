import Annotation, {AnnotationMotivation, AnnotationTarget} from "./annotations/Annotation";
import {SolidAnnotation} from "./API/SolidAPI";
type AnnotationCETarget = TrompaAnnotationComponents.AnnotationCETarget;


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

export function formatBodyForSolid(start: number, end: number, resource: TrompaAnnotationComponents.Resource, motivation: AnnotationMotivation, creator?: string, id?: string, body?: TrompaAnnotationComponents.TextualBody | TrompaAnnotationComponents.TextualBody[] | TrompaAnnotationComponents.RatingTemplate | string) {
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

export function toSolid(annotation: Annotation, resource: TrompaAnnotationComponents.Resource):SolidAnnotation {
    console.debug("Annotation: ", annotation)
    console.debug("Resource: ", resource)
    let targets: AnnotationTarget[] | TrompaAnnotationComponents.AnnotationCETarget[] = annotation.target;
    if(!Array.isArray(targets)) { 
      targets = [targets]
    }
    let solidTarget:URL|URL[] = targets.map((t:AnnotationTarget|AnnotationCETarget) => {
      let target:URL;
      if(typeof t === "string") {
        target = new URL(t);
      } else {
        // figure out the url: if fieldName is set, use the value of that field of the Resource
        let url: string;
        if("fieldName" in t) {
          url = resource[t.fieldName!]
        } else {
          // ... otherwise use the url field
            if (!(t instanceof AnnotationTarget)) {
                url = t.url!
            } else {
                console.error("GOT UNDEFINED TARGET")
                url = "UNDEFINED FOR AnnotationTarget" // FIXME either handle this case if relevant, or use a 'never' type
            }
        }
        // figure out the fragment if one exists
        if("fragment" in t) {
          target = new URL(`${url}#${t.fragment}`);
        } else if("start" in t && "end" in t) {
          target = new URL(`${url}?t=${t.start!},${t.end}`)
        }
        else {
          // no fragment
          target = new URL(url)
        }
      }
      console.debug("Target: ", target)
      return target
    })

    solidTarget = solidTarget.filter(t => t !== null);
    if(solidTarget.length === 1) {
      solidTarget = solidTarget[0];
    }
/*
    let motivations: SolidMotivation[] | undefined;
    if(annotation.motivation) {
        if(!Array.isArray(annotation.motivation)) {
            motivations = [annotation.motivation]
        } else {
            motivations = annotation.motivation;
        }
    }
    if(motivations) {
        let solidMotivation: SolidMotivation | SolidMotivation[] = motivations.map((m) => {
            let ret: URL|string;
            if(typeof m === "AnnotationCEMotivation") {
                ret = new URL(WrapperBase + m.identifier);
            } else if (<any>Object.values(AnnotationMotivation).includes(m!)) {
                ret = m; // generic motivation string name
            }
        })
    }*/


    const solidAnnotation = {
      "@context": "https://www.w3.org/ns/anno.jsonld",
      target: solidTarget
    }
    return solidAnnotation
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
