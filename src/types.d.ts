// no types for this package:
declare module 'trompa-multimodal-component';

declare namespace TrompaAnnotationComponents {

    export type Region = {
        el?: HTMLElement;
        id: string;
        start: number;
        end: number;
        attributes: any;
        data: any;
        play(); // plays the region once from start to end.
        playLoop(); // plays the region on a loop.
        remove(); // removes the region.
        onDrag(timeInSeconds: number); // adds timeInSeconds to the start and end params.
        onResize(timeInSeconds: number, start?: boolean); // Adds timeInSeconds to end by default. The optional parameter 'start' will add timeInSeconds to start.
    }

    export type RegionInterchangeFormat = {
        id: string;
        start: number;
        end: number;
        color?: string;
        minLength?: number
    }


    export type AnnotationBodyBase = {
        type: AnnotationMotivation;
    }
    export type AnnotationTextBody = AnnotationBodyBase & {
        value: string;
    }
    export type AnnotationTagsBody = AnnotationBodyBase & {
        selectedTags: string[];
    }


    // An object instance from the CE
    export type Resource = {
        identifier: string;
        creator: string;
        name: string;
        source?: string;
        contentUrl?: string;
        url?: string;
        [name: string]: any;
    }

    export type AnnotationCETarget = {
        type: 'AnnotationTarget';
        identifier: string;
        nodeId: string;
        fieldName?: string;
        // If fieldName is set, url is the value of that field
        url?: string;
        // If the data comes from the CE, fragment will be set and we can parse it to start/end
        // If the export type is created from the annotator, start/end will be set and we can serialise to fragment
        fragment?: string;
        start?: number;
        end?: number;
    }

    export type TextualBody = {
        type: 'TextualBody'
        identifier: string
        value: string;
        language?: string;
        format?: string;
    }

    export type NodeBody = {
        type: 'NodeBody';
        identifier: string
    }

    export type DefinedTerm = {
        type: 'DefinedTerm';
        identifier?: string;
        creator: string;
        additionalType: string;
        termCode: string;
        image?: string;
    }

    export type DefinedTermSet = {
        type: 'DefinedTermSet';
        identifier?: string;
        creator: string;
        additionalType: string;
        name: string;
        description?: string;
        broaderUrl?: string;
        broaderMotivation?: string;
        hasDefinedTerm: DefinedTerm[];
    }

    export type RatingCommonType = {
        creator: string;
        identifier?: string;
        additionalType?: string;
        name?: string;
        description?: string;
        bestRating: number;
        worstRating: number;
    }
    export type RatingDefinition = RatingCommonType & {
        type: 'RatingDefinition';
    }

    export type RatingType = RatingCommonType & {
        type: 'Rating';
        ratingValue: number;
    }

    export type AnnotationCEMotivation = {
        type: 'AnnotationCEMotivation';
        identifier?: string;
        creator: string;
        description: string;
        title: string;
        broaderUrl?: string;
        broaderMotivation?: string;
    }

    // CustomMotivation can be some fixed objects, or an external URL
    // TODO: Should be DefinedTermSet
    export type AnnotationCustomMotivation = DefinedTerm | AnnotationCEMotivation | string | undefined

    // AnnotationBody can be any of these objects or a string (url) or empty
    export type AnnotationBody = DefinedTerm | TextualBody | NodeBody | RatingType
}
