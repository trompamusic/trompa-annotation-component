import { AnnotationMotivation } from "./Annotator"

type RegionStub = {
	id: string;
	start: number;
	end: number;
	data: any;
	loop?:boolean;
	color:string;
	minLength?:number
}

type Region = {
	el?:HTMLElement;
	id: string;
	start: number;
	end: number;
	attributes: any;
	data: any;
	play(); // plays the region once from start to end.
	playLoop(); // plays the region on a loop.
	remove(); // removes the region.
	onDrag(timeInSeconds:number); // adds timeInSeconds to the start and end params.
	onResize(timeInSeconds:number, start?:boolean); // Adds timeInSeconds to end by default. The optional parameter 'start' will add timeInSeconds to start.
}

type AnnotationBodyBase = {
	type:AnnotationMotivation;
}
type AnnotationTextBody = AnnotationBodyBase & {
	value:string;
}
type AnnotationTagsBody = AnnotationBodyBase & {
	selectedTags:string[];
}
// An interchange format to communicate data that can change on Regions
type Annotation = {
	id: string;
	start: number;
	end: number;
	body: AnnotationTextBody | AnnotationTagsBody;
}

// An interchange format to communicate data that can change on Regions
type AnnotationCategory = {
	id: string;
	label: string;
	elements?:string[];
}

/** W3C Annotations */

type W3CAnnotation = {
    motivation:AnnotationMotivation;
	id: string;
	// type: "Annotation";
    creator?:string;
    created?:string;
	// For "classifying", not sure what the body is. Described only as "type" :https://www.w3.org/TR/annotation-vocab/#classifying
    // body?: TextualBody | TextualBody[] | RatingTemplate |  string;
    body?: string;
	target?: AnnotationTarget | string;
}

type AnnotationTarget = {
	type: 'AnnotationTarget';
	nodeId: string;
	fieldName?: string;
	fragment?: string;
}

type TextualBody = {
	type: 'TextualBody';
	value:string;
	language?:string;
	format?:string;
}

type DefinedTerm = {
	creator: string;
	identifier: string;
	additionalType: string;
	termcode: string;
	image?:string;
}
type DefinedTermSet = {
	creator: string;
	identifier: string;
	additionalType: string;
	name: string;
	hasDefinedTerm: DefinedTerm[];
}

type RatingTemplate = {
	creator: string;
	identifier: string;
	additionalType: string;
	name: string;
	bestRating: number;
	worstRating: number=1;
	ratingValue:number;
}