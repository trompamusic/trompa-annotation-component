import { AnnotationMotivation } from "./annotator/Annotator";
import {Annotation, W3CAnnotation} from "./types";
import {ApolloClient, gql, useMutation} from "@apollo/client";
import jwt_decode from "jwt-decode";


const CreateAnnotationTextualBody = gql`
	mutation CreateAnnotationTextualBody($creator: String!, $value: String!, $format: String, $language: AvailableLanguage){
		CreateAnnotationTextualBody(
			creator: $creator
			value: $value
			format: $format
			language: $language
		) {
			identifier
		}
	}
`

const CreateAnnotationCETarget = gql`
	mutation CreateAnnotationCETarget($creator: String!, $field: String, $fragment: String) {
		CreateAnnotationCETarget(
			creator: $creator
			field: $field
			fragment: $fragment
		) {
			identifier
		}
	}
`

const MergeAnnotationCETargetTarget = gql`
	mutation MergeAnnotationCETargetTarget($annotationCeTargetId: String!, $CeNodeId: String!) {
		MergeAnnotationCETargetTarget(
			from: {identifier: $annotationCeTargetId}
			to: {identifier: $CeNodeId}
		) {
			from {identifier}
			to {dentifier}
		}
	}
`

const CreateAnnotation = gql`
	mutation CreateAnnotation($creator: String!, $motivation: AnnotationMotivation!) {
		CreateAnnotation(
			creator: $creator
			motivation: $motivation
		) {
			identifier
		}
	}
`

const MergeAnnotationTargetNode = gql`
	mutation MergeAnnotationTargetNode($annotationId: String!, $targetNodeId: String!){
		MergeAnnotationTargetNode(
			from: {identifier: $annotationId}
			to: {identifier: $targetNodeId}
		) {
			from {
				identifier
			}
			to {
				identifier
			}
		}
	}
`

const MergeAnnotationBodyText = gql`
	mutation MergeAnnotationBodyText($annotationId: String!, $bodyNodeId: String!){
		MergeAnnotationBodyText(
			from: {identifier: $annotationId}
			to: {identifier: $bodyNodeId}
		) {
			from {
				identifier
			}
			to {
				identifier
			}
		}
	}
`

const annotation_common = `
	identifier
	creator
	targetNode {
		target {
			__typename
			identifier
		}
		field
	}
	motivation
	motivationDefinedTerm {
		termCode
		broader
	}
	bodyText {
		value
		format
	}
	bodyNode {
		__typename
		... on DefinedTerm {
			termCode
			inDefinedTermSet {
				... on DefinedTermSet {
					identifier
					name
				}
			}
		}
		... on Rating {
			ratingValue
			bestRating
			worstRating
		}
	}
`

const GetAnnotationsForCreator = gql`
	query AnnotationForCreator($creator: String!) {
		Annotation(creator: $creator) {
			${annotation_common}
		}
	}
`

const GetAnnotationsForItem = gql`
	query AnnotationForNode($nodeId: String!) {
		Annotation(filter:{targetNode:{target:{identifier:$nodeId}}}) {
			${annotation_common}
		}
	}
`



export default class TrompaClient {
	apolloClient: ApolloClient<any>;
	authProxyUrl: string;

	constructor(authProxyUrl: string, apolloClient: ApolloClient<any>) {
		this.authProxyUrl = authProxyUrl;
		this.apolloClient = apolloClient;
		this.getApiToken();
	}

	getApiToken = async () => {
		if (this.apiTokenExpired()) {
			const result = await fetch(this.authProxyUrl);
			const j = await result.json();
			localStorage.setItem('CEAuthToken', j.token);
		}
	}

	apiTokenExpired = ():boolean => {
		let apiToken = localStorage.getItem('CEAuthToken')
		if (apiToken) {
			let decoded = jwt_decode(apiToken);
			let now = Date.now() / 1000;
			// @ts-ignore
			if (decoded.exp-now < 100) {
				return true;
			} else {
				return false;
			}
		}
		return true;
	}

	 saveAnnotation = async (annotation:W3CAnnotation) => {
		const {motivation, creator, id, body, target} = annotation;
		console.debug("creator", creator);
		await this.getApiToken();
		const response = await this.apolloClient.mutate(
			{mutation: CreateAnnotationTextualBody,
			variables: {creator:creator}})

		if(!annotation.id){
			// Create new annotation
		} else{
			// Update existing annotation
		}
	}

	getAnnotationsForUser = (user:string) => {
		this.getApiToken();
		this.apolloClient.query({query: GetAnnotationsForCreator, variables: {creator: user}})
	}

	getAnnotationsForItem = (nodeId:string) => {
		this.getApiToken();
		this.apolloClient.query({query: GetAnnotationsForItem, variables: {nodeId: nodeId}})
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