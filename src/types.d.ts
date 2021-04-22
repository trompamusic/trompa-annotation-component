
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

type RegionInterchangeFormat = {
	id: string;
	start: number;
	end: number;
	color?:string;
	minLength?:number
}


type AnnotationBodyBase = {
	type:DefaultAnnotationMotivation;
}
type AnnotationTextBody = AnnotationBodyBase & {
	value:string;
}
type AnnotationTagsBody = AnnotationBodyBase & {
	selectedTags:string[];
}

// An interchange format to communicate data that can change on Regions
type AnnotationCategory = {
	id: string;
	label: string;
	elements?:string[];
}

// An object instance from the CE
type Resource = {
	identifier: string;
	creator: string;
	name: string;
	source?: string;
	contentUrl?: string;
	url?: string;
	[name: string]: any;
}

type AnnotationCETarget = {
	type: 'AnnotationTarget';
	identifier: string;
	nodeId: string;
	fieldName?: string;
	// If fieldName is set, url is the value of that field
	url?: string;
	// If the data comes from the CE, fragment will be set and we can parse it to start/end
	// If the type is created from the annotator, start/end will be set and we can serialise to fragment
	fragment?: string;
	start?:number;
	end?:number;
}

type AnnotationTarget = AnnotationCETarget | string;

type TextualBody = {
	type: 'TextualBody'
	identifier: string
	value:string;
	language?:string;
	format?:string;
}

type NodeBody = {
	type: 'NodeBody';
	identifier: string
}

type DefinedTerm = {
	type: 'DefinedTerm';
	creator: string;
	identifier: string;
	additionalType: string;
	termCode: string;
	image?:string;
	broaderUrl?:string;
	broaderMotivation?:string;
}

type DefinedTermSet = {
	type: 'DefinedTermSet';
	creator: string;
	identifier: string;
	additionalType: string;
	name: string;
	hasDefinedTerm: DefinedTerm[];
}

type RatingCommonType = {
	creator: string;
	identifier: string;
	additionalType: string;
	name?: string;
	bestRating: number;
	worstRating: number;
}
type RatingTemplate = RatingCommonType & {
	type: 'RatingTemplate';
}

type RatingType = RatingCommonType & {
	type: 'Rating';
	ratingValue:number;
}

type AnnotationCEMotivation = {
	type: 'AnnotationCEMotivation';
	identifier: string;
	creator: string;
	description: string;
	title: string;
	broaderUrl?:string;
	broaderMotivation?:string;
}

// CustomMotivation can be some fixed objects, or an external URL
type AnnotationCustomMotivation = DefinedTerm | AnnotationCEMotivation | string | undefined

// AnnotationBody can be any of these objects or a string (url) or empty
type AnnotationBody = DefinedTerm | TextualBody | NodeBody | RatingType | string | undefined
