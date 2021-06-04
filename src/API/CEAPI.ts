import Annotation from "../annotations/Annotation";
import {ApolloClient, gql} from "@apollo/client";
import jwt_decode from "jwt-decode";

// For saying that a Rating is just a definition
export const RATING_DEFINITION_ADDITIONAL_TYPE = "https://vocab.trompamusic.eu/vocab#RatingDefinition"
// For making DefinedTerms that are a collection of tags
export const ADDITIONAL_TYPE_TAG_COLLECTION = "https://vocab.trompamusic.eu/vocab#TagCollection"
export const ADDITIONAL_TYPE_TAG_COLLECTION_ELEMENT = "https://vocab.trompamusic.eu/vocab#TagCollectionElement"
// For making DefinedTerms that are a collection of annotation motivations
export const ADDITIONAL_TYPE_MOTIVATION_COLLECTION = "https://vocab.trompamusic.eu/vocab#AnnotationMotivationCollection"
export const ADDITIONAL_TYPE_MOTIVATION_COLLECTION_ELEMENT = "https://vocab.trompamusic.eu/vocab#AnnotationMotivationCollectionElement"
// For saying that an ItemList is an annotation toolkit
export const ADDITIONAL_TYPE_ANNOTATION_TOOLKIT = "https://vocab.trompamusic.eu/vocab#AnnotationToolkit"
// For saying that an ItemList is an annotation session
export const ADDITIONAL_TYPE_ANNOTATION_SESSION = "https://vocab.trompamusic.eu/vocab#AnnotationSession"
export const OA_ANNOTATION_MOTIVATION_TYPE = "http://www.w3.org/ns/oa#Motivation"

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

    apiTokenExpired = (): boolean => {
        let apiToken = localStorage.getItem('CEAuthToken')
        if (apiToken) {
            let decoded = jwt_decode(apiToken);
            let now = Date.now() / 1000;
            // @ts-ignore
            if (decoded.exp - now < 100) {
                return true;
            } else {
                return false;
            }
        }
        return true;
    }

    saveAnnotation = async (annotation: Annotation) => {
        // TODO: Update if it already exists
        console.debug(annotation);
        const {motivation, creator, identifier, body, target} = annotation;
        await this.getApiToken();

        if (!motivation) {
            throw new TypeError("Annotation must have a motivation")
        }
        if (!target) {
            throw new TypeError("Annotation must have a target")
        }

        // Create body
        let bodyId: string | undefined;
        if (body) {
            if (typeof body === "string") {

            } else if (body.type === "TextualBody") {
                let response = await this.apolloClient.mutate({
                    mutation: CreateAnnotationTextualBody,
                    variables: {creator: creator, value: body.value, language: body.language, format: body.format}
                })
                if (response.errors) {
                    console.error(response.errors)
                } else {
                    bodyId = response.data.CreateAnnotationTextualBody.identifier;
                }
            } else if (body.type === "DefinedTerm") {

            } else if (body.type === "NodeBody") {

            } else if (body.type === "Rating") {

            }
        }

        // Create target
        let targetId: string | undefined;
        if (typeof target === "string") {

        } else if (target.type === "AnnotationTarget") {
            let response = await this.apolloClient.mutate({
                mutation: CreateAnnotationCETarget,
                variables: {creator: creator, field: target.fieldName, fragment: annotation.timeString}
            })
            if (response.errors) {
                console.error(response.errors)
            } else {
                targetId = response.data.CreateAnnotationCETarget.identifier;
                response = await this.apolloClient.mutate({
                    mutation: MergeAnnotationCETargetTarget,
                    variables: {annotationCeTargetId: targetId, ceNodeId: target.nodeId}
                })
                if (response.errors) {
                    console.error(response.errors)
                }
            }
        }

        // Create annotation
        let response = await this.apolloClient.mutate({
            mutation: CreateAnnotation,
            variables: {creator: creator, motivation: motivation}
        })
        if (response.errors) {
            console.error(response.errors)
        } else {
            const annotationId = response.data.CreateAnnotation.identifier;
            if (bodyId) {
                response = await this.apolloClient.mutate({
                    mutation: MergeAnnotationBodyText,
                    variables: {annotationId: annotationId, bodyNodeId: bodyId}
                })
                if (response.errors) {
                    console.error(response.errors)
                }
            }
            if (targetId) {
                try {
                    response = await this.apolloClient.mutate({
                        mutation: MergeAnnotationTargetNode,
                        variables: {annotationId: annotationId, targetNodeId: targetId}
                    })
                } catch (e) {
                    console.error(e)
                }
            }
        }

        // Join annotation + motivation (if motivation is custom)
        // Join annotation + target
        // Join annotation + body
    }
    deleteAnnotation = async (identifier: string) => {
        await this.getApiToken();
        return await this.apolloClient.mutate({mutation: DeleteAnnotation, variables: {annotationId: identifier}})
    }

    getAnnotation = async (identifier: string) => {
        await this.getApiToken();
        return await this.apolloClient.query({query: GetAnnotation, variables: {annotationId: identifier}})
    }

    getAnnotationsForUser = async (user: string) => {
        await this.getApiToken();
        return await this.apolloClient.query({query: GetAnnotationsForCreator, variables: {creator: user}})
    }

    getAnnotationsForItem = (nodeId: string) => {
        this.getApiToken();
        this.apolloClient.query({query: GetAnnotationsForItem, variables: {nodeId: nodeId}})
    }

    getAnnotationToolkitForItem = (itemId: string) => {
        this.getApiToken();
        this.apolloClient.query({query: GetAnnotationToolkitForItem, variables: {itemId: itemId}})
    }

    createOrUpdateDefinedTerm = (definedTerm: TrompaAnnotationComponents.DefinedTerm) => {

    }

    createOrUpdateDefinedTermSet = (definedTerm: TrompaAnnotationComponents.DefinedTermSet) => {

    }

    getDefinedTermSetsForUser = (user: string, additionalType: string) => {

    }

    getAnnotationPaletteForUser = (user: string) => {
        return this.getDefinedTermSetsForUser(user, ADDITIONAL_TYPE_MOTIVATION_COLLECTION);
    }

    getAnnotationToolkitForUser = (user: string) => {
        return this.getDefinedTermSetsForUser(user, ADDITIONAL_TYPE_ANNOTATION_TOOLKIT);
    }
}

export const DefinedTermFragment = gql`
    fragment DefinedTermFragment on DefinedTerm {
        identifier
        additionalType
        termCode
        image
        broaderUrl
        broaderMotivation
    }
`;

export const DefinedTermSetFragment = gql`
    ${DefinedTermFragment}
    fragment DefinedTermSetFragment on DefinedTermSet {
        type: __typename
        identifier
        name
        creator
        additionalType
        hasDefinedTerm {
            ...DefinedTermFragment
        }
    }
`;

export const CreateDefinedTermSet = gql`
    ${DefinedTermSetFragment}
    mutation CreateDefinedTermSet($creator: String!, $name: String!, $additionalType: String!) {
        CreateDefinedTermSet(
            additionalType: [$additionalType]
            creator: $creator
            name: $name
        ) {
            ...DefinedTermSetFragment
        }
    }
`;

export const UpdateDefinedTermSet = gql`
    ${DefinedTermSetFragment}
    mutation UpdateDefinedTermSet($identifier: ID!, $creator: String!, $name: String!, $additionalType: String!) {
        UpdateDefinedTermSet(
            identifier: $identifier
            additionalType: [$additionalType]
            creator: $creator
            name: $name
        ) {
            ...DefinedTermSetFragment
        }
    }
`;

export const DeleteDefinedTermSet = gql`
    mutation DeleteDefinedTermSet($identifier: ID!) {
        DeleteDefinedTermSet(identifier: $identifier) {
            identifier
        }
    }
`;

export const CreateDefinedTerm = gql`
    mutation CreateDefinedTerm($creator: String!, $additionalType: String!, $termCode: String!, $image: String) {
        CreateDefinedTerm(
            additionalType: [$additionalType]
            creator: $creator
            termCode: $termCode
            image: $image
        ) {
            identifier
        }
    }
`;

export const UpdateDefinedTerm = gql`
    mutation UpdateDefinedTerm($identifier: ID!, $creator: String!, $additionalType: String!, $termCode: String, $image: String) {
        UpdateDefinedTerm(
            identifier: $identifier
            additionalType: [$additionalType]
            creator: $creator
            termCode: $termCode
            image: $image
        ) {
            identifier
        }
    }
`;

export const DeleteDefinedTerm = gql`
    mutation DeleteDefinedTerm($identifier: ID!) {
        DeleteDefinedTerm(identifier: $identifier) {
            identifier
        }
    }
`;

export const MergeDefinedTermSetHasDefinedTerm = gql`
    mutation MergeDefinedTermSetHasDefinedTerm($fromId: ID!, $toId: ID!) {
        MergeDefinedTermSetHasDefinedTerm(
            from: {identifier: $fromId}
            to: {identifier: $toId}
        ) {
            from {
                identifier
            }
            to {
                identifier
            }
        }
    }
`;

export const QueryDefinedTermSetForUser = gql`
    ${DefinedTermSetFragment}
    query DefinedTermSet($creator: String!, $additionalType: String!) {
        DefinedTermSet(creator: $creator filter: {additionalType_contains: [$additionalType]}) {
            ...DefinedTermSetFragment
        }
    }
`;

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
    mutation MergeAnnotationCETargetTarget($annotationCeTargetId: ID!, $ceNodeId: ID!) {
        MergeAnnotationCETargetTarget(
            from: {identifier: $annotationCeTargetId}
            to: {identifier: $ceNodeId}
        ) {
            from {identifier}
            to {identifier}
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

const DeleteAnnotation = gql`
    mutation DeleteAnnotation($annotationId: ID!) {
        DeleteAnnotation(identifier: $annotationId) {
            identifier
        }
    }
`;

const MergeAnnotationTargetNode = gql`
    mutation MergeAnnotationTargetNode($annotationId: ID!, $targetNodeId: ID!){
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
    mutation MergeAnnotationBodyText($annotationId: ID!, $bodyNodeId: ID!){
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
	created {
		formatted
	}
	targetUrl
	targetNode {
		target {
			__typename
			identifier
			url
			source
			... on MediaObject {
			    contentUrl
			}
			... on AudioObject {
			    contentUrl
			}
		}
		field
		fragment
	}
    motivation
    motivationUrl
    motivationNode {
      identifier
      creator
      broaderMotivation
      broaderUrl
      title
      description
    }
    motivationDefinedTerm {
      identifier
      broaderMotivation
      termCode
      broaderUrl
      additionalType
    }
	bodyUrl
	bodyText {
		identifier
		value
		format
		language
	}
	bodyNode {
		__typename
		identifier
		... on DefinedTerm {
			termCode
			additionalType
			inDefinedTermSet {
				... on DefinedTermSet {
					identifier
					additionalType
					name
				}
			}
		}
		... on Rating {
		    creator
			ratingValue
			bestRating
			worstRating
			additionalType
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

const GetAnnotation = gql`
    query Annotation($annotationId: ID!) {
        Annotation(identifier: $annotationId) {
            ${annotation_common}
        }
    }
`

const GetAnnotationToolkitForItem = gql`
    query AnnotationToolkitForItem($itemId: ID!) {
        ItemList(identifier:$itemId) {
            additionalType
            identifier
            name
            itemListElement {
                ... on ListItem {
                    identifier
                    name
                    itemUrl
                    item {
                        __typename
                        identifier
                        ... on DefinedTermSet {
                            name
                            additionalType
                            hasDefinedTerm {
                                identifier
                                broaderUrl
                                broaderMotivation
                                termCode
                                image
                            }
                        }
                        ... on Rating {
                            name
                            worstRating
                            bestRating
                        }
                    }
                }
            }
        }
    }
`;
